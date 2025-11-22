import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    getABTests,
    getABTestById,
    createABTest,
    updateVariant,
    setWinner,
    updateABTest,
    deleteABTest,
    getStats,
} from '../controllers/abtest.controller.js';

const router = Router();

// All routes require authentication
router.get('/', requireAuth, asyncHandler(getABTests));
router.get('/stats', requireAuth, asyncHandler(getStats));
router.get('/:id', requireAuth, asyncHandler(getABTestById));
router.post('/', requireAuth, asyncHandler(createABTest));
router.put('/:id', requireAuth, asyncHandler(updateABTest));
router.delete('/:id', requireAuth, asyncHandler(deleteABTest));
router.patch('/:id/variants/:variantName', requireAuth, asyncHandler(updateVariant));
router.post('/:id/winner', requireAuth, asyncHandler(setWinner));

export default router;
