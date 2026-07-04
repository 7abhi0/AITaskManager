import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.getNotifications);
router.put('/mark-all-read', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);

export default router;
