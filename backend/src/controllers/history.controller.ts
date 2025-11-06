import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import { historyQuerySchema, updatePromptSchema } from '../utils/validation.js';
import { promptService } from '../services/prompt.service.js';
import { AppError } from '../middlewares/errorHandler.js';
import mongoose from 'mongoose';

export const getHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const validatedQuery = historyQuerySchema.parse(req.query);

    const { data, pagination, stats } = await promptService.getHistory(
      {
        userId: req.userId,
        tags: validatedQuery.tags,
        search: validatedQuery.search,
        favorites: validatedQuery.favorites,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      },
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
      }
    );

    const transformedPrompts = data.map((prompt) => ({
      id: prompt._id.toString(),
      userId: prompt.userId.toString(),
      originalText: prompt.original,
      optimizedText: prompt.optimizedPrompt,
      tags: prompt.metadata?.tags || [],
      isFavorite: Boolean(prompt.isFavorite),
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString(),
    }));

    const transformedResult = {
      prompts: transformedPrompts,
      total: pagination.total,
      stats: {
        totalPrompts: stats.totalPrompts,
        favoriteCount: stats.favoriteCount,
      },
    };

    sendSuccess(res, transformedResult);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
    } else {
      next(error);
    }
  }
};

export const updatePrompt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const validatedBody = updatePromptSchema.parse(req.body);
    const { isFavorite } = validatedBody;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid prompt ID', 400, 'INVALID_ID');
    }

    const prompt = await promptService.getById(id);

    if (!prompt) {
      throw new AppError('Prompt not found', 404, 'PROMPT_NOT_FOUND');
    }

    if (prompt.userId.toString() !== req.userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    const updatedPrompt = await promptService.updateFavorite(id, req.userId, isFavorite);

    if (!updatedPrompt) {
      throw new AppError('Prompt not found', 404, 'PROMPT_NOT_FOUND');
    }

    const transformedPrompt = {
      id: updatedPrompt._id.toString(),
      userId: updatedPrompt.userId.toString(),
      originalText: updatedPrompt.original,
      optimizedText: updatedPrompt.optimizedPrompt,
      tags: updatedPrompt.metadata?.tags || [],
      isFavorite: updatedPrompt.isFavorite,
      createdAt: updatedPrompt.createdAt.toISOString(),
      updatedAt: updatedPrompt.updatedAt.toISOString(),
    };

    sendSuccess(res, transformedPrompt);
  } catch (error) {
    next(error);
  }
};

export const deletePrompt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid prompt ID', 400, 'INVALID_ID');
    }

    const deletedPrompt = await promptService.deleteById(id, req.userId);

    if (!deletedPrompt) {
      throw new AppError('Prompt not found', 404, 'PROMPT_NOT_FOUND');
    }

    sendSuccess(res, null, 204);
  } catch (error) {
    next(error);
  }
};
