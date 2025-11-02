import { User, IUser } from '../models/index.js';
import mongoose from 'mongoose';

export interface CreateUserData {
  email: string;
  displayName?: string;
}

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

  getUsageLimit(plan: string): number {
    return plan === 'pro' ? 20 : 4;
  }

  async updateStripeCustomerId(
    userId: string | mongoose.Types.ObjectId,
    stripeCustomerId: string
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { stripeCustomerId }, { new: true });
  }

  async updateSubscription(
    userId: string | mongoose.Types.ObjectId,
    subscriptionId: string,
    plan: 'free' | 'pro'
  ): Promise<IUser | null> {
    const updateData: { stripeSubscriptionId: string; plan: 'free' | 'pro'; usageCount?: number } =
      {
        stripeSubscriptionId: subscriptionId,
        plan,
      };

    if (plan === 'pro') {
      updateData.usageCount = 0;
    }

    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<IUser | null> {
    return User.findOne({ stripeCustomerId });
  }
}

export const userService = new UserService();
