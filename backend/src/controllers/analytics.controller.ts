import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { analyticsService } from '../services/analytics.service.js';

export const getAnalytics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { range } = req.query;
        const validRange = ['week', 'month', 'year'].includes(range as string)
            ? (range as 'week' | 'month' | 'year')
            : 'month';

        const analytics = await analyticsService.getAnalytics(req.userId, validRange);

        sendSuccess(res, analytics);
    } catch (error) {
        next(error);
    }
};

export const getUsageStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const stats = await analyticsService.getUsageStats(req.userId);

        sendSuccess(res, stats);
    } catch (error) {
        next(error);
    }
};

export const getTopPrompts = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { limit } = req.query;
        const limitNum = limit ? parseInt(limit as string, 10) : 10;

        const prompts = await analyticsService.getTopPrompts(req.userId, limitNum);

        sendSuccess(res, { prompts, count: prompts.length });
    } catch (error) {
        next(error);
    }
};

export const exportAnalytics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { range } = req.query;
        const validRange = ['week', 'month', 'year'].includes(range as string)
            ? (range as 'week' | 'month' | 'year')
            : 'month';

        const csv = await analyticsService.exportToCSV(req.userId, validRange);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${validRange}.csv`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
};
