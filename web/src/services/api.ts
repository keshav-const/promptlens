import { TokenStorage } from '@/lib/token';
import type {
  Prompt,
  UsageData,
  RazorpayCheckoutData,
  RazorpayVerificationData,
  ApiResponse,
  PromptHistoryResponse,
  Template,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const tokenData = TokenStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (tokenData?.accessToken) {
    console.log('🎫 Sending token:', tokenData.accessToken.substring(0, 50) + '...');
    console.log('🎫 Token length:', tokenData.accessToken.length);
    headers['Authorization'] = `Bearer ${tokenData.accessToken}`;
  } else {
    console.log('⚠️ No access token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    const hasBody = responseText.trim().length > 0;

    if (!hasBody) {
      if (!response.ok) {
        throw new ApiError(response.statusText || 'An error occurred', `HTTP_${response.status}`);
      }

      return undefined as T;
    }

    let data: ApiResponse<T>;

    try {
      data = JSON.parse(responseText) as ApiResponse<T>;
    } catch (parseError) {
      throw new ApiError('Failed to parse server response', `HTTP_${response.status}`, parseError);
    }

    if (!response.ok) {
      const error = new ApiError(
        data.error?.message || 'An error occurred',
        data.error?.code || `HTTP_${response.status}`,
        data.error?.details
      );

      // Don't retry on quota exceeded errors - they won't resolve with retries
      if (error.code === 'QUOTA_EXCEEDED') {
        console.warn('⚠️ Quota exceeded, not retrying');
        throw error;
      }

      // Retry on server errors (5xx) or rate limit errors
      if (
        retryCount < MAX_RETRIES &&
        (response.status >= 500 || error.code === 'RATE_LIMIT_EXCEEDED')
      ) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`⏳ Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithAuth<T>(endpoint, options, retryCount + 1);
      }

      throw error;
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
      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`⏳ Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithAuth<T>(endpoint, options, retryCount + 1);
      }
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
}): Promise<PromptHistoryResponse> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters?.favorites !== undefined) params.append('favorites', String(filters.favorites));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const queryString = params.toString();
  const endpoint = `/history${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<PromptHistoryResponse>(endpoint);
}

export async function fetchUsageData(): Promise<UsageData> {
  return fetchWithAuth<UsageData>('/usage');
}

export async function createSubscription(
  plan: 'monthly' | 'yearly'
): Promise<RazorpayCheckoutData> {
  const backendPlan = plan === 'monthly' ? 'pro_monthly' : 'pro_yearly';
  return fetchWithAuth<RazorpayCheckoutData>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan: backendPlan }),
  });
}

export async function verifySubscription(
  verificationData: RazorpayVerificationData
): Promise<{ success: boolean; plan: string }> {
  return fetchWithAuth<{ success: boolean; plan: string }>('/billing/verify', {
    method: 'POST',
    body: JSON.stringify(verificationData),
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
    if (error.code === 'QUOTA_EXCEEDED') {
      return 'Daily limit reached. Upgrade to Pro for unlimited prompts.';
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

// Template API functions
export async function fetchTemplates(filters?: {
  category?: string;
  search?: string;
  tags?: string[];
  myTemplates?: boolean;
}): Promise<{ templates: Template[]; count: number }> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags) filters.tags.forEach((tag) => params.append('tags', tag));
  if (filters?.myTemplates) params.append('myTemplates', 'true');

  const query = params.toString();
  return fetchWithAuth(`/templates${query ? `?${query}` : ''}`);
}

export async function fetchTemplateById(id: string): Promise<Template> {
  return fetchWithAuth(`/templates/${id}`);
}

export async function createTemplate(data: {
  name: string;
  description: string;
  content: string;
  category: string;
  tags?: string[];
  isPublic?: boolean;
}): Promise<Template> {
  return fetchWithAuth('/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    isPublic: boolean;
  }>
): Promise<Template> {
  return fetchWithAuth(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string): Promise<{ message: string }> {
  return fetchWithAuth(`/templates/${id}`, {
    method: 'DELETE',
  });
}

export async function useTemplate(id: string): Promise<Template> {
  return fetchWithAuth(`/templates/${id}/use`, {
    method: 'POST',
  });
}

export async function fetchCategories(): Promise<{ categories: string[] }> {
  return fetchWithAuth('/templates/categories');
}
