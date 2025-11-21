import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getToken } from '../controllers/auth.controller.js';

const router = Router();

// IMPORTANT: Do NOT add checkQuota middleware to auth routes
// Users must be able to authenticate at any time
// Only authentication (requireAuth) should be applied
router.get('/token', requireAuth, asyncHandler(getToken));

export default router;