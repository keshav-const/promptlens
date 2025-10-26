import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/index.js';
import { createMockToken } from './utils/testHelpers.js';

describe('Auth Middleware', () => {
  const app = createApp();

  describe('requireAuth middleware', () => {
    it('should reject requests without authorization header', async () => {
      const response = await request(app).get('/api/example/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/api/example/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should accept valid token and auto-provision user', async () => {
      const email = 'newuser@example.com';
      const token = await createMockToken(email, 'New User');

      const usersBefore = await User.countDocuments();
      expect(usersBefore).toBe(0);

      const response = await request(app)
        .get('/api/example/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const usersAfter = await User.countDocuments();
      expect(usersAfter).toBe(1);

      const user = await User.findOne({ email });
      expect(user).not.toBeNull();
      expect(user?.email).toBe(email);
      expect(user?.displayName).toBe('New User');
      expect(user?.plan).toBe('free');
      expect(user?.usageCount).toBe(0);
    });

    it('should reuse existing user on subsequent requests', async () => {
      const email = 'existing@example.com';
      const token = await createMockToken(email, 'Existing User');

      await request(app).get('/api/example/protected').set('Authorization', `Bearer ${token}`);

      const usersAfter1 = await User.countDocuments();
      expect(usersAfter1).toBe(1);

      await request(app).get('/api/example/protected').set('Authorization', `Bearer ${token}`);

      const usersAfter2 = await User.countDocuments();
      expect(usersAfter2).toBe(1);
    });

    it('should reject expired token', async () => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        email: 'test@example.com',
        sub: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      const base64UrlEncode = (obj: unknown): string => {
        const json = JSON.stringify(obj);
        const base64 = Buffer.from(json).toString('base64');
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      };

      const headerB64 = base64UrlEncode(header);
      const payloadB64 = base64UrlEncode(payload);
      const signatureB64 = base64UrlEncode('fake-signature');

      const expiredToken = `${headerB64}.${payloadB64}.${signatureB64}`;

      const response = await request(app)
        .get('/api/example/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });
});
