import { NotificationModel } from '../models/Notification';
import { INotification } from '../shared/types';

export class NotificationRepository {
  async create(notificationData: Partial<INotification>): Promise<any> {
    const notification = new NotificationModel(notificationData);
    return notification.save();
  }

  async findByUserId(userId: string, limit: number = 20): Promise<any[]> {
    return NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async markAsRead(id: string): Promise<any> {
    return NotificationModel.findByIdAndUpdate(id, { $set: { read: true } }, { new: true });
  }

  async markAllAsRead(userId: string): Promise<any> {
    return NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
  }

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, read: false });
  }

  async delete(id: string): Promise<any> {
    return NotificationModel.findByIdAndDelete(id);
  }
}
