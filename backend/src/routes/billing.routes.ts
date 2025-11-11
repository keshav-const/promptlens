import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { 
  createCheckoutSession, 
  verifyPayment, 
  handleWebhook, 
  getBillingStatus 
} from '../controllers/billing.controller.js';

const router = Router();

router.post('/checkout', requireAuth, asyncHandler(createCheckoutSession));
router.post('/verify', requireAuth, asyncHandler(verifyPayment));
router.get('/status', requireAuth, asyncHandler(getBillingStatus));
router.post('/webhook', asyncHandler(handleWebhook));

export default router;