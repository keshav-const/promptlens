import { Prompt, IPrompt, IPromptMetadata } from '../models/index.js';
import mongoose from 'mongoose';

export interface CreatePromptData {
  userId: string | mongoose.Types.ObjectId;
  original: string;
  optimizedPrompt: string;
  explanation: string;
  metadata?: IPromptMetadata;
}

export interface HistoryFilters {
  userId: string | mongoose.Types.ObjectId;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PromptService {
  async createPrompt(data: CreatePromptData): Promise<IPrompt> {
    return Prompt.create(data);
  }

  async getHistory(
    filters: HistoryFilters,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IPrompt>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const query: {
      userId: mongoose.Types.ObjectId | string;
      createdAt?: { $gte?: Date; $lte?: Date };
      'metadata.tags'?: { $in: string[] };
    } = {
      userId: filters.userId,
    };

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      query['metadata.tags'] = { $in: filters.tags };
    }

    const [data, total] = await Promise.all([
      Prompt.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      Prompt.countDocuments(query),
    ]);

    return {
      data: data as unknown as IPrompt[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(promptId: string | mongoose.Types.ObjectId): Promise<IPrompt | null> {
    return Prompt.findById(promptId);
  }

  async deleteById(
    promptId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<IPrompt | null> {
    return Prompt.findOneAndDelete({ _id: promptId, userId });
  }
}

export const promptService = new PromptService();
