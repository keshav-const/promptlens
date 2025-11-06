import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getHistory, updatePrompt, deletePrompt } from '../controllers/history.controller.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getHistory));
router.patch('/:id', requireAuth, asyncHandler(updatePrompt));
router.delete('/:id', requireAuth, asyncHandler(deletePrompt));

export default router;
