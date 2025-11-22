import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getCategories,
} from '../controllers/template.controller.js';

const router = Router();

// Public routes (no auth required)
router.get('/categories', asyncHandler(getCategories));

// Routes that work with or without auth
router.get('/', optionalAuth, asyncHandler(getTemplates));
router.get('/:id', optionalAuth, asyncHandler(getTemplateById));

// Protected routes (auth required)
router.post('/', requireAuth, asyncHandler(createTemplate));
router.put('/:id', requireAuth, asyncHandler(updateTemplate));
router.delete('/:id', requireAuth, asyncHandler(deleteTemplate));
router.post('/:id/use', optionalAuth, asyncHandler(useTemplate));

export default router;
