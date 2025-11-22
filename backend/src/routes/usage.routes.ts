import { Router } from 'express';
import { requireAuthWithoutQuota } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getUsage } from '../controllers/usage.controller.js';

const router = Router();

// ⚠️ CRITICAL: Do NOT add checkQuota middleware to usage routes
// Users MUST be able to check their usage at any time, especially when quota is exceeded
// Using requireAuthWithoutQuota to explicitly bypass quota checks
// Adding checkQuota here will cause infinite 429 error loops in the frontend
router.get('/', requireAuthWithoutQuota, asyncHandler(getUsage));

export default router;
