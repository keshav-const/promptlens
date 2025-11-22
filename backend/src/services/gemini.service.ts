import { config } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface OptimizeResult {
  optimizedPrompt: string;
  explanation: string;
}

interface GeminiModel {
  name: string;
  displayName: string;
  supportedGenerationMethods: string[];
}

interface ListModelsResponse {
  models: GeminiModel[];
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY =
  1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiService {
  private apiKey: string;
  private baseUrl: string | null = null;
  private availableModels: GeminiModel[] = [];
  private initialized = false;

  constructor() {
    this.apiKey = config.GEMINI_API_KEY || 'test-key';
  }

  /**
  
  Discover available models from the Gemini API
  */
  private async discoverModels(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (config.NODE_ENV === 'test' && this.apiKey === 'test-key') {
      // Skip model discovery in test environment
      this.initialized = true;
      return;
    }

    try {
      console.log('🔍 Discovering available Gemini models...');

      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list models: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as ListModelsResponse;

      if (!data.models || data.models.length === 0) {
        throw new Error('No models available from Gemini API');
      }

      // Filter models that support generateContent
      this.availableModels = data.models.filter((model) =>
        model.supportedGenerationMethods.includes('generateContent')
      );

      if (this.availableModels.length === 0) {
        throw new Error('No models found that support generateContent');
      }

      // Prefer free-tier Flash models first
      let selectedModel = this.availableModels.find(
        (m) => m.name.includes('gemini-2.0-flash') && !m.name.includes('lite') && !m.name.includes('exp')
      );

      if (!selectedModel) {
        selectedModel = this.availableModels.find(
          (m) => m.name.includes('gemini-flash') && !m.name.includes('lite') && !m.name.includes('pro')
        );
      }

      if (!selectedModel) {
        selectedModel = this.availableModels.find(
          (m) => m.name.includes('flash-lite')
        );
      }

      if (!selectedModel) {
        selectedModel = this.availableModels[0];
      }

      // Build the base URL using the discovered model name
      // Model name comes in format "models/gemini-1.5-pro", we need to use it directly
      this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel.name}:generateContent`;

      console.log(`✅ Selected model: ${selectedModel.displayName} (${selectedModel.name})`);
      console.log(`📊 Available models: ${this.availableModels.map(m => m.displayName).join(', ')}`);

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to discover Gemini models:', error);
      throw new AppError(
        `Failed to initialize Gemini API: ${(error as Error).message}`,
        503,
        'GEMINI_INIT_ERROR'
      );
    }
  }

  /**
  
  Get available models (for debugging)
  */
  getAvailableModels(): GeminiModel[] {
    return this.availableModels;
  }
  async optimizePrompt(prompt: string, mode: 'enhanced' | 'concise' = 'concise'): Promise<OptimizeResult> {

    // Ensure models are discovered before making API calls
    await this.discoverModels();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.callGeminiAPI(prompt, mode);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`Gemini API attempt ${attempt + 1} failed:`, error);

        // Log available models on error to help with debugging
        if (this.availableModels.length > 0) {
          console.error(
            `Available models: ${this.availableModels.map((m) => `${m.displayName} (${m.name})`).join(', ')}`
          );
        }

        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    const errorMessage = this.availableModels.length > 0
      ? `Failed to optimize prompt after ${MAX_RETRIES} attempts: ${lastError?.message}. Available models: ${this.availableModels.map((m) => m.displayName).join(', ')}`
      : `Failed to optimize prompt after ${MAX_RETRIES} attempts: ${lastError?.message}`;

    throw new AppError(
      errorMessage,
      503,
      'GEMINI_API_ERROR'
    );
  }

  private async callGeminiAPI(prompt: string, mode: 'enhanced' | 'concise' = 'concise'): Promise<OptimizeResult> {
    if (config.NODE_ENV === 'test' && this.apiKey === 'test-key') {
      throw new Error('Gemini API called in test environment without mock');
    }

    if (!this.baseUrl) {
      throw new Error('Gemini API not initialized - no model URL available');
    }

    const enhancedSystemPrompt = `You are a prompt optimization expert. Your task is to ENHANCE and EXPAND the given prompt:

CRITICAL REQUIREMENTS for Enhanced Mode:
1. Make the prompt MORE DETAILED and COMPREHENSIVE than the original
2. ADD specific examples, constraints, and context that improve AI understanding
3. EXPAND on vague instructions with concrete details
4. Include formatting requirements, tone specifications, and output structure
5. The enhanced prompt SHOULD BE LONGER than the original (this is expected and desired)
6. Focus on QUALITY and CLARITY over brevity

Format your response as JSON:
{
  "optimized": "The enhanced, detailed, comprehensive prompt (should be LONGER than original)",
  "explanation": "Brief explanation of enhancements and quality improvements added"
}`;

    const conciseSystemPrompt = `You are a prompt optimization expert. Your task is to make the prompt SHORTER and MORE EFFICIENT:

CRITICAL REQUIREMENTS for Concise Mode:
1. The optimized prompt MUST use FEWER tokens than the original
2. Remove ALL redundant words and unnecessary details
3. Use shorter phrasing while maintaining clarity
4. Eliminate verbose explanations
5. Keep only essential information
6. The result should be SIGNIFICANTLY SHORTER than the original

Format your response as JSON:
{
  "optimized": "The concise, efficient prompt (should be SHORTER than original)",
  "explanation": "Brief explanation of token savings and improvements"
}`;

    const systemPrompt = mode === 'enhanced' ? enhancedSystemPrompt : conciseSystemPrompt;

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

      // Enhanced error message for 404s
      if (response.status === 404) {
        const availableModelsMsg = this.availableModels.length > 0
          ? `\nAvailable models: ${this.availableModels.map((m) => `${m.displayName} (${m.name})`).join(', ')}`
          : '';
        throw new Error(
          `Gemini API model not found (404) - Model URL: ${this.baseUrl}${availableModelsMsg}\nError: ${errorText}`
        );
      }

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
        optimizedPrompt: parsed.optimized,
        explanation: parsed.explanation,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error(`Failed to parse Gemini response: ${(parseError as Error).message}`);
    }
  }
}

export const geminiService = new GeminiService();