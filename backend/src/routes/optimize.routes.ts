import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { checkQuota } from '../middlewares/quota.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { optimizePrompt } from '../controllers/optimize.controller.js';

const router = Router();

// IMPORTANT: checkQuota middleware MUST be applied to optimize endpoint
// This is the ONLY endpoint that should enforce quota limits
// All other endpoints (history, usage, billing, auth) should NOT have checkQuota
router.post('/', requireAuth, checkQuota, asyncHandler(optimizePrompt));

export default router;
