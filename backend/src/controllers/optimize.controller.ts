import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import { optimizePromptSchema } from '../utils/validation.js';
import { geminiService } from '../services/gemini.service.js';
import { userService } from '../services/user.service.js';
import { promptService } from '../services/prompt.service.js';
import { AppError } from '../middlewares/errorHandler.js';
import { calculateTokenSavings, estimateCost, formatCost } from '../utils/tokenCounter.js';

export const optimizePrompt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const validatedData = optimizePromptSchema.parse(req.body);

    const result = await geminiService.optimizePrompt(validatedData.prompt, validatedData.mode);

    // Calculate token savings
    const tokenAnalysis = calculateTokenSavings(
      validatedData.prompt,
      result.optimizedPrompt
    );

    // Calculate cost savings (using GPT-4 pricing as reference)
    const originalCost = estimateCost(tokenAnalysis.originalTokens);
    const optimizedCost = estimateCost(tokenAnalysis.optimizedTokens);
    const costSavings = originalCost - optimizedCost;

    await userService.incrementUsage(req.userId);

    if (validatedData.save) {
      await promptService.createPrompt({
        userId: req.userId,
        original: validatedData.prompt,
        optimizedPrompt: result.optimizedPrompt,
        explanation: result.explanation,
        originalTokens: tokenAnalysis.originalTokens,
        optimizedTokens: tokenAnalysis.optimizedTokens,
        tokensSaved: tokenAnalysis.tokensSaved,
        metadata: validatedData.metadata,
      });
    }

    const user = await userService.findById(req.userId);
    const limit = userService.getUsageLimit(user?.plan || 'free');
    const remaining = limit !== null ? Math.max(0, limit - (user?.usageCount || 0)) : null;

    sendSuccess(res, {
      originalPrompt: validatedData.prompt,
      optimizedPrompt: result.optimizedPrompt,
      explanation: result.explanation,
      mode: validatedData.mode,
      tokenAnalysis: {
        original: tokenAnalysis.originalTokens,
        optimized: tokenAnalysis.optimizedTokens,
        saved: tokenAnalysis.tokensSaved,
        percentageSaved: tokenAnalysis.percentageSaved,
        originalCost: formatCost(originalCost),
        optimizedCost: formatCost(optimizedCost),
        costSavings: formatCost(costSavings),
      },
      usage: {
        count: user?.usageCount || 0,
        limit,
        remaining,
        resetAt: user?.lastResetAt
          ? new Date(user.lastResetAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
    } else {
      next(error);
    }
  }
};
