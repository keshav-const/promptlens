import request from 'supertest';
import { createApp } from '../app.js';

describe('Health Check', () => {
  const app = createApp();

  it('should return 200 and health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status', 'ok');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('environment');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('database');
  });

  it('should have correct response structure', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('Error Handling', () => {
  const app = createApp();

  it('should return 404 for non-existent route', async () => {
    const response = await request(app).get('/api/non-existent');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });

  it('should have standardized error response structure', async () => {
    const response = await request(app).get('/api/non-existent');

    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('timestamp');
  });
});
