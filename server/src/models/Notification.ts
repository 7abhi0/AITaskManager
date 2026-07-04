import { Schema, model } from 'mongoose';
import { INotification } from '../shared/types';

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    } as any,
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['TASK_ASSIGNED', 'STATUS_CHANGED', 'COMMENT_ADDED', 'DEADLINE_APPROACHING', 'SYSTEM'],
      default: 'SYSTEM',
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    } as any,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const NotificationModel = model('Notification', NotificationSchema);
