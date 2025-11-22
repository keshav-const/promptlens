import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptMetadata {
  tags?: string[];
  source?: string;
}

export interface IPrompt extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  original: string;
  optimizedPrompt: string;
  explanation: string;
  isFavorite: boolean;
  originalTokens: number;
  optimizedTokens: number;
  tokensSaved: number;
  metadata?: IPromptMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const promptSchema = new Schema<IPrompt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    original: {
      type: String,
      required: true,
    },
    optimizedPrompt: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    originalTokens: {
      type: Number,
      default: 0,
    },
    optimizedTokens: {
      type: Number,
      default: 0,
    },
    tokensSaved: {
      type: Number,
      default: 0,
    },
    metadata: {
      tags: [String],
      source: String,
    },
  },
  {
    timestamps: true,
  }
);

promptSchema.index({ userId: 1, createdAt: -1 });
promptSchema.index({ userId: 1, isFavorite: 1 });
promptSchema.index({ 'metadata.tags': 1 });

export const Prompt = mongoose.model<IPrompt>('Prompt', promptSchema);
