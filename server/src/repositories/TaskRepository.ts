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

export class TaskRepository {
  async findById(id: string): Promise<any> {
    return TaskModel.findById(id)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar');
  }

  async create(taskData: Partial<ITask>): Promise<any> {
    const task = new TaskModel(taskData);
    await task.save();
    return this.findById(task._id.toString());
  }

  async update(id: string, updateData: Partial<ITask>): Promise<any> {
    await TaskModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    return this.findById(id);
  }

  async delete(id: string): Promise<any> {
    return TaskModel.findByIdAndDelete(id);
  }

  async findPaginated(
    filters: TaskFilterOptions,
    sortField: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    page: number = 1,
    limit: number = 10
  ): Promise<{ tasks: any[]; total: number }> {
    const query: any = {};

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

    const total = await TaskModel.countDocuments(query);
    
    const tasks = await TaskModel.find(query)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar')
      .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { tasks, total };
  }

  async addComment(id: string, commentData: any): Promise<any> {
    return TaskModel.findByIdAndUpdate(
      id,
      { $push: { comments: commentData } },
      { new: true }
    )
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar');
  }

  async addActivity(id: string, activityData: any): Promise<any> {
    return TaskModel.findByIdAndUpdate(
      id,
      { $push: { activities: activityData } },
      { new: true }
    );
  }

  async addAttachment(id: string, attachmentData: any): Promise<any> {
    return TaskModel.findByIdAndUpdate(
      id,
      { $push: { attachments: attachmentData } },
      { new: true }
    );
  }

  async count(query: any = {}): Promise<number> {
    return TaskModel.countDocuments(query);
  }

  async getCompletionStats(userId?: string): Promise<any[]> {
    const match: any = {};
    if (userId) {
      match.assignedTo = userId;
    }
    return TaskModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async getPriorityStats(userId?: string): Promise<any[]> {
    const match: any = {};
    if (userId) {
      match.assignedTo = userId;
    }
    return TaskModel.aggregate([
      { $match: match },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
  }

  async getWorkloadStats(): Promise<any[]> {
    return TaskModel.aggregate([
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
    ]);
  }

  async getWeeklyProgress(userId?: string): Promise<any[]> {
    const match: any = {
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
    if (userId) {
      match.assignedTo = userId;
    }

    return TaskModel.aggregate([
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
    ]);
  }
}
