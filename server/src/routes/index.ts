import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import taskRoutes from './taskRoutes';
import notificationRoutes from './notificationRoutes';
import aiRoutes from './aiRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);

export default router;
