import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getUsage } from '../controllers/usage.controller.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getUsage));

export default router;
