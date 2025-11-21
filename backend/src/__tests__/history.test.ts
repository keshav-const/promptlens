import request from 'supertest';
import { createApp } from '../app.js';
import { User, Prompt } from '../models/index.js';
import { createMockToken } from './utils/testHelpers.js';
import mongoose from 'mongoose';

describe('History Endpoint', () => {
  const app = createApp();
  let token: string;
  let userId: mongoose.Types.ObjectId;
  const testEmail = 'history@example.com';

  beforeAll(async () => {
    token = await createMockToken(testEmail);
  });

  beforeEach(async () => {
    const user = await User.create({
      email: testEmail,
      plan: 'free',
      usageCount: 0,
      lastResetAt: new Date(),
    });
    userId = user._id;
  });

  describe('GET /api/history', () => {
    it('should return empty array when no prompts exist', async () => {
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should return saved prompts sorted by newest first', async () => {
      const prompts = [
        {
          userId,
          original: 'First prompt',
          optimizedPrompt: 'Optimized first',
          explanation: 'Explanation 1',
          createdAt: new Date('2024-01-01'),
        },
        {
          userId,
          original: 'Second prompt',
          optimizedPrompt: 'Optimized second',
          explanation: 'Explanation 2',
          createdAt: new Date('2024-01-02'),
        },
        {
          userId,
          original: 'Third prompt',
          optimizedPrompt: 'Optimized third',
          explanation: 'Explanation 3',
          createdAt: new Date('2024-01-03'),
        },
      ];

      await Prompt.insertMany(prompts);

      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.data[0].original).toBe('Third prompt');
      expect(response.body.data.data[1].original).toBe('Second prompt');
      expect(response.body.data.data[2].original).toBe('First prompt');
    });

    it('should support pagination', async () => {
      const prompts = Array.from({ length: 15 }, (_, i) => ({
        userId,
        original: `Prompt ${i + 1}`,
        optimizedPrompt: `Optimized ${i + 1}`,
        explanation: `Explanation ${i + 1}`,
      }));

      await Prompt.insertMany(prompts);

      const page1 = await request(app)
        .get('/api/history?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(page1.body.data.data).toHaveLength(5);
      expect(page1.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: 15,
        totalPages: 3,
      });

      const page2 = await request(app)
        .get('/api/history?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(page2.body.data.data).toHaveLength(5);
      expect(page2.body.data.pagination.page).toBe(2);
    });

    it('should filter by tags', async () => {
      const now = Date.now();
      await Prompt.create({
        userId,
        original: 'Test 1',
        optimizedPrompt: 'Opt 1',
        explanation: 'Exp 1',
        metadata: { tags: ['work', 'important'] },
        createdAt: new Date(now - 2000),
      });
      await Prompt.create({
        userId,
        original: 'Test 2',
        optimizedPrompt: 'Opt 2',
        explanation: 'Exp 2',
        metadata: { tags: ['personal'] },
        createdAt: new Date(now - 1000),
      });
      await Prompt.create({
        userId,
        original: 'Test 3',
        optimizedPrompt: 'Opt 3',
        explanation: 'Exp 3',
        metadata: { tags: ['work'] },
        createdAt: new Date(now),
      });

      const response = await request(app)
        .get('/api/history?tags=work')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data[0].original).toBe('Test 3');
      expect(response.body.data.data[1].original).toBe('Test 1');
    });

    it('should filter by date range', async () => {
      await Prompt.insertMany([
        {
          userId,
          original: 'Old prompt',
          optimizedPrompt: 'Opt',
          explanation: 'Exp',
          createdAt: new Date('2024-01-01'),
        },
        {
          userId,
          original: 'Recent prompt',
          optimizedPrompt: 'Opt',
          explanation: 'Exp',
          createdAt: new Date('2024-06-01'),
        },
      ]);

      const response = await request(app)
        .get('/api/history?startDate=2024-05-01')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].original).toBe('Recent prompt');
    });

    it('should only return prompts for authenticated user', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
      });

      await Prompt.insertMany([
        {
          userId,
          original: 'My prompt',
          optimizedPrompt: 'Opt',
          explanation: 'Exp',
        },
        {
          userId: otherUser._id,
          original: 'Other prompt',
          optimizedPrompt: 'Opt',
          explanation: 'Exp',
        },
      ]);

      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].original).toBe('My prompt');
    });

    it('should return history even when quota is exceeded', async () => {
      // Create user with exceeded quota on free plan
      const quotaUser = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 4, // Free plan limit is 4 - quota exceeded
        lastResetAt: new Date(),
      });

      // Add some prompts to history
      await Prompt.insertMany([
        {
          userId: quotaUser._id,
          original: 'Historical prompt 1',
          optimizedPrompt: 'Optimized 1',
          explanation: 'Explanation 1',
        },
        {
          userId: quotaUser._id,
          original: 'Historical prompt 2',
          optimizedPrompt: 'Optimized 2',
          explanation: 'Explanation 2',
        },
      ]);

      // Should return history even though quota is exceeded
      // Users must be able to access their history at any time
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data[0].original).toBe('Historical prompt 2');
      expect(response.body.data.data[1].original).toBe('Historical prompt 1');
    });
  });
});
