import { Prompt, IPrompt, IPromptMetadata } from '../models/index.js';
import mongoose from 'mongoose';

export interface CreatePromptData {
  userId: string | mongoose.Types.ObjectId;
  original: string;
  optimizedPrompt: string;
  explanation: string;
  originalTokens?: number;
  optimizedTokens?: number;
  tokensSaved?: number;
  metadata?: {
    tags?: string[];
    source?: string;
  };
}

export interface HistoryFilters {
  userId: string | mongoose.Types.ObjectId;
  tags?: string[];
  search?: string;
  favorites?: boolean;
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

export interface PromptStats {
  totalPrompts: number;
  favoriteCount: number;
}

export interface PaginatedPromptResult<T> extends PaginatedResult<T> {
  stats: PromptStats;
}

export class PromptService {
  async createPrompt(data: CreatePromptData): Promise<IPrompt> {
    return Prompt.create(data);
  }

  async getHistory(
    filters: HistoryFilters,
    options: PaginationOptions = {}
  ): Promise<PaginatedPromptResult<IPrompt>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const baseQuery = {
      userId: filters.userId,
    };

    const query: {
      userId: string | mongoose.Types.ObjectId;
      tags?: { $in: string[] };
      $or?: Array<{ original: { $regex: string; $options: string } } | { optimizedPrompt: { $regex: string; $options: string } }>;
      isFavorite?: boolean;
      createdAt?: { $gte?: Date; $lte?: Date };
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
      query.tags = { $in: filters.tags };
    }

    if (filters.search) {
      query.$or = [
        { original: { $regex: filters.search, $options: 'i' } },
        { optimizedPrompt: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.favorites === true) {
      query.isFavorite = true;
    }

    const [data, total, totalPrompts, favoriteCount] = await Promise.all([
      Prompt.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      Prompt.countDocuments(query),
      Prompt.countDocuments(baseQuery),
      Prompt.countDocuments({ ...baseQuery, isFavorite: true }),
    ]);

    return {
      data: data as unknown as IPrompt[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalPrompts,
        favoriteCount,
      },
    };
  }

  async getById(promptId: string | mongoose.Types.ObjectId): Promise<IPrompt | null> {
    return Prompt.findById(promptId);
  }

  async updateFavorite(
    promptId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    isFavorite: boolean
  ): Promise<IPrompt | null> {
    return Prompt.findOneAndUpdate({ _id: promptId, userId }, { isFavorite }, { new: true });
  }

  async deleteById(
    promptId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<IPrompt | null> {
    return Prompt.findOneAndDelete({ _id: promptId, userId });
  }
}

export const promptService = new PromptService();
