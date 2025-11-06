import { Router } from 'express';
import healthRoutes from './health.routes.js';
import exampleRoutes from './example.routes.js';
import optimizeRoutes from './optimize.routes.js';
import historyRoutes from './history.routes.js';
import usageRoutes from './usage.routes.js';
import billingRoutes from './billing.routes.js';
import upgradeRoutes from './upgrade.routes.js';
import authRoutes from './auth.routes.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getToken } from '../controllers/auth.controller.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/example', exampleRoutes);
router.use('/optimize', optimizeRoutes);
router.use('/history', historyRoutes);
router.use('/usage', usageRoutes);
router.use('/billing', billingRoutes);
router.use('/upgrade', upgradeRoutes);
router.use('/auth', authRoutes);

// Direct token endpoint for extension compatibility
router.get('/token', requireAuth, asyncHandler(getToken));

export default router;
