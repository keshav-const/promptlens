import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getHistory, updatePrompt, deletePrompt } from '../controllers/history.controller.js';

const router = Router();

// IMPORTANT: Do NOT add checkQuota middleware to history routes
// Users must be able to access their history at any time, even when quota is exceeded
// Only authentication (requireAuth) should be applied
router.get('/', requireAuth, asyncHandler(getHistory));
router.patch('/:id', requireAuth, asyncHandler(updatePrompt));
router.delete('/:id', requireAuth, asyncHandler(deletePrompt));

export default router;
