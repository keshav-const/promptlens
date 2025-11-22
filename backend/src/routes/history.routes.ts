import { Router } from 'express';
import { requireAuthWithoutQuota } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getHistory, updatePrompt, deletePrompt } from '../controllers/history.controller.js';

const router = Router();

// ⚠️ CRITICAL: Do NOT add checkQuota middleware to history routes
// Users MUST be able to access their history at any time, even when quota is exceeded
// Using requireAuthWithoutQuota to explicitly bypass quota checks
// Adding checkQuota here will cause infinite 429 error loops in the frontend
router.get('/', requireAuthWithoutQuota, asyncHandler(getHistory));
router.patch('/:id', requireAuthWithoutQuota, asyncHandler(updatePrompt));
router.delete('/:id', requireAuthWithoutQuota, asyncHandler(deletePrompt));

export default router;
