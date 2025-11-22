import { Router } from 'express';
import healthRoutes from './health.routes.js';
import exampleRoutes from './example.routes.js';
import optimizeRoutes from './optimize.routes.js';
import historyRoutes from './history.routes.js';
import usageRoutes from './usage.routes.js';
import billingRoutes from './billing.routes.js';
import authRoutes from './auth.routes.js';
import templateRoutes from './template.routes.js';
import abTestRoutes from './abtest.routes.js';
import analyticsRoutes from './analytics.routes.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getToken } from '../controllers/auth.controller.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/example', exampleRoutes);

// Protected routes
router.use('/optimize', optimizeRoutes);
router.use('/usage', usageRoutes);
router.use('/history', historyRoutes);
router.use('/billing', billingRoutes);
router.use('/templates', templateRoutes);
router.use('/ab-tests', abTestRoutes);
router.use('/analytics', analyticsRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Direct token endpoint for extension compatibility
router.get('/token', requireAuth, asyncHandler(getToken));

export default router;
