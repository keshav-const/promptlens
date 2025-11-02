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
    console.log('🔍 Token received:', token.substring(0, 50) + '...');
    console.log('🔑 NEXTAUTH_SECRET exists:', !!config.NEXTAUTH_SECRET);
    console.log('🔑 NEXTAUTH_SECRET length:', config.NEXTAUTH_SECRET?.length);
    console.log('🔑 JWT_SECRET exists:', !!config.JWT_SECRET);
    
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      console.log('🧹 Clean token length:', cleanToken.length);
      console.log('🧹 Clean token preview:', cleanToken.substring(0, 100));
      
      // Check token format
      const parts = cleanToken.split('.');
      console.log('🔢 Token parts count:', parts.length);
      
      // Try to decrypt as NextAuth JWE token (5 parts)
      if (parts.length === 5 && config.NEXTAUTH_SECRET) {
        console.log('🔐 Attempting JWE verification (NextAuth token)...');
        try {
          const payload = await this.verifyJWEToken(cleanToken);
          console.log('✅ Token decoded successfully (JWE):', payload);
          return payload;
        } catch (jweError) {
          const error = jweError as Error;
          console.error('❌ JWE verification failed:', error.message);
          console.error('❌ Error type:', error.constructor.name);
          // Fall through to try JWT verification
        }
      }
      
      // Try standard JWT verification (3 parts)
      if (parts.length === 3) {
        console.log('🔐 Attempting JWT verification (standard JWT)...');
        try {
          const payload = await this.verifyJWTToken(cleanToken);
          console.log('✅ Token decoded successfully (JWT):', payload);
          return payload;
        } catch (jwtError) {
          const error = jwtError as Error;
          console.error('❌ JWT verification failed:', error.message);
          console.error('❌ Error type:', error.constructor.name);
          throw new AppError('Invalid token signature', 401, 'INVALID_TOKEN');
        }
      }
      
      console.error('❌ Invalid token format - expected 3 or 5 parts, got:', parts.length);
      throw new AppError('Invalid token format', 401, 'INVALID_TOKEN');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('❌ Unexpected error verifying token:', error);
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
