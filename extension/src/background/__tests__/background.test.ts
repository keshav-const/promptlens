/**
 * @jest-environment jsdom
 */

// Mock chrome APIs before importing the background script
(global as any).chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
    onSuspend: {
      addListener: jest.fn(),
    },
  },
};

import { handleOptimizePrompt } from '../background';

// Mock config and auth utils
jest.mock('@/utils/config', () => ({
  getConfig: jest.fn().mockResolvedValue({
    apiBaseUrl: 'http://localhost:5000/api'
  })
}));

jest.mock('@/utils/auth', () => ({
  getAuthToken: jest.fn().mockResolvedValue('test-token')
}));

// Mock fetch
global.fetch = jest.fn();

describe('Background Service - 429 Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse 429 response and display server-provided quota message', async () => {
    const quotaMessage = 'Daily limit reached. You have used 4/4 requests. Quota resets at 2024-01-02T00:00:00.000Z';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 429,
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        success: false,
        error: {
          message: quotaMessage,
          code: 'QUOTA_EXCEEDED'
        }
      })
    });

    await expect(handleOptimizePrompt({ prompt: 'test prompt' })).rejects.toThrow(quotaMessage);
  });

  it('should fallback to default message when 429 response has no custom message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 429,
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        success: false,
        error: {}
      })
    });

    await expect(handleOptimizePrompt({ prompt: 'test prompt' })).rejects.toThrow(
      'Daily limit reached. Upgrade for more prompts.'
    );
  });

  it('should fallback to default message when 429 response JSON parsing fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 429,
      ok: false,
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON'))
    });

    await expect(handleOptimizePrompt({ prompt: 'test prompt' })).rejects.toThrow(
      'Daily limit reached. Upgrade for more prompts.'
    );
  });
});