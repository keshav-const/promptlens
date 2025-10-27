import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { handleWebhook } from '../controllers/billing.controller.js';

const router = Router();

router.post('/', asyncHandler(handleWebhook));

export default router;
