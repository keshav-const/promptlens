import request from 'supertest';
import { createApp } from '../app.js';
import { User, Prompt } from '../models/index.js';
import { createMockToken, mockGeminiResponse } from './utils/testHelpers.js';
import { geminiService } from '../services/gemini.service.js';

jest.mock('../services/gemini.service.js', () => ({
  geminiService: {
    optimizePrompt: jest.fn(),
  },
}));

describe('Optimize Endpoint', () => {
  const app = createApp();
  let token: string;
  const testEmail = 'optimize@example.com';

  beforeAll(async () => {
    token = await createMockToken(testEmail);
  });

  beforeEach(async () => {
    (geminiService.optimizePrompt as jest.Mock).mockResolvedValue(mockGeminiResponse);
  });

  describe('POST /api/optimize', () => {
    it('should optimize prompt and return result', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Write a story about a cat' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        originalPrompt: 'Write a story about a cat',
        optimizedPrompt: mockGeminiResponse.optimizedPrompt,
        explanation: mockGeminiResponse.explanation,
      });
      expect(response.body.data.usage).toMatchObject({
        count: 1,
        limit: 4,
        remaining: 3,
      });
    });

    it('should save prompt when save flag is true', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Test prompt',
          save: true,
          metadata: { tags: ['test'], source: 'api' },
        });

      expect(response.status).toBe(200);

      const prompts = await Prompt.find({});
      expect(prompts).toHaveLength(1);
      expect(prompts[0].original).toBe('Test prompt');
      expect(prompts[0].optimizedPrompt).toBe(mockGeminiResponse.optimizedPrompt);
      expect(prompts[0].metadata?.tags).toEqual(['test']);
      expect(prompts[0].metadata?.source).toBe('api');
    });

    it('should not save prompt when save flag is false', async () => {
      await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test prompt', save: false });

      const prompts = await Prompt.find({});
      expect(prompts).toHaveLength(0);
    });

    it('should validate prompt is required', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate prompt length', async () => {
      const longPrompt = 'a'.repeat(5001);
      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: longPrompt });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should increment usage count', async () => {
      await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'First prompt' });

      await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Second prompt' });

      const user = await User.findOne({ email: testEmail });
      expect(user?.usageCount).toBe(2);
    });
  });

  describe('Gemini API failure handling', () => {
    it('should return error when Gemini API fails', async () => {
      (geminiService.optimizePrompt as jest.Mock).mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test prompt' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle Gemini API timeout', async () => {
      (geminiService.optimizePrompt as jest.Mock).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      const response = await request(app)
        .post('/api/optimize')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test prompt' });

      expect(response.status).toBe(500);
    });
  });
});
