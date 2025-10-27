import { TokenStorage } from '@/lib/token';
import type { Prompt, UsageData, CheckoutSession, ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const tokenData = TokenStorage.getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (tokenData?.accessToken) {
    headers['Authorization'] = `Bearer ${tokenData.accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'An error occurred',
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.details
      );
    }

    if (!data.success) {
      throw new ApiError(
        data.error?.message || 'Request failed',
        data.error?.code || 'REQUEST_FAILED',
        data.error?.details
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError('Network error. Please check your connection.', 'NETWORK_ERROR');
    }

    throw new ApiError('An unexpected error occurred', 'UNKNOWN_ERROR', error);
  }
}

export async function fetchPromptHistory(filters?: {
  search?: string;
  tags?: string[];
  favorites?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ prompts: Prompt[]; total: number }> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters?.favorites !== undefined) params.append('favorites', String(filters.favorites));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const queryString = params.toString();
  const endpoint = `/history${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<{ prompts: Prompt[]; total: number }>(endpoint);
}

export async function fetchUsageData(): Promise<UsageData> {
  return fetchWithAuth<UsageData>('/usage');
}

export async function createCheckoutSession(): Promise<CheckoutSession> {
  return fetchWithAuth<CheckoutSession>('/billing/checkout', {
    method: 'POST',
  });
}

export async function createBillingPortalSession(): Promise<{ url: string }> {
  return fetchWithAuth<{ url: string }>('/billing/portal', {
    method: 'POST',
  });
}

export async function updatePromptFavorite(promptId: string, isFavorite: boolean): Promise<Prompt> {
  return fetchWithAuth<Prompt>(`/history/${promptId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isFavorite }),
  });
}

export async function deletePrompt(promptId: string): Promise<void> {
  return fetchWithAuth<void>(`/history/${promptId}`, {
    method: 'DELETE',
  });
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return 'Rate limit exceeded. Please try again later.';
    }
    if (error.code === 'UNAUTHORIZED') {
      return 'Please sign in to continue.';
    }
    if (error.code === 'NETWORK_ERROR') {
      return error.message;
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
