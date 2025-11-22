import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    getAnalytics,
    getUsageStats,
    getTopPrompts,
    exportAnalytics,
} from '../controllers/analytics.controller.js';

const router = Router();

// All routes require authentication
router.get('/', requireAuth, asyncHandler(getAnalytics));
router.get('/stats', requireAuth, asyncHandler(getUsageStats));
router.get('/top-prompts', requireAuth, asyncHandler(getTopPrompts));
router.get('/export', requireAuth, asyncHandler(exportAnalytics));

export default router;
