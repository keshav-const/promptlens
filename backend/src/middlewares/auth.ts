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

    if (!authHeader) {
      throw new AppError('No authorization header provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const decoded = await authService.verifyToken(token);

    if (!decoded.email) {
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
