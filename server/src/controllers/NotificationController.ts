import { Response, NextFunction } from 'express';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { AuthenticatedRequest } from '../middleware/auth';

export class NotificationController {
  private notificationRepository = new NotificationRepository();

  getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const notifications = await this.notificationRepository.findByUserId(userId);
      const unreadCount = await this.notificationRepository.countUnread(userId);

      res.status(200).json({
        success: true,
        data: { notifications, unreadCount },
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const notification = await this.notificationRepository.markAsRead(req.params.id);
      res.status(200).json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      await this.notificationRepository.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  };
}
