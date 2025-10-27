import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createCheckoutSession } from '../controllers/billing.controller.js';

const router = Router();

router.post('/checkout', requireAuth, asyncHandler(createCheckoutSession));

export default router;
