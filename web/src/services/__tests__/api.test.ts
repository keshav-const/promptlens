import {
  fetchPromptHistory,
  fetchUsageData,
  createCheckoutSession,
  createBillingPortalSession,
  updatePromptFavorite,
  deletePrompt,
  handleApiError,
  ApiError,
} from '../api';
import { TokenStorage } from '@/lib/token';

jest.mock('@/lib/token');

const createFetchResponse = (
  body: unknown,
  {
    ok = true,
    status = ok ? 200 : 400,
    statusText,
  }: { ok?: boolean; status?: number; statusText?: string } = {}
) => {
  const responseBody =
    body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);

  return {
    ok,
    status,
    statusText: statusText ?? (ok ? 'OK' : 'Error'),
    text: jest.fn().mockResolvedValue(responseBody),
  };
};

const mockTokenStorage = TokenStorage as jest.Mocked<typeof TokenStorage>;

describe('API Service', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockTokenStorage.getToken.mockReturnValue({
      accessToken: 'test-token',
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPromptHistory', () => {
    it('should fetch prompt history successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          prompts: [
            {
              id: '1',
              userId: 'test-user-id',
              originalText: 'test prompt',
              optimizedText: 'optimized test prompt',
              tags: ['test'],
              isFavorite: false,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          total: 1,
          stats: {
            totalPrompts: 1,
            favoriteCount: 0,
          },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse)
      );

      const result = await fetchPromptHistory();

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/history'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle filters correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          prompts: [],
          total: 0,
          stats: { totalPrompts: 0, favoriteCount: 0 },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse)
      );

      await fetchPromptHistory({
        search: 'test',
        tags: ['tag1', 'tag2'],
        favorites: true,
        limit: 10,
        offset: 0,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('tags=tag1%2Ctag2'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('favorites=true'),
        expect.any(Object)
      );
    });

    it('should throw ApiError on error response', async () => {
      const mockResponse = {
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse, {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      );

      await expect(fetchPromptHistory()).rejects.toThrow(ApiError);

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse, {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      );

      await expect(fetchPromptHistory()).rejects.toThrow('Unauthorized');
    });
  });

  describe('fetchUsageData', () => {
    it('should fetch usage data successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'test-user-id',
          dailyCount: 5,
          dailyLimit: 10,
          monthlyCount: 50,
          monthlyLimit: 300,
          resetAt: '2024-01-02T00:00:00.000Z',
          plan: 'free' as const,
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse)
      );

      const result = await fetchUsageData();

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/usage'),
        expect.any(Object)
      );
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          url: 'https://checkout.stripe.com/test',
          sessionId: 'test-session-id',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse)
      );

      const result = await createCheckoutSession();

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/billing/checkout'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('createBillingPortalSession', () => {
    it('should create billing portal session successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          url: 'https://billing.stripe.com/test',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse)
      );

      const result = await createBillingPortalSession();

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/billing/portal'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('updatePromptFavorite', () => {
    it('should update prompt favorite status successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          userId: 'test-user-id',
          originalText: 'test prompt',
          optimizedText: 'optimized test prompt',
          tags: ['test'],
          isFavorite: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse)
      );

      const result = await updatePromptFavorite('1', true);

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/history/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isFavorite: true }),
        })
      );
    });
  });

  describe('deletePrompt', () => {
    it('should delete prompt successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(undefined, {
          status: 204,
          statusText: 'No Content',
        })
      );

      await deletePrompt('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/history/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('handleApiError', () => {
    it('should handle ApiError with RATE_LIMIT_EXCEEDED', () => {
      const error = new ApiError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      const message = handleApiError(error);
      expect(message).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should handle ApiError with UNAUTHORIZED', () => {
      const error = new ApiError('Unauthorized', 'UNAUTHORIZED');
      const message = handleApiError(error);
      expect(message).toBe('Please sign in to continue.');
    });

    it('should handle ApiError with NETWORK_ERROR', () => {
      const error = new ApiError('Network error', 'NETWORK_ERROR');
      const message = handleApiError(error);
      expect(message).toBe('Network error');
    });

    it('should handle ApiError with custom message', () => {
      const error = new ApiError('Custom error', 'CUSTOM_ERROR');
      const message = handleApiError(error);
      expect(message).toBe('Custom error');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const message = handleApiError(error);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(fetchUsageData()).rejects.toThrow(ApiError);
      await expect(fetchUsageData()).rejects.toThrow('Network error');
    });

    it('should handle missing token', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);

      const mockResponse = {
        success: true,
        data: {
          prompts: [],
          total: 0,
          stats: { totalPrompts: 0, favoriteCount: 0 },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createFetchResponse(mockResponse)
      );

      await fetchPromptHistory();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });
});
