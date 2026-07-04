import { Schema, model } from 'mongoose';
import { ITask } from '../shared/types';

const SubTaskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  isCompleted: { type: Boolean, default: false },
});

const CommentSchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const AttachmentSchema = new Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const ActivitySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'],
      default: 'TODO',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    deadline: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    subtasks: [SubTaskSchema],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: [CommentSchema],
    attachments: [AttachmentSchema],
    activities: [ActivitySchema],
  },
  {
    timestamps: true,
  }
);

export const TaskModel = model('Task', TaskSchema);
