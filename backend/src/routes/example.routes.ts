import { Router } from 'express';
import {
  getProtectedExample,
  getPublicExample,
  getErrorExample,
} from '../controllers/example.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/public', getPublicExample);
router.get('/protected', requireAuth, getProtectedExample);
router.get('/error', asyncHandler(getErrorExample));

export default router;
