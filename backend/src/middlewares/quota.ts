import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from './errorHandler.js';
import { userService } from '../services/user.service.js';

export const checkQuota = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const user = await userService.resetUsageIfNeeded(req.userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const limit = userService.getUsageLimit(user.plan);

    // Handle unlimited plans
    if (limit === null) {
      req.userDoc = user;
      next();
      return;
    }

    if (user.usageCount >= limit) {
      throw new AppError(
        `Daily limit reached. You have used ${user.usageCount}/${limit} requests. Quota resets at ${new Date(
          user.lastResetAt.getTime() + 24 * 60 * 60 * 1000
        ).toISOString()}`,
        429,
        'QUOTA_EXCEEDED',
        {
          usageCount: user.usageCount,
          limit,
          plan: user.plan,
          planName: userService.getPlanName(user.plan),
          resetAt: new Date(user.lastResetAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        }
      );
    }

    req.userDoc = user;

    next();
  } catch (error) {
    next(error);
  }
};
