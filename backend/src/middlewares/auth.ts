import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from './errorHandler.js';

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

    req.userId = 'TODO_USER_ID';
    req.user = {
      id: 'TODO_USER_ID',
      email: 'TODO_USER_EMAIL',
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
        req.userId = 'TODO_USER_ID';
        req.user = {
          id: 'TODO_USER_ID',
          email: 'TODO_USER_EMAIL',
        };
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
