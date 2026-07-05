import { TaskRepository, TaskFilterOptions } from '../repositories/TaskRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { aiService } from './AIService';
import { socketService } from './SocketService';
import { queueService } from './QueueService';
import { uploadService } from './UploadService';
import { ITask, IDashboardStats } from '../shared/types';
import { logger } from '../middleware/logger';

export interface TaskAnalytics {
  weeklyProgress: Array<{ day: string; completed: number; created: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
  completionRate: Array<{ name: string; value: number }>;
}

export class TaskService {
  private taskRepository = new TaskRepository();
  private notificationRepository = new NotificationRepository();

  async createTask(taskData: Partial<ITask>, creatorId: string, creatorName: string): Promise<ITask> {
    logger.debug(`Creating task: ${taskData.title} by creator: ${creatorName}`);
    taskData.createdBy = creatorId;
    taskData.activities = [
      {
        userId: creatorId,
        userName: creatorName,
        action: 'Created the task',
        timestamp: new Date().toISOString(),
      },
    ];

    // Trigger AI features if requested or as a standard pipeline
    // Let's run initial predictions
    if (!taskData.category || taskData.category === 'General') {
      taskData.category = await aiService.categorizeTask(taskData.title || '', taskData.description || '');
    }
    if (!taskData.priority) {
      taskData.priority = await aiService.predictPriority(taskData.title || '', taskData.description || '');
    }
    if (!taskData.deadline) {
      taskData.deadline = (await aiService.recommendDeadline(taskData.title || '', taskData.description || '')).toISOString();
    }

    const task = await this.taskRepository.create(taskData);
    if (!task) {
      throw new Error('Failed to create task');
    }

    // Notify assigned user if present
    if (task.assignedTo) {
      const assignedId = typeof task.assignedTo === 'object' ? (task.assignedTo as { _id?: string })._id?.toString() || task.assignedTo.toString() : task.assignedTo.toString();
      await this.createNotification(
        assignedId,
        `You have been assigned a new task: "${task.title}"`,
        'TASK_ASSIGNED',
        task._id.toString()
      );
    }

    // Broadcast update via Socket.IO
    socketService.broadcast('task_created', task);

    return task;
  }

  async getTaskById(id: string): Promise<ITask> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      const error: Error & { statusCode?: number } = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }
    return task;
  }

  async updateTask(
    id: string,
    updateData: Partial<ITask>,
    userId: string,
    userName: string
  ): Promise<ITask> {
    logger.debug(`Updating task: ${id} by user: ${userName}`);
    const originalTask = await this.getTaskById(id);

    const activitiesToPush: Array<{ userId: string; userName: string; action: string; timestamp: string }> = [];
    const notificationsToDispatch: Array<{ userId: string; message: string; type: string }> = [];

    // Track status change
    if (updateData.status && updateData.status !== originalTask.status) {
      activitiesToPush.push({
        userId,
        userName,
        action: `Changed status from ${originalTask.status} to ${updateData.status}`,
        timestamp: new Date().toISOString(),
      });

      // Notify owner and assignee
      const creatorId = typeof originalTask.createdBy === 'object' ? (originalTask.createdBy as { _id?: string })._id?.toString() || originalTask.createdBy.toString() : originalTask.createdBy.toString();
      if (creatorId !== userId) {
        notificationsToDispatch.push({
          userId: creatorId,
          message: `Task "${originalTask.title}" status changed to ${updateData.status}`,
          type: 'STATUS_CHANGED',
        });
      }
      if (originalTask.assignedTo) {
        const assignedId = typeof originalTask.assignedTo === 'object' ? (originalTask.assignedTo as { _id?: string })._id?.toString() || originalTask.assignedTo.toString() : originalTask.assignedTo.toString();
        if (assignedId !== userId && assignedId !== creatorId) {
          notificationsToDispatch.push({
            userId: assignedId,
            message: `Task "${originalTask.title}" status changed to ${updateData.status}`,
            type: 'STATUS_CHANGED',
          });
        }
      }
    }

    // Track assignment change
    if (updateData.assignedTo !== undefined) {
      const originalAssignedId = originalTask.assignedTo
        ? (typeof originalTask.assignedTo === 'object' ? (originalTask.assignedTo as { _id?: string })._id?.toString() || originalTask.assignedTo.toString() : originalTask.assignedTo.toString())
        : null;
      const newAssignedId = updateData.assignedTo
        ? (typeof updateData.assignedTo === 'object' ? (updateData.assignedTo as any)._id?.toString() || updateData.assignedTo.toString() : updateData.assignedTo.toString())
        : null;

      if (newAssignedId !== originalAssignedId) {
        activitiesToPush.push({
          userId,
          userName,
          action: newAssignedId ? 'Assigned the task' : 'Unassigned the task',
          timestamp: new Date().toISOString(),
        });

        if (newAssignedId && newAssignedId !== userId) {
          notificationsToDispatch.push({
            userId: newAssignedId,
            message: `You have been assigned to task: "${originalTask.title}"`,
            type: 'TASK_ASSIGNED',
          });
        }
      }
    }

    // Merge activities
    const mergedUpdate = { ...updateData };
    if (activitiesToPush.length > 0) {
      mergedUpdate.activities = [...originalTask.activities, ...activitiesToPush];
    }

    const updatedTask = await this.taskRepository.update(id, mergedUpdate);
    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    // Queue asynchronous notifications dispatches
    notificationsToDispatch.forEach((notif) => {
      queueService.addJob(
        'notification_dispatch',
        { ...notif, taskId: id },
        async (data: Record<string, string>) => {
          await this.createNotification(data['userId']!, data['message']!, data['type'] as any, data['taskId']);
        }
      );
    });

    // Broadcast update via Socket.IO
    socketService.broadcast('task_updated', updatedTask);

    return updatedTask;
  }

  async deleteTask(id: string, _userId: string, userName: string): Promise<ITask> {
    logger.debug(`Deleting task: ${id} by user: ${userName}`);
    const task = await this.getTaskById(id);
    await this.taskRepository.delete(id);

    // Broadcast deletion via Socket.IO
    socketService.broadcast('task_deleted', { id, title: task.title });
    return task;
  }

  async addComment(id: string, text: string, userId: string, userName: string, userAvatar?: string): Promise<ITask> {
    const commentData = {
      taskId: id,
      userId,
      userName,
      userAvatar: userAvatar || '',
      text,
      createdAt: new Date().toISOString(),
    };

    await this.taskRepository.addComment(id, commentData);
    
    // Log comment activity
    await this.taskRepository.addActivity(id, {
      userId,
      userName,
      action: `Added a comment: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      timestamp: new Date().toISOString(),
    });

    const task = await this.getTaskById(id);

    // Trigger Notification for creator/assignee
    const creatorId = typeof task.createdBy === 'object' ? (task.createdBy as { _id?: string })._id?.toString() || task.createdBy.toString() : task.createdBy.toString();
    const notificationsToDispatch: Array<{ userId: string; message: string }> = [];

    if (creatorId !== userId) {
      notificationsToDispatch.push({
        userId: creatorId,
        message: `${userName} commented on your task "${task.title}"`,
      });
    }

    if (task.assignedTo) {
      const assignedId = typeof task.assignedTo === 'object' ? (task.assignedTo as { _id?: string })._id?.toString() || task.assignedTo.toString() : task.assignedTo.toString();
      if (assignedId !== userId && assignedId !== creatorId) {
        notificationsToDispatch.push({
          userId: assignedId,
          message: `${userName} commented on task you are assigned to: "${task.title}"`,
        });
      }
    }

    notificationsToDispatch.forEach((notif) => {
      queueService.addJob(
        'comment_notification',
        { userId: notif.userId, message: notif.message, taskId: id },
        async (data: Record<string, string>) => {
          await this.createNotification(data['userId']!, data['message']!, 'COMMENT_ADDED', data['taskId']);
        }
      );
    });

    const updatedTask = await this.getTaskById(id);
    socketService.broadcast('task_updated', updatedTask);
    return updatedTask;
  }

  async addAttachment(id: string, file: Express.Multer.File, userId: string, userName: string): Promise<ITask> {
    const fileResult = await uploadService.uploadFile(file);

    const attachmentData = {
      filename: fileResult.filename,
      path: fileResult.path,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    await this.taskRepository.addAttachment(id, attachmentData);
    
    // Log upload activity
    await this.taskRepository.addActivity(id, {
      userId,
      userName,
      action: `Attached file: "${fileResult.filename}"`,
      timestamp: new Date().toISOString(),
    });

    const updatedTask = await this.getTaskById(id);
    socketService.broadcast('task_updated', updatedTask);
    return updatedTask;
  }

  async triggerAISubtasksBreakdown(id: string): Promise<ITask> {
    const task = await this.getTaskById(id);
    const subtaskTitles = await aiService.breakIntoSubtasks(task.title, task.description || '');
    
    const subtasks = subtaskTitles.map(title => ({
      title,
      isCompleted: false
    }));

    const updatedTask = await this.taskRepository.update(id, { subtasks });
    if (!updatedTask) {
      throw new Error('Failed to update task with subtasks');
    }
    socketService.broadcast('task_updated', updatedTask);
    return updatedTask;
  }

  async getTasks(
    filters: TaskFilterOptions,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    page?: number,
    limit?: number
  ): Promise<{ tasks: ITask[]; total: number }> {
    return this.taskRepository.findPaginated(filters, sortField, sortOrder, page, limit);
  }

  async getDashboardStats(userId?: string): Promise<IDashboardStats> {
    const totalQuery = userId ? { assignedTo: userId } : {};
    const completedQuery = userId ? { assignedTo: userId, status: 'COMPLETED' } : { status: 'COMPLETED' };
    const pendingQuery = userId ? { assignedTo: userId, status: { $ne: 'COMPLETED' } } : { status: { $ne: 'COMPLETED' } };
    const overdueQuery = userId ? { assignedTo: userId, status: { $ne: 'COMPLETED' }, deadline: { $lt: new Date() } } : { status: { $ne: 'COMPLETED' }, deadline: { $lt: new Date() } };

    const total = await this.taskRepository.count(totalQuery);
    const completed = await this.taskRepository.count(completedQuery);
    const pending = await this.taskRepository.count(pendingQuery);
    const overdue = await this.taskRepository.count(overdueQuery);
    
    const productivityRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // AI Suggestions based on status
    const allPendingTasks = await this.taskRepository.findPaginated(
      userId ? { assignedTo: userId } : {},
      'deadline',
      'asc',
      1,
      20
    );
    const suggestions: string[] = [];

    // Analyze imminent risks
    const overdueRisks = await aiService.detectOverdueRisks(allPendingTasks.tasks);
    if (overdueRisks.length > 0 && overdueRisks[0] !== 'No imminent deadline risks detected. All schedules are on track.') {
      suggestions.push(`Deadline Alert: Tasks like "${overdueRisks.slice(0, 2).join(', ')}" need attention to avoid delays.`);
    }

    // Recommend next task
    if (userId) {
      const nextTask = await aiService.suggestNextBestTask(allPendingTasks.tasks, userId);
      if (nextTask) {
        suggestions.push(`Recommended Focus: Work on "${nextTask.title}" next. It is marked as ${nextTask.priority} priority and is due soon.`);
      }
    }

    // Load balance recommendations
    if (!userId) {
      const workloadStats = await this.taskRepository.getWorkloadStats();
      const workloadBalance = await aiService.generateWorkloadSuggestions(workloadStats);
      suggestions.push(workloadBalance);
    } else {
      suggestions.push('Keep up the good progress! Update your estimates regularly to refine predictions.');
    }

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
      productivityRate,
      aiSuggestions: suggestions,
    };
  }

  async getAnalytics(userId?: string): Promise<TaskAnalytics> {
    const weeklyData = await this.taskRepository.getWeeklyProgress(userId);
    const priorityStats = await this.taskRepository.getPriorityStats(userId);
    const statusStats = await this.taskRepository.getCompletionStats(userId);

    // Map weekly chart counts: Sunday=1, Saturday=7
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyProgress = daysOfWeek.map((day, index) => {
      const dayIndex = index + 1;
      const completedTasks = weeklyData.filter(d => d._id.day === dayIndex && d._id.status === 'COMPLETED');
      const totalTasks = weeklyData.filter(d => d._id.day === dayIndex);
      
      return {
        day,
        completed: completedTasks.reduce((acc, curr) => acc + curr.count, 0),
        created: totalTasks.reduce((acc, curr) => acc + curr.count, 0),
      };
    });

    return {
      weeklyProgress,
      priorityDistribution: priorityStats.map(p => ({ priority: p._id, count: p.count })),
      completionRate: statusStats.map(s => ({ name: s._id, value: s.count })),
    };
  }

  private async createNotification(
    userId: string,
    message: string,
    type: 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'DEADLINE_APPROACHING' | 'SYSTEM',
    taskId?: string
  ): Promise<any> {
    const notification = await this.notificationRepository.create({
      userId,
      message,
      read: false,
      type,
      taskId,
    });

    // Push socket event
    socketService.sendToUser(userId, 'notification', notification);
    return notification;
  }
}
