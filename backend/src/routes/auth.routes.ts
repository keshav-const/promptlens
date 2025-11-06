import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getToken } from '../controllers/auth.controller.js';

const router = Router();

router.get('/token', requireAuth, asyncHandler(getToken));

export default router;