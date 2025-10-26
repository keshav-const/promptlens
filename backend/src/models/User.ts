import mongoose, { Schema, Document } from 'mongoose';

export type UserPlan = 'free' | 'pro';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  displayName?: string;
  plan: UserPlan;
  usageCount: number;
  lastResetAt: Date;
  stripeCustomerId?: string;
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
      enum: ['free', 'pro'],
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
    stripeCustomerId: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
