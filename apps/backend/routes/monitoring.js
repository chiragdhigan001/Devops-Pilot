import { Router } from 'express';
import { getMetrics, getDeploymentHistory, getStats, getInsights, getLogs } from '../controllers/monitoringController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/metrics', getMetrics);
router.get('/history', getDeploymentHistory);
router.get('/stats', getStats);
router.get('/insights', getInsights);
router.get('/logs', getLogs);

export default router;
