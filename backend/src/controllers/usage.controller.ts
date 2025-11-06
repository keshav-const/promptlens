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

    // Transform the response to match frontend expectations
    const transformedUsage = {
      userId: user._id.toString(),
      dailyCount: user.usageCount,
      dailyLimit: limit,
      monthlyCount: user.usageCount,
      monthlyLimit: limit,
      resetAt: new Date(user.lastResetAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      plan: user.plan,
    };

    sendSuccess(res, transformedUsage);
  } catch (error) {
    next(error);
  }
};
