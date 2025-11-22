import { Prompt } from '../models/index.js';
import mongoose from 'mongoose';

export interface AnalyticsData {
    totalPrompts: number;
    dateRange: {
        start: Date;
        end: Date;
    };
    dailyStats: Array<{
        date: string;
        count: number;
    }>;
    modelBreakdown: Array<{
        model: string;
        count: number;
        percentage: number;
    }>;
    favoriteCount: number;
}

export interface UsageStats {
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
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

        // Daily stats
        const dailyStats = this.aggregateDailyStats(prompts, startDate, now);

        // Model breakdown
        const modelBreakdown = this.aggregateModelBreakdown(prompts);

        // Favorite count
        const favoriteCount = prompts.filter((p) => p.isFavorite).length;

        return {
            totalPrompts: prompts.length,
            dateRange: {
                start: startDate,
                end: now,
            },
            dailyStats,
            modelBreakdown,
            favoriteCount,
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

        return { today, thisWeek, thisMonth, allTime };
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

    private aggregateDailyStats(
        prompts: any[],
        startDate: Date,
        endDate: Date
    ): Array<{ date: string; count: number }> {
        const dailyMap = new Map<string, number>();

        // Initialize all dates with 0
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dailyMap.set(dateStr, 0);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count prompts per day
        prompts.forEach((prompt) => {
            const dateStr = new Date(prompt.createdAt).toISOString().split('T')[0];
            dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
        });

        // Convert to array
        return Array.from(dailyMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
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
        let csv = 'Date,Prompt Count\n';

        // CSV data
        analytics.dailyStats.forEach((stat) => {
            csv += `${stat.date},${stat.count}\n`;
        });

        return csv;
    }
}

export const analyticsService = new AnalyticsService();
