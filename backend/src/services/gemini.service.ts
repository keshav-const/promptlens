import { config } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface OptimizeResult {
  optimized: string;
  explanation: string;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

  constructor() {
    this.apiKey = config.GEMINI_API_KEY || 'test-key';
  }

  async optimizePrompt(prompt: string): Promise<OptimizeResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.callGeminiAPI(prompt);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`Gemini API attempt ${attempt + 1} failed:`, error);

        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    throw new AppError(
      `Failed to optimize prompt after ${MAX_RETRIES} attempts: ${lastError?.message}`,
      503,
      'GEMINI_API_ERROR'
    );
  }

  private async callGeminiAPI(prompt: string): Promise<OptimizeResult> {
    if (config.NODE_ENV === 'test' && this.apiKey === 'test-key') {
      throw new Error('Gemini API called in test environment without mock');
    }

    const systemPrompt = `You are a prompt optimization expert. Your task is to analyze the given prompt and provide:
1. An optimized version that is clearer, more specific, and more effective
2. A brief explanation of the improvements made

Format your response as JSON with the following structure:
{
  "optimized": "The improved prompt text",
  "explanation": "Brief explanation of improvements"
}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nOriginal prompt to optimize:\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const url = `${this.baseUrl}?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0]
    ) {
      throw new Error('Invalid response format from Gemini API');
    }

    const responseText = data.candidates[0].content.parts[0].text || '';

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.optimized || !parsed.explanation) {
        throw new Error('Missing required fields in response');
      }

      return {
        optimized: parsed.optimized,
        explanation: parsed.explanation,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error(`Failed to parse Gemini response: ${(parseError as Error).message}`);
    }
  }
}

export const geminiService = new GeminiService();
