import { Router } from 'express';
import { generateDockerfileHandler, generateWorkflowHandler, analyzeLogsHandler } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);
router.use(aiLimiter);

router.post('/generate-dockerfile', generateDockerfileHandler);
router.post('/generate-workflow', generateWorkflowHandler);
router.post('/analyze-logs', analyzeLogsHandler);

export default router;
