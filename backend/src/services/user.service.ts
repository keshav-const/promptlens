import { User, IUser } from '../models/index.js';
import mongoose from 'mongoose';

export interface CreateUserData {
  email: string;
  displayName?: string;
}

export interface PlanConfig {
  dailyLimit: number | null; // null means unlimited
  name: string;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: { dailyLimit: 4, name: 'Free' },
  pro_monthly: { dailyLimit: 50, name: 'Pro (Monthly)' },
  pro_yearly: { dailyLimit: null, name: 'Pro (Yearly)' }, // unlimited
};

export class UserService {
  async findOrCreateUser(data: CreateUserData): Promise<IUser> {
    // Use findOneAndUpdate with upsert to atomically find or create user
    // This prevents race conditions and E11000 duplicate key errors
    const user = await User.findOneAndUpdate(
      { email: data.email },
      {
        $setOnInsert: {
          email: data.email,
          displayName: data.displayName || data.email.split('@')[0],
          plan: 'free',
          usageCount: 0,
          lastResetAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('✅ User found/created:', user.email);
    return user;
  }

  async findById(userId: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    return User.findById(userId);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async incrementUsage(userId: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { $inc: { usageCount: 1 } }, { new: true });
  }

  async resetUsageIfNeeded(userId: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const now = new Date();
    const hoursSinceReset = (now.getTime() - user.lastResetAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      user.usageCount = 0;
      user.lastResetAt = now;
      await user.save();
    }

    return user;
  }

  getUsageLimit(plan: string): number | null {
    const config = PLAN_CONFIGS[plan];
    return config ? config.dailyLimit : 4; // Default to free limit
  }

  getPlanName(plan: string): string {
    const config = PLAN_CONFIGS[plan];
    return config ? config.name : 'Unknown';
  }

  async updateRazorpayCustomerId(
    userId: string | mongoose.Types.ObjectId,
    razorpayCustomerId: string
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { razorpayCustomerId }, { new: true });
  }

  async updateSubscription(
    userId: string | mongoose.Types.ObjectId,
    subscriptionData: {
      subscriptionId: string;
      plan: 'free' | 'pro_monthly' | 'pro_yearly';
      status?: string;
      currentPeriodEnd?: Date;
    }
  ): Promise<IUser | null> {
    const updateData: {
      razorpaySubscriptionId: string;
      plan: 'free' | 'pro_monthly' | 'pro_yearly';
      subscriptionStatus?: string;
      subscriptionCurrentPeriodEnd?: Date;
      usageCount?: number;
      lastResetAt?: Date;
    } = {
      razorpaySubscriptionId: subscriptionData.subscriptionId,
      plan: subscriptionData.plan,
    };

    if (subscriptionData.status) {
      updateData.subscriptionStatus = subscriptionData.status;
    }

    if (subscriptionData.currentPeriodEnd) {
      updateData.subscriptionCurrentPeriodEnd = subscriptionData.currentPeriodEnd;
    }

    // Reset usage when upgrading to a paid plan
    if (subscriptionData.plan !== 'free') {
      updateData.usageCount = 0;
      updateData.lastResetAt = new Date();
    }

    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async findByRazorpayCustomerId(razorpayCustomerId: string): Promise<IUser | null> {
    return User.findOne({ razorpayCustomerId });
  }

  async findByRazorpaySubscriptionId(razorpaySubscriptionId: string): Promise<IUser | null> {
    return User.findOne({ razorpaySubscriptionId });
  }
}

export const userService = new UserService();
