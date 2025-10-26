import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { checkQuota } from '../middlewares/quota.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { optimizePrompt } from '../controllers/optimize.controller.js';

const router = Router();

router.post('/', requireAuth, checkQuota, asyncHandler(optimizePrompt));

export default router;
