import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { abTestService } from '../services/abtest.service.js';

export const getABTests = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { status } = req.query;

        const tests = await abTestService.getABTests(req.userId, {
            status: status as 'draft' | 'active' | 'completed' | undefined,
        });

        sendSuccess(res, { tests, count: tests.length });
    } catch (error) {
        next(error);
    }
};

export const getABTestById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { id } = req.params;

        const test = await abTestService.getABTestById(id, req.userId);

        if (!test) {
            throw new AppError('A/B test not found', 404, 'TEST_NOT_FOUND');
        }

        sendSuccess(res, test);
    } catch (error) {
        next(error);
    }
};

export const createABTest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { name, description, variants } = req.body;

        if (!name || !variants || !Array.isArray(variants)) {
            throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
        }

        if (variants.length < 2 || variants.length > 5) {
            throw new AppError('Must have between 2 and 5 variants', 400, 'INVALID_VARIANTS');
        }

        const test = await abTestService.createABTest(req.userId, {
            name,
            description,
            variants,
        });

        sendSuccess(res, test, 201);
    } catch (error) {
        next(error);
    }
};

export const updateVariant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { id, variantName } = req.params;
        const { optimizedPrompt, responseTime, rating, notes } = req.body;

        const test = await abTestService.updateVariant(id, req.userId, variantName, {
            optimizedPrompt,
            responseTime,
            rating,
            notes,
        });

        if (!test) {
            throw new AppError('A/B test not found', 404, 'TEST_NOT_FOUND');
        }

        sendSuccess(res, test);
    } catch (error) {
        next(error);
    }
};

export const setWinner = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { id } = req.params;
        const { winner } = req.body;

        if (!winner) {
            throw new AppError('Winner name is required', 400, 'MISSING_WINNER');
        }

        const test = await abTestService.setWinner(id, req.userId, winner);

        if (!test) {
            throw new AppError('A/B test not found', 404, 'TEST_NOT_FOUND');
        }

        sendSuccess(res, test);
    } catch (error) {
        next(error);
    }
};

export const updateABTest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { id } = req.params;
        const { name, description, status } = req.body;

        const test = await abTestService.updateABTest(id, req.userId, {
            name,
            description,
            status,
        });

        if (!test) {
            throw new AppError('A/B test not found', 404, 'TEST_NOT_FOUND');
        }

        sendSuccess(res, test);
    } catch (error) {
        next(error);
    }
};

export const deleteABTest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { id } = req.params;

        const deleted = await abTestService.deleteABTest(id, req.userId);

        if (!deleted) {
            throw new AppError('A/B test not found', 404, 'TEST_NOT_FOUND');
        }

        sendSuccess(res, { message: 'A/B test deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const stats = await abTestService.getStats(req.userId);

        sendSuccess(res, stats);
    } catch (error) {
        next(error);
    }
};
