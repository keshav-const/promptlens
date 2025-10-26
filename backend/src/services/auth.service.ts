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
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new AppError('Invalid token format', 401, 'INVALID_TOKEN');
      }

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
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to verify token', 401, 'INVALID_TOKEN');
    }
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
