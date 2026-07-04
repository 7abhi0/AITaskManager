import { Router } from 'express';
import { TaskController, createTaskSchema, updateTaskSchema, commentSchema } from '../controllers/TaskController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { uploadMiddleware } from '../services/UploadService';

const router = Router();
const controller = new TaskController();

router.use(authenticate);

router.get('/', controller.getAll);
router.post('/', validateRequest(createTaskSchema), controller.create);
router.get('/dashboard/stats', controller.getDashboardStats);
router.get('/dashboard/analytics', controller.getAnalytics);

router.get('/:id', controller.getById);
router.put('/:id', validateRequest(updateTaskSchema), controller.update);
router.delete('/:id', controller.delete);

router.post('/:id/comments', validateRequest(commentSchema), controller.addComment);
router.post('/:id/attachments', uploadMiddleware.single('file'), controller.attachFile);
router.post('/:id/ai/subtasks', controller.triggerAISubtasks);

export default router;
