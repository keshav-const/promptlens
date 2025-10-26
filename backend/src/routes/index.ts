import { Router } from 'express';
import healthRoutes from './health.routes.js';
import exampleRoutes from './example.routes.js';
import optimizeRoutes from './optimize.routes.js';
import historyRoutes from './history.routes.js';
import usageRoutes from './usage.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/example', exampleRoutes);
router.use('/optimize', optimizeRoutes);
router.use('/history', historyRoutes);
router.use('/usage', usageRoutes);

export default router;
