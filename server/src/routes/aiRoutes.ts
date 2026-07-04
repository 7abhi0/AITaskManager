import { Router } from 'express';
import { AIController, predictAISchema } from '../controllers/AIController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
const controller = new AIController();

router.use(authenticate);

router.post('/predict-category', validateRequest(predictAISchema), controller.predictCategory);
router.post('/predict-priority', validateRequest(predictAISchema), controller.predictPriority);
router.post('/recommend-deadline', validateRequest(predictAISchema), controller.recommendDeadline);
router.get('/suggest-next-task', controller.suggestNextTask);

export default router;
