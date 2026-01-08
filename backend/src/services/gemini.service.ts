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
  private prioritizedModels: GeminiModel[] = [];
  private currentModelIndex = 0;
  private initialized = false;

  constructor() {
    this.apiKey = config.GEMINI_API_KEY || 'test-key';
  }

  /**
   * Switch to the next available model (used when current model is rate-limited)
   */
  private switchToNextModel(): boolean {
    if (this.currentModelIndex < this.prioritizedModels.length - 1) {
      this.currentModelIndex++;
      const newModel = this.prioritizedModels[this.currentModelIndex];
      this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/${newModel.name}:generateContent`;
      console.log(`🔄 Switching to fallback model: ${newModel.displayName} (${newModel.name})`);
      return true;
    }
    return false;
  }

  /**
   * Reset to the preferred model (call periodically or on new day)
   */
  resetToPreferredModel(): void {
    if (this.prioritizedModels.length > 0) {
      this.currentModelIndex = 0;
      const preferredModel = this.prioritizedModels[0];
      this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/${preferredModel.name}:generateContent`;
      console.log(`🔄 Reset to preferred model: ${preferredModel.displayName}`);
    }
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

      // Build a prioritized list of models for fallback
      // Priority: gemini-2.0-flash > gemini-2.0-flash-lite > gemini-2.5-flash > gemini-2.5-flash-lite > others
      this.prioritizedModels = [];

      // Priority 1: gemini-2.0-flash (main free tier model)
      const flash20 = this.availableModels.find(
        (m) => m.name === 'models/gemini-2.0-flash' ||
          (m.name.includes('gemini-2.0-flash') && !m.name.includes('lite') && !m.name.includes('exp') && !m.name.includes('image'))
      );
      if (flash20) this.prioritizedModels.push(flash20);

      // Priority 2: gemini-2.0-flash-lite (cheap alternative)
      const flashLite20 = this.availableModels.find(
        (m) => m.name === 'models/gemini-2.0-flash-lite' || m.name.includes('gemini-2.0-flash-lite')
      );
      if (flashLite20 && !this.prioritizedModels.includes(flashLite20)) this.prioritizedModels.push(flashLite20);

      // Priority 3: gemini-2.5-flash
      const flash25 = this.availableModels.find(
        (m) => m.name === 'models/gemini-2.5-flash' ||
          (m.name.includes('gemini-2.5-flash') && !m.name.includes('lite') && !m.name.includes('preview'))
      );
      if (flash25 && !this.prioritizedModels.includes(flash25)) this.prioritizedModels.push(flash25);

      // Priority 4: gemini-2.5-flash-lite
      const flashLite25 = this.availableModels.find(
        (m) => m.name === 'models/gemini-2.5-flash-lite' || m.name.includes('gemini-2.5-flash-lite')
      );
      if (flashLite25 && !this.prioritizedModels.includes(flashLite25)) this.prioritizedModels.push(flashLite25);

      // Priority 5: Any other flash models not already added
      const otherFlash = this.availableModels.filter(
        (m) => m.name.includes('flash') && !this.prioritizedModels.includes(m) && !m.name.includes('image') && !m.name.includes('tts')
      );
      this.prioritizedModels.push(...otherFlash);

      // Fallback: first available model if no flash models found
      if (this.prioritizedModels.length === 0) {
        this.prioritizedModels.push(this.availableModels[0]);
      }

      // Set the initial model
      this.currentModelIndex = 0;
      const selectedModel = this.prioritizedModels[0];
      this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel.name}:generateContent`;

      console.log(`✅ Selected model: ${selectedModel.displayName} (${selectedModel.name})`);
      console.log(`📊 Fallback models: ${this.prioritizedModels.map(m => m.displayName).join(' → ')}`);
      console.log(`📊 Total available models: ${this.availableModels.length}`);

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
    let totalAttempts = 0;
    const maxTotalAttempts = MAX_RETRIES * this.prioritizedModels.length;

    // Try each model in the priority list
    for (let modelIndex = 0; modelIndex < this.prioritizedModels.length; modelIndex++) {
      // Set current model for this attempt
      if (modelIndex > 0) {
        this.switchToNextModel();
      }

      const currentModel = this.prioritizedModels[this.currentModelIndex];

      // Try this model with retries
      for (let attempt = 0; attempt < MAX_RETRIES && totalAttempts < maxTotalAttempts; attempt++) {
        totalAttempts++;
        try {
          const response = await this.callGeminiAPI(prompt, mode);
          return response;
        } catch (error) {
          lastError = error as Error;
          const errorMessage = (error as Error).message;

          console.error(`Gemini API attempt ${totalAttempts} with ${currentModel.displayName} failed:`, errorMessage);

          // Check if this is a 429 quota error
          const isQuotaError = errorMessage.includes('429') ||
            errorMessage.includes('RESOURCE_EXHAUSTED') ||
            errorMessage.includes('quota');

          if (isQuotaError) {
            console.log(`⚠️ Rate limit hit on ${currentModel.displayName}, trying next model...`);
            // Break inner retry loop to try next model immediately
            break;
          }

          // For non-quota errors, apply exponential backoff and retry same model
          if (attempt < MAX_RETRIES - 1) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await sleep(delay);
          }
        }
      }
    }

    const errorMessage = this.prioritizedModels.length > 0
      ? `Failed to optimize prompt after trying ${this.prioritizedModels.length} models (${totalAttempts} total attempts): ${lastError?.message}. Tried models: ${this.prioritizedModels.map((m) => m.displayName).join(', ')}`
      : `Failed to optimize prompt after ${totalAttempts} attempts: ${lastError?.message}`;

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

    const enhancedSystemPrompt = `You are an expert prompt engineer. Your task is to ENHANCE and EXPAND the given prompt to make it more detailed, comprehensive, and effective.

Your enhancement should:
1. ADD specific examples and use cases to clarify intent
2. EXPAND vague instructions with concrete, detailed guidance
3. Include relevant context, constraints, and edge cases
4. Specify desired output format, structure, and style in detail
5. Add tone, voice, and audience specifications where appropriate
6. Include step-by-step instructions if the task is complex
7. Provide clear success criteria and quality expectations
8. The enhanced prompt should be SIGNIFICANTLY MORE DETAILED than the original
9. Focus on COMPREHENSIVENESS and CLARITY - the result will naturally be longer

Provide your response in the following JSON format:
{
  "optimized": "The enhanced, detailed, and comprehensive version of the prompt (should be longer and more detailed than the original)",
  "explanation": "A brief explanation of the key enhancements made and how they improve the prompt quality"
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

    // Debug logging to verify mode selection
    console.log(`🔧 Optimization Mode: ${mode}`);
    console.log(`📝 Using ${mode === 'enhanced' ? 'ENHANCED (expand & add details)' : 'CONCISE (reduce tokens)'} prompt`);

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
        // Enhanced mode needs more tokens to generate detailed prompts
        maxOutputTokens: mode === 'enhanced' ? 2048 : 1024,
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

      // Sanitize the JSON string to handle control characters
      // The Gemini API sometimes returns JSON with unescaped newlines, tabs, etc. in string values
      let jsonString = jsonMatch[0];

      // First, try to parse as-is
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (firstError) {
        // If parsing fails, try to fix common control character issues
        // We need to be careful to only escape control characters within string values
        console.log('First parse attempt failed, attempting to sanitize JSON...');

        // Replace literal control characters with their escaped equivalents
        // This regex-based approach handles most common cases
        jsonString = jsonString
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
          .replace(/\f/g, '\\f')
          .replace(/\b/g, '\\b');

        try {
          parsed = JSON.parse(jsonString);
        } catch (secondError) {
          // If it still fails, log the problematic JSON for debugging
          console.error('Failed to parse even after sanitization. JSON string:', jsonString.substring(0, 500));
          throw new Error(`Failed to parse Gemini response after sanitization: ${(secondError as Error).message}`);
        }
      }

      if (!parsed.optimized || !parsed.explanation) {
        throw new Error('Missing required fields in response');
      }

      return {
        optimizedPrompt: parsed.optimized,
        explanation: parsed.explanation,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText.substring(0, 500));
      throw new Error(`Failed to parse Gemini response: ${(parseError as Error).message}`);
    }
  }
}

export const geminiService = new GeminiService();