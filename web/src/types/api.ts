export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  plan: 'free' | 'pro_monthly' | 'pro_yearly';
  createdAt: string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: string;
}

export interface UsageData {
  userId: string;
  dailyCount: number;
  dailyLimit: number;
  monthlyCount: number;
  monthlyLimit: number;
  resetAt: string;
  plan: 'free' | 'pro_monthly' | 'pro_yearly';
}

export interface Prompt {
  id: string;
  userId: string;
  originalText: string;
  optimizedText: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptStats {
  totalPrompts: number;
  favoriteCount: number;
}

export interface PromptHistoryResponse {
  prompts: Prompt[];
  total: number;
  stats: PromptStats;
}

export interface PlanFeatures {
  name: string;
  price: string;
  dailyLimit: number;
  monthlyLimit: number;
  features: string[];
}

export interface RazorpayCheckoutData {
  subscriptionId: string;
  razorpayKeyId: string;
  plan: 'pro_monthly' | 'pro_yearly';
  planName: string;
}

export interface RazorpayVerificationData {
  paymentId: string;
  orderId: string;
  signature: string;
  subscriptionId: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}
