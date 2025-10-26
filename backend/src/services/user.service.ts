import { User, IUser } from '../models/index.js';
import mongoose from 'mongoose';

export interface CreateUserData {
  email: string;
  displayName?: string;
}

export class UserService {
  async findOrCreateUser(data: CreateUserData): Promise<IUser> {
    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = await User.create({
        email: data.email,
        displayName: data.displayName,
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
      });
    }

    return user;
  }

  async findById(userId: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    return User.findById(userId);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async incrementUsage(userId: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
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
}

export const userService = new UserService();
