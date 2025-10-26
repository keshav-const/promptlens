import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import { historyQuerySchema } from '../utils/validation.js';
import { promptService } from '../services/prompt.service.js';
import { AppError } from '../middlewares/errorHandler.js';

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

    const result = await promptService.getHistory(
      {
        userId: req.userId,
        tags: validatedQuery.tags,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      },
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
      }
    );

    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
    } else {
      next(error);
    }
  }
};
