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
  originalText: string;
  optimizedText: string;
  explanation?: string;
  isFavorite: boolean;
  originalTokens?: number;
  optimizedTokens?: number;
  tokensSaved?: number;
  tags?: string[];
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

export interface Template {
  _id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  createdBy: {
    _id: string;
    displayName: string;
    email: string;
  };
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  name: string;
  prompt: string;
  optimizedPrompt?: string;
  responseTime?: number;
  rating?: number;
  notes?: string;
  createdAt: string;
}

export interface ABTest {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  variants: Variant[];
  winner?: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DailyStat {
  date: string;
  count: number;
  originalTokens: number;
  optimizedTokens: number;
  tokensSaved: number;
}

export interface ModelBreakdown {
  model: string;
  count: number;
  percentage: number;
}

export interface TokenStats {
  totalOriginalTokens: number;
  totalOptimizedTokens: number;
  totalTokensSaved: number;
  averageSavingsPercentage: number;
  totalCostSavings: number;
  averageOriginalTokens: number;
  averageOptimizedTokens: number;
}

export interface AnalyticsData {
  totalPrompts: number;
  dateRange: {
    start: string;
    end: string;
  };
  dailyStats: DailyStat[];
  modelBreakdown: ModelBreakdown[];
  favoriteCount: number;
  tokenStats: TokenStats;
}

export interface UsageStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  tokenStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
  };
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
