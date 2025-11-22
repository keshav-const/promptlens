import { encode } from 'gpt-tokenizer';

/**
 * Count tokens in a text string using GPT tokenizer
 * @param text - The text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
    if (!text || text.trim().length === 0) {
        return 0;
    }

    try {
        const tokens = encode(text);
        return tokens.length;
    } catch (error) {
        console.error('Error counting tokens:', error);
        // Fallback: rough estimation (1 token ≈ 4 characters)
        return Math.ceil(text.length / 4);
    }
}

/**
 * Calculate token savings between original and optimized prompts
 * @param originalText - Original prompt text
 * @param optimizedText - Optimized prompt text
 * @returns Object with token counts and savings
 */
export function calculateTokenSavings(originalText: string, optimizedText: string) {
    const originalTokens = countTokens(originalText);
    const optimizedTokens = countTokens(optimizedText);
    const tokensSaved = originalTokens - optimizedTokens;
    const percentageSaved = originalTokens > 0
        ? Math.round((tokensSaved / originalTokens) * 100)
        : 0;

    return {
        originalTokens,
        optimizedTokens,
        tokensSaved,
        percentageSaved,
    };
}

/**
 * Estimate cost based on token count
 * Using GPT-4 pricing as reference: ~$0.03 per 1K tokens (input)
 * @param tokens - Number of tokens
 * @param pricePerThousand - Price per 1000 tokens (default: $0.03)
 * @returns Estimated cost in USD
 */
export function estimateCost(tokens: number, pricePerThousand: number = 0.03): number {
    return (tokens / 1000) * pricePerThousand;
}

/**
 * Calculate cost savings
 * @param originalTokens - Original token count
 * @param optimizedTokens - Optimized token count
 * @param pricePerThousand - Price per 1000 tokens
 * @returns Cost savings in USD
 */
export function calculateCostSavings(
    originalTokens: number,
    optimizedTokens: number,
    pricePerThousand: number = 0.03
): number {
    const originalCost = estimateCost(originalTokens, pricePerThousand);
    const optimizedCost = estimateCost(optimizedTokens, pricePerThousand);
    return originalCost - optimizedCost;
}

/**
 * Format cost for display
 * @param cost - Cost in USD
 * @returns Formatted cost string
 */
export function formatCost(cost: number): string {
    if (cost < 0.01) {
        return `$${(cost * 1000).toFixed(3)}‰`; // Show in per-mille for very small amounts
    }
    return `$${cost.toFixed(4)}`;
}
