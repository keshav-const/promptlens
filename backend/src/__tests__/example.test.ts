import request from 'supertest';
import { createApp } from '../app.js';
import { createMockToken } from './utils/testHelpers.js';

describe('Example Routes', () => {
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    token = await createMockToken('example@example.com');
  });

  describe('GET /api/example/public', () => {
    it('should return 200 and public message', async () => {
      const response = await request(app).get('/api/example/public');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', 'This is a public route');
    });
  });

  describe('GET /api/example/protected', () => {
    it('should return 401 without authorization header', async () => {
      const response = await request(app).get('/api/example/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return 200 with authorization header', async () => {
      const response = await request(app)
        .get('/api/example/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', 'This is a protected route');
      expect(response.body.data).toHaveProperty('user');
    });
  });

  describe('GET /api/example/error', () => {
    it('should return 400 with error response', async () => {
      const response = await request(app).get('/api/example/error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message', 'This is an example error');
      expect(response.body.error).toHaveProperty('code', 'EXAMPLE_ERROR');
    });
  });
});
