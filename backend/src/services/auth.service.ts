import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface DecodedToken {
  sub?: string;
  email?: string;
  name?: string;
  userId?: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  async verifyToken(token: string): Promise<DecodedToken> {
    console.log('🔍 Verifying token...');

    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

      // Verify JWT with JWT_SECRET
      const payload = jwt.verify(cleanToken, config.JWT_SECRET) as {
        sub: string;
        email: string;
        name?: string;
      };

      console.log('✅ JWT verified for:', payload.email);

      if (!payload.email) {
        throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        console.error('❌ JWT verification failed:', error.message);
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      }
      if (error instanceof jwt.TokenExpiredError) {
        console.error('❌ JWT expired:', error.message);
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
