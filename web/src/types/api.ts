export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  plan: 'free' | 'pro';
  createdAt: string;
  stripeCustomerId?: string;
}

export interface UsageData {
  userId: string;
  dailyCount: number;
  dailyLimit: number;
  monthlyCount: number;
  monthlyLimit: number;
  resetAt: string;
  plan: 'free' | 'pro';
}

export interface Prompt {
  id: string;
  userId: string;
  originalText: string;
  optimizedText: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatures {
  name: string;
  price: string;
  dailyLimit: number;
  monthlyLimit: number;
  features: string[];
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}
