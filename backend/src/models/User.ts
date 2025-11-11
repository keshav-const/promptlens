import mongoose, { Schema, Document } from 'mongoose';

export type UserPlan = 'free' | 'pro_monthly' | 'pro_yearly';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  displayName?: string;
  plan: UserPlan;
  usageCount: number;
  lastResetAt: Date;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro_monthly', 'pro_yearly'],
      default: 'free',
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastResetAt: {
      type: Date,
      default: Date.now,
    },
    razorpayCustomerId: {
      type: String,
      sparse: true,
    },
    razorpaySubscriptionId: {
      type: String,
      sparse: true,
    },
    subscriptionStatus: {
      type: String,
      sparse: true,
    },
    subscriptionCurrentPeriodEnd: {
      type: Date,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
