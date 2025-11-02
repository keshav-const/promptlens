import { jwtDecrypt } from 'jose';
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
  private secret: string;

  constructor() {
    if (!config.NEXTAUTH_SECRET && !config.JWT_SECRET) {
      throw new Error('NEXTAUTH_SECRET or JWT_SECRET must be configured');
    }
    this.secret = config.NEXTAUTH_SECRET || config.JWT_SECRET;
  }

  async verifyToken(token: string): Promise<DecodedToken> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      
      // Check token format
      const parts = cleanToken.split('.');
      
      // Try to decrypt as NextAuth JWE token (5 parts)
      if (parts.length === 5 && config.NEXTAUTH_SECRET) {
        try {
          const payload = await this.verifyJWEToken(cleanToken);
          return payload;
        } catch (jweError) {
          if (config.NODE_ENV === 'development') {
            console.error('JWE verification failed:', jweError);
          }
          // Fall through to try JWT verification
        }
      }
      
      // Try standard JWT verification (3 parts)
      if (parts.length === 3) {
        try {
          const payload = await this.verifyJWTToken(cleanToken);
          return payload;
        } catch (jwtError) {
          if (config.NODE_ENV === 'development') {
            console.error('JWT verification failed:', jwtError);
          }
          throw new AppError('Invalid token signature', 401, 'INVALID_TOKEN');
        }
      }
      
      throw new AppError('Invalid token format', 401, 'INVALID_TOKEN');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to verify token', 401, 'INVALID_TOKEN');
    }
  }

  private async verifyJWEToken(token: string): Promise<DecodedToken> {
    const secret = new TextEncoder().encode(config.NEXTAUTH_SECRET);
    const { payload } = await jwtDecrypt(token, secret);
    
    // Validate required fields
    if (!payload.email) {
      throw new AppError('Invalid token payload: missing email', 401, 'INVALID_TOKEN');
    }
    
    // Check expiration if present
    if (payload.exp && typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      userId: payload.userId as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  }

  private async verifyJWTToken(token: string): Promise<DecodedToken> {
    const parts = token.split('.');
    const [headerB64, payloadB64, signatureB64] = parts;

    const expectedSignature = await this.createSignature(`${headerB64}.${payloadB64}`);

    if (signatureB64 !== expectedSignature) {
      throw new AppError('Invalid token signature', 401, 'INVALID_TOKEN');
    }

    const payload = JSON.parse(this.base64UrlDecode(payloadB64));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }

    return payload as DecodedToken;
  }

  private async createSignature(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.secret);
    const dataBuffer = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);

    return this.base64UrlEncode(new Uint8Array(signature));
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    const base64 = Buffer.from(buffer).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

export const authService = new AuthService();
