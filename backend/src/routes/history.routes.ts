import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getHistory } from '../controllers/history.controller.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getHistory));

export default router;
