import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { templateService } from '../services/template.service.js';

export const getTemplates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { category, search, tags, myTemplates } = req.query;

        const filters: any = {};

        if (category) {
            filters.category = category as string;
        }

        if (search) {
            filters.search = search as string;
        }

        if (tags) {
            filters.tags = Array.isArray(tags) ? tags : [tags];
        }

        if (myTemplates === 'true' && req.userId) {
            filters.createdBy = req.userId;
            filters.isPublic = undefined; // Show both public and private
        }

        const templates = await templateService.getTemplates(filters);

        sendSuccess(res, {
            templates,
            count: templates.length,
        });
    } catch (error) {
        next(error);
    }
};

export const getTemplateById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;

        const template = await templateService.getTemplateById(id);

        if (!template) {
            throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
        }

        sendSuccess(res, template);
    } catch (error) {
        next(error);
    }
};

export const createTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { name, description, content, category, tags, isPublic } = req.body;

        if (!name || !description || !content || !category) {
            throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
        }

        const template = await templateService.createTemplate(req.userId, {
            name,
            description,
            content,
            category,
            tags: tags || [],
            isPublic: isPublic !== undefined ? isPublic : true,
        });

        sendSuccess(res, template, 201);
    } catch (error) {
        next(error);
    }
};

export const updateTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { id } = req.params;
        const { name, description, content, category, tags, isPublic } = req.body;

        const template = await templateService.updateTemplate(id, req.userId, {
            name,
            description,
            content,
            category,
            tags,
            isPublic,
        });

        if (!template) {
            throw new AppError('Template not found or unauthorized', 404, 'TEMPLATE_NOT_FOUND');
        }

        sendSuccess(res, template);
    } catch (error) {
        next(error);
    }
};

export const deleteTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }

        const { id } = req.params;

        const deleted = await templateService.deleteTemplate(id, req.userId);

        if (!deleted) {
            throw new AppError('Template not found or unauthorized', 404, 'TEMPLATE_NOT_FOUND');
        }

        sendSuccess(res, { message: 'Template deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const useTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;

        const template = await templateService.incrementUsage(id);

        if (!template) {
            throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
        }

        sendSuccess(res, template);
    } catch (error) {
        next(error);
    }
};

export const getCategories = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const categories = await templateService.getCategories();
        sendSuccess(res, { categories });
    } catch (error) {
        next(error);
    }
};
