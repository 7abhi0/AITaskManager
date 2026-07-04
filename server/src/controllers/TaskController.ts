import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/TaskService';
import { AuthenticatedRequest } from '../middleware/auth';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    category: z.string().optional(),
    deadline: z.string().datetime().or(z.string()).optional(),
    estimatedHours: z.number().min(0).optional(),
    labels: z.array(z.string()).optional(),
    assignedTo: z.string().nullable().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    category: z.string().optional(),
    deadline: z.string().datetime().or(z.string()).nullable().optional(),
    estimatedHours: z.number().min(0).optional(),
    labels: z.array(z.string()).optional(),
    assignedTo: z.string().nullable().optional(),
    subtasks: z.array(z.object({
      _id: z.string().optional(),
      title: z.string(),
      isCompleted: z.boolean(),
    })).optional(),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Comment text cannot be empty'),
  }),
});

export class TaskController {
  private taskService = new TaskService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const creatorId = req.user!.id;
      const creatorName = req.user!.name;
      const task = await this.taskService.createTask(req.body, creatorId, creatorName);
      res.status(201).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        search,
        status,
        priority,
        category,
        assignedTo,
        createdBy,
        label,
        overdue,
        sortField,
        sortOrder,
        page,
        limit,
      } = req.query as any;

      const filters = {
        search,
        status,
        priority,
        category,
        assignedTo,
        createdBy,
        label,
        overdue: overdue === 'true',
      };

      const result = await this.taskService.getTasks(
        filters,
        sortField,
        sortOrder,
        page ? parseInt(page, 10) : 1,
        limit ? parseInt(limit, 10) : 100 // default large limit to support Kanban lists cleanly
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const task = await this.taskService.getTaskById(req.params.id);
      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const userName = req.user!.name;
      const task = await this.taskService.updateTask(req.params.id, req.body, userId, userName);
      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const userName = req.user!.name;
      await this.taskService.deleteTask(req.params.id, userId, userName);
      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  addComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const userName = req.user!.name;
      // Fetch user profile to pass avatar if available
      const { UserRepository } = require('../repositories/UserRepository');
      const userRepo = new UserRepository();
      const user = await userRepo.findById(userId);

      const task = await this.taskService.addComment(
        req.params.id,
        req.body.text,
        userId,
        userName,
        user?.avatar
      );

      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  attachFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' },
        });
      }

      const userId = req.user!.id;
      const userName = req.user!.name;
      const task = await this.taskService.addAttachment(req.params.id, req.file, userId, userName);

      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  triggerAISubtasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const task = await this.taskService.triggerAISubtasksBreakdown(req.params.id);
      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // If user is Member, limit stats to their assignments
      const filterUserId = req.user!.role === 'MEMBER' ? req.user!.id : undefined;
      const stats = await this.taskService.getDashboardStats(filterUserId);
      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // If member, filter analytics to them
      const filterUserId = req.user!.role === 'MEMBER' ? req.user!.id : undefined;
      const analytics = await this.taskService.getAnalytics(filterUserId);
      res.status(200).json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  };
}
