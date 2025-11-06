import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const getToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.email) {
      throw new Error('User not authenticated');
    }

    // Create a new JWT token
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const token = jwt.sign(
      {
        sub: req.user.email,
        email: req.user.email,
        name: req.user.email, // We don't have name in req.user, use email as fallback
      },
      config.JWT_SECRET,
      {
        expiresIn: '7d',
        issuer: 'promptlens-backend',
      }
    );

    console.log('✅ Created token for:', req.user.email);

    sendSuccess(res, {
      accessToken: token,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.email,
      },
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};