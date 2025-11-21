import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getUsage } from '../controllers/usage.controller.js';

const router = Router();

// IMPORTANT: Do NOT add checkQuota middleware to usage routes
// Users must be able to check their usage at any time, especially when quota is exceeded
// Only authentication (requireAuth) should be applied
router.get('/', requireAuth, asyncHandler(getUsage));

export default router;
