import { NotificationModel } from '../models/Notification';
import { INotification } from '../shared/types';

export class NotificationRepository {
  async create(notificationData: Partial<INotification>): Promise<INotification> {
    const notification = new NotificationModel(notificationData);
    const doc = await notification.save();
    return doc.toObject() as INotification;
  }

  async findByUserId(userId: string, limit: number = 20): Promise<INotification[]> {
    const docs = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(doc => doc.toObject() as INotification);
  }

  async markAsRead(id: string): Promise<INotification | null> {
    const doc = await NotificationModel.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).exec();
    return doc ? (doc.toObject() as INotification) : null;
  }

  async markAllAsRead(userId: string): Promise<{ acknowledged: boolean; modifiedCount: number }> {
    const result = await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } }).exec();
    return {
      acknowledged: result.acknowledged,
      modifiedCount: result.modifiedCount,
    };
  }

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, read: false }).exec();
  }

  async delete(id: string): Promise<INotification | null> {
    const doc = await NotificationModel.findByIdAndDelete(id).exec();
    return doc ? (doc.toObject() as INotification) : null;
  }
}
