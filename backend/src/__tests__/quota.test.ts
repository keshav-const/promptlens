import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/index.js';
import { createMockToken, mockGeminiResponse } from './utils/testHelpers.js';
import { geminiService } from '../services/gemini.service.js';

jest.mock('../services/gemini.service.js', () => ({
  geminiService: {
    optimizePrompt: jest.fn(),
  },
}));

describe('Quota Management', () => {
  const app = createApp();
  let token: string;
  const testEmail = 'quota@example.com';

  beforeAll(async () => {
    token = await createMockToken(testEmail);
  });

  beforeEach(async () => {
    (geminiService.optimizePrompt as jest.Mock).mockResolvedValue(mockGeminiResponse);
  });

  describe('Free plan quota', () => {
    it('should allow requests within free plan limit (4/day)', async () => {
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .post('/api/optimize')
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: `Test prompt ${i}` });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.usage.count).toBe(i + 1);
        expect(response.body.data.usage.limit).toBe(4);
      }
    });

    it('should reject 5th request with 429', async () => {
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/optimize')
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: `Test prompt ${i}` });
      }

      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test prompt 5' });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('QUOTA_EXCEEDED');
      expect(response.body.error.details).toMatchObject({
        usageCount: 4,
        limit: 4,
        plan: 'free',
      });
    });
  });

  describe('Pro plan quota', () => {
    it('should allow requests within pro plan limit (50/day)', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'pro_monthly',
        usageCount: 0,
        lastResetAt: new Date(),
      });

      for (let i = 0; i < 50; i++) {
        const response = await request(app)
          .post('/api/optimize')
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: `Test prompt ${i}` });

        expect(response.status).toBe(200);
        expect(response.body.data.usage.limit).toBe(50);
      }

      await user.deleteOne();
    });

    it('should reject 51st request with 429', async () => {
      await User.create({
        email: testEmail,
        plan: 'pro_monthly',
        usageCount: 50,
        lastResetAt: new Date(),
      });

      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test prompt' });

      expect(response.status).toBe(429);
      expect(response.body.error.details.limit).toBe(50);
    });
  });

  describe('Usage reset', () => {
    it('should reset usage count after 24 hours', async () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);

      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 4,
        lastResetAt: yesterday,
      });

      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test prompt after reset' });

      expect(response.status).toBe(200);
      expect(response.body.data.usage.count).toBe(1);

      const user = await User.findOne({ email: testEmail });
      expect(user?.usageCount).toBe(1);
      expect(user?.lastResetAt.getTime()).toBeGreaterThan(yesterday.getTime());
    });

    it('should not reset usage count before 24 hours', async () => {
      const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);

      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: twentyHoursAgo,
      });

      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test prompt' });

      expect(response.status).toBe(200);
      expect(response.body.data.usage.count).toBe(4);
    });
  });
});
