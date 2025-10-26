import { config } from '../../config/env.js';

export const createMockToken = async (email: string, name?: string): Promise<string> => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    email,
    name: name || 'Test User',
    sub: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const base64UrlEncode = (obj: unknown): string => {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);

  const secret = config.NEXTAUTH_SECRET || config.JWT_SECRET;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBuffer = encoder.encode(`${headerB64}.${payloadB64}`);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);

  const signatureB64 = Buffer.from(signature)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
};

export const mockGeminiResponse = {
  optimized: 'This is an optimized version of the prompt that is clearer and more specific.',
  explanation:
    'The prompt has been improved by adding more context and specific instructions to get better results.',
};
