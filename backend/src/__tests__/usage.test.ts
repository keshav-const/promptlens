import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/index.js';
import { createMockToken } from './utils/testHelpers.js';

describe('Usage Endpoint', () => {
  const app = createApp();
  let token: string;
  const testEmail = 'usage@example.com';

  beforeAll(async () => {
    token = await createMockToken(testEmail);
  });

  describe('GET /api/usage', () => {
    it('should return usage stats for new user', async () => {
      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
      });

      const response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        plan: 'free',
        usageCount: 0,
        limit: 4,
        remaining: 4,
      });
      expect(response.body.data).toHaveProperty('lastResetAt');
      expect(response.body.data).toHaveProperty('nextResetAt');
    });

    it('should return correct usage stats for free plan', async () => {
      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 2,
        lastResetAt: new Date(),
      });

      const response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data).toMatchObject({
        plan: 'free',
        usageCount: 2,
        limit: 4,
        remaining: 2,
      });
    });

    it('should return correct usage stats for pro plan', async () => {
      await User.create({
        email: testEmail,
        plan: 'pro_monthly',
        usageCount: 15,
        lastResetAt: new Date(),
      });

      const response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data).toMatchObject({
        plan: 'pro_monthly',
        usageCount: 15,
        limit: 50,
        remaining: 35,
      });
    });

    it('should reset usage if 24 hours passed', async () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);

      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 4,
        lastResetAt: yesterday,
      });

      const response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.usageCount).toBe(0);
      expect(response.body.data.remaining).toBe(4);

      const updatedUser = await User.findOne({ email: testEmail });
      expect(updatedUser?.usageCount).toBe(0);
      expect(updatedUser?.lastResetAt.getTime()).toBeGreaterThan(yesterday.getTime());
    });

    it('should not reset usage before 24 hours', async () => {
      const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);

      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: tenHoursAgo,
      });

      const response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data.usageCount).toBe(3);
      expect(response.body.data.remaining).toBe(1);
    });

    it('should show 0 remaining when quota is exceeded', async () => {
      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 5,
        lastResetAt: new Date(),
      });

      const response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data.remaining).toBe(0);
    });

    it('should auto-provision user on first request', async () => {
      const newEmail = 'newusage@example.com';
      const newToken = await createMockToken(newEmail);

      const response = await request(app)
        .get('/api/usage')
        .set('Authorization', `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        plan: 'free',
        usageCount: 0,
        limit: 4,
        remaining: 4,
      });

      const user = await User.findOne({ email: newEmail });
      expect(user).not.toBeNull();
    });
  });
});
