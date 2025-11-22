import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from './errorHandler.js';
import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';

export const requireAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log('📨 Auth header received:', authHeader?.substring(0, 60) + '...');
    console.log('🔍 Request path:', req.path);
    console.log('🔍 Request method:', req.method);

    if (!authHeader) {
      console.error('❌ No auth header');
      throw new AppError('No authorization header provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.error('❌ No token in auth header');
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const decoded = await authService.verifyToken(token);

    if (!decoded.email) {
      console.error('❌ Token payload missing email');
      throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN');
    }

    const user = await userService.findOrCreateUser({
      email: decoded.email,
      displayName: decoded.name,
    });

    req.userId = user._id.toString();
    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    console.log('✅ User authenticated:', user.email);
    console.log('📊 User usage:', user.usageCount, '/', userService.getUsageLimit(user.plan));
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(' ')[1];

      if (token) {
        try {
          const decoded = await authService.verifyToken(token);

          if (decoded.email) {
            const user = await userService.findOrCreateUser({
              email: decoded.email,
              displayName: decoded.name,
            });

            req.userId = user._id.toString();
            req.user = {
              id: user._id.toString(),
              email: user.email,
            };
          }
        } catch (error) {
          console.error('Optional auth failed:', error);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authentication middleware that explicitly bypasses quota checking.
 * Use this ONLY for routes that should never check quotas (usage, history, billing).
 * This prevents infinite 429 error loops in the frontend.
 */
export const requireAuthWithoutQuota = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log('📨 [NO QUOTA] Auth header received:', authHeader?.substring(0, 60) + '...');
    console.log('🔍 [NO QUOTA] Request path:', req.path);

    if (!authHeader) {
      console.error('❌ [NO QUOTA] No auth header');
      throw new AppError('No authorization header provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.error('❌ [NO QUOTA] No token in auth header');
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const decoded = await authService.verifyToken(token);

    if (!decoded.email) {
      console.error('❌ [NO QUOTA] Token payload missing email');
      throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN');
    }

    const user = await userService.findOrCreateUser({
      email: decoded.email,
      displayName: decoded.name,
    });

    req.userId = user._id.toString();
    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    // Explicitly mark this request as exempt from quota checking
    (req as any).skipQuotaCheck = true;

    console.log('✅ [NO QUOTA] User authenticated:', user.email);
    console.log('🚫 [NO QUOTA] Quota check will be skipped for this request');
    next();
  } catch (error) {
    next(error);
  }
};
