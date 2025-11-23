import { Prompt } from '../models/index.js';
import mongoose from 'mongoose';

export interface DailyTokenStats {
    date: string;
    count: number;
    originalTokens: number;
    optimizedTokens: number;
    tokensSaved: number;
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
        start: Date;
        end: Date;
    };
    dailyStats: Array<DailyTokenStats>;
    modelBreakdown: Array<{
        model: string;
        count: number;
        percentage: number;
    }>;
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

export class AnalyticsService {
    async getAnalytics(
        userId: string | mongoose.Types.ObjectId,
        range: 'week' | 'month' | 'year' = 'month'
    ): Promise<AnalyticsData> {
        const now = new Date();
        const startDate = this.getStartDate(now, range);

        const prompts = await Prompt.find({
            userId,
            createdAt: { $gte: startDate, $lte: now },
        }).sort({ createdAt: 1 });

        // Daily stats with token data
        const dailyStats = this.aggregateDailyTokenStats(prompts, startDate, now);

        // Model breakdown
        const modelBreakdown = this.aggregateModelBreakdown(prompts);

        // Favorite count
        const favoriteCount = prompts.filter((p) => p.isFavorite).length;

        // Token statistics
        const tokenStats = this.calculateTokenStats(prompts);

        return {
            totalPrompts: prompts.length,
            dateRange: {
                start: startDate,
                end: now,
            },
            dailyStats,
            modelBreakdown,
            favoriteCount,
            tokenStats,
        };
    }

    async getUsageStats(userId: string | mongoose.Types.ObjectId): Promise<UsageStats> {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [today, thisWeek, thisMonth, allTime] = await Promise.all([
            Prompt.countDocuments({ userId, createdAt: { $gte: todayStart } }),
            Prompt.countDocuments({ userId, createdAt: { $gte: weekStart } }),
            Prompt.countDocuments({ userId, createdAt: { $gte: monthStart } }),
            Prompt.countDocuments({ userId }),
        ]);

        // Get token stats for different time periods
        const [todayPrompts, weekPrompts, monthPrompts, allPrompts] = await Promise.all([
            Prompt.find({ userId, createdAt: { $gte: todayStart } }),
            Prompt.find({ userId, createdAt: { $gte: weekStart } }),
            Prompt.find({ userId, createdAt: { $gte: monthStart } }),
            Prompt.find({ userId }),
        ]);

        const calculateTotalTokens = (prompts: any[]) => {
            return prompts.reduce((sum, p) => sum + (p.tokensSaved || 0), 0);
        };

        return {
            today,
            thisWeek,
            thisMonth,
            allTime,
            tokenStats: {
                today: calculateTotalTokens(todayPrompts),
                thisWeek: calculateTotalTokens(weekPrompts),
                thisMonth: calculateTotalTokens(monthPrompts),
                allTime: calculateTotalTokens(allPrompts),
            },
        };
    }

    async getTopPrompts(
        userId: string | mongoose.Types.ObjectId,
        limit: number = 10
    ): Promise<any[]> {
        return Prompt.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('originalText optimizedText createdAt isFavorite');
    }

    private getStartDate(now: Date, range: 'week' | 'month' | 'year'): Date {
        switch (range) {
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'year':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }

    private aggregateDailyTokenStats(
        prompts: any[],
        startDate: Date,
        endDate: Date
    ): DailyTokenStats[] {
        const dailyMap = new Map<string, DailyTokenStats>();

        // Initialize all dates with 0
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dailyMap.set(dateStr, {
                date: dateStr,
                count: 0,
                originalTokens: 0,
                optimizedTokens: 0,
                tokensSaved: 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Aggregate prompts per day with token data
        prompts.forEach((prompt) => {
            const dateStr = new Date(prompt.createdAt).toISOString().split('T')[0];
            const existing = dailyMap.get(dateStr);
            if (existing) {
                existing.count += 1;
                existing.originalTokens += prompt.originalTokens || 0;
                existing.optimizedTokens += prompt.optimizedTokens || 0;
                existing.tokensSaved += prompt.tokensSaved || 0;
            }
        });

        // Convert to array
        return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    private calculateTokenStats(prompts: any[]): TokenStats {
        const totalOriginalTokens = prompts.reduce((sum, p) => sum + (p.originalTokens || 0), 0);
        const totalOptimizedTokens = prompts.reduce((sum, p) => sum + (p.optimizedTokens || 0), 0);
        const totalTokensSaved = prompts.reduce((sum, p) => sum + (p.tokensSaved || 0), 0);

        const averageSavingsPercentage =
            totalOriginalTokens > 0
                ? Math.round((totalTokensSaved / totalOriginalTokens) * 100)
                : 0;

        // Estimate cost savings using GPT-4 pricing ($0.03 per 1K input tokens)
        const costPerToken = 0.03 / 1000;
        const totalCostSavings = totalTokensSaved * costPerToken;

        const averageOriginalTokens =
            prompts.length > 0 ? Math.round(totalOriginalTokens / prompts.length) : 0;
        const averageOptimizedTokens =
            prompts.length > 0 ? Math.round(totalOptimizedTokens / prompts.length) : 0;

        return {
            totalOriginalTokens,
            totalOptimizedTokens,
            totalTokensSaved,
            averageSavingsPercentage,
            totalCostSavings,
            averageOriginalTokens,
            averageOptimizedTokens,
        };
    }

    private aggregateModelBreakdown(
        prompts: any[]
    ): Array<{ model: string; count: number; percentage: number }> {
        const modelMap = new Map<string, number>();

        prompts.forEach((prompt) => {
            const model = prompt.modelUsed || 'unknown';
            modelMap.set(model, (modelMap.get(model) || 0) + 1);
        });

        const total = prompts.length || 1;

        return Array.from(modelMap.entries())
            .map(([model, count]) => ({
                model,
                count,
                percentage: Math.round((count / total) * 100),
            }))
            .sort((a, b) => b.count - a.count);
    }

    async exportToCSV(
        userId: string | mongoose.Types.ObjectId,
        range: 'week' | 'month' | 'year' = 'month'
    ): Promise<string> {
        const analytics = await this.getAnalytics(userId, range);

        // CSV header
        let csv = 'Date,Prompt Count,Original Tokens,Optimized Tokens,Tokens Saved\n';

        // CSV data
        analytics.dailyStats.forEach((stat) => {
            csv += `${stat.date},${stat.count},${stat.originalTokens},${stat.optimizedTokens},${stat.tokensSaved}\n`;
        });

        return csv;
    }
}

export const analyticsService = new AnalyticsService();
