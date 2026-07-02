import { Router } from 'express';
import { getDeployments, createDeployment } from '../controllers/deploymentController.js';
import { protect } from '../middleware/auth.js';
import { deployLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);

router.get('/:projectId', getDeployments);
router.post('/:projectId', deployLimiter, createDeployment);

export default router;
