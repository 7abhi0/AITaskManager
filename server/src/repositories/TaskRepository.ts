import { FilterQuery } from 'mongoose';
import { TaskModel } from '../models/Task';
import { ITask, TaskStatus, TaskPriority } from '../shared/types';

export interface TaskFilterOptions {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  assignedTo?: string;
  createdBy?: string;
  label?: string;
  overdue?: boolean;
}

export interface CompletionStat {
  _id: string;
  count: number;
}

export interface PriorityStat {
  _id: string;
  count: number;
}

export interface WorkloadStat {
  _id: string;
  userName: string;
  taskCount: number;
  estimatedHours: number;
}

export interface WeeklyProgressStat {
  _id: {
    day: number;
    status: string;
  };
  count: number;
}

export class TaskRepository {
  async findById(id: string): Promise<ITask | null> {
    const doc = await TaskModel.findById(id)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar')
      .exec();
    return doc ? (doc.toObject() as ITask) : null;
  }

  async create(taskData: Partial<ITask>): Promise<ITask | null> {
    const task = new TaskModel(taskData);
    await task.save();
    return this.findById(task._id.toString());
  }

  async update(id: string, updateData: Partial<ITask>): Promise<ITask | null> {
    await TaskModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
    return this.findById(id);
  }

  async delete(id: string): Promise<ITask | null> {
    const doc = await TaskModel.findByIdAndDelete(id).exec();
    return doc ? (doc.toObject() as ITask) : null;
  }

  async findPaginated(
    filters: TaskFilterOptions,
    sortField: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    page: number = 1,
    limit: number = 10
  ): Promise<{ tasks: ITask[]; total: number }> {
    const query: FilterQuery<ITask> = {};

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }

    if (filters.label) {
      query.labels = filters.label;
    }

    if (filters.overdue) {
      query.deadline = { $lt: new Date() };
      query.status = { $ne: 'COMPLETED' };
    }

    const total = await TaskModel.countDocuments(query).exec();
    
    const docs = await TaskModel.find(query)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar')
      .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const tasks = docs.map(doc => doc.toObject() as ITask);
    return { tasks, total };
  }

  async addComment(id: string, commentData: Record<string, unknown>): Promise<ITask | null> {
    await TaskModel.findByIdAndUpdate(
      id,
      { $push: { comments: commentData } },
      { new: true }
    )
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar')
      .exec();
    return this.findById(id);
  }

  async addActivity(id: string, activityData: Record<string, unknown>): Promise<ITask | null> {
    await TaskModel.findByIdAndUpdate(
      id,
      { $push: { activities: activityData } },
      { new: true }
    ).exec();
    return this.findById(id);
  }

  async addAttachment(id: string, attachmentData: Record<string, unknown>): Promise<ITask | null> {
    await TaskModel.findByIdAndUpdate(
      id,
      { $push: { attachments: attachmentData } },
      { new: true }
    ).exec();
    return this.findById(id);
  }

  async count(query: FilterQuery<ITask> = {}): Promise<number> {
    return TaskModel.countDocuments(query).exec();
  }

  async getCompletionStats(userId?: string): Promise<CompletionStat[]> {
    const match: FilterQuery<ITask> = {};
    if (userId) {
      match.assignedTo = userId;
    }
    const result = await TaskModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec();
    return result as CompletionStat[];
  }

  async getPriorityStats(userId?: string): Promise<PriorityStat[]> {
    const match: FilterQuery<ITask> = {};
    if (userId) {
      match.assignedTo = userId;
    }
    const result = await TaskModel.aggregate([
      { $match: match },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]).exec();
    return result as PriorityStat[];
  }

  async getWorkloadStats(): Promise<WorkloadStat[]> {
    const result = await TaskModel.aggregate([
      { $match: { status: { $ne: 'COMPLETED' }, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          taskCount: { $sum: 1 },
          estimatedHours: { $sum: '$estimatedHours' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          userName: '$user.name',
          taskCount: 1,
          estimatedHours: 1,
        },
      },
    ]).exec();
    return result as WorkloadStat[];
  }

  async getWeeklyProgress(userId?: string): Promise<WeeklyProgressStat[]> {
    const match: FilterQuery<ITask> = {
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
    if (userId) {
      match.assignedTo = userId;
    }

    const result = await TaskModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$createdAt' },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
    ]).exec();
    return result as WeeklyProgressStat[];
  }
}
