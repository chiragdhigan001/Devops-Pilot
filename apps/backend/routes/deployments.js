import { Router } from 'express';
import { getDeployments, createDeployment } from '../controllers/deploymentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/:projectId', getDeployments);
router.post('/:projectId', createDeployment);

export default router;
