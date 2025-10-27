import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import { userService } from '../services/user.service.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getUsage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const freshUser = await userService.findById(req.userId);

    if (!freshUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = await userService.resetUsageIfNeeded(freshUser._id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const limit = userService.getUsageLimit(user.plan);
    const remaining = Math.max(0, limit - user.usageCount);

    sendSuccess(res, {
      plan: user.plan,
      usageCount: user.usageCount,
      limit,
      remaining,
      lastResetAt: user.lastResetAt.toISOString(),
      nextResetAt: new Date(user.lastResetAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
