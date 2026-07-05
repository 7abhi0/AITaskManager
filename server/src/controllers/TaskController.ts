import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/TaskService';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRepository } from '../repositories/UserRepository';

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
  private userRepository = new UserRepository();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creatorId = req.user!.id;
      const creatorName = req.user!.name;
      const task = await this.taskService.createTask(req.body as Record<string, unknown>, creatorId, creatorName);
      res.status(201).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query;
      const search = typeof query['search'] === 'string' ? query['search'] : undefined;
      const status = typeof query['status'] === 'string' ? query['status'] : undefined;
      const priority = typeof query['priority'] === 'string' ? query['priority'] : undefined;
      const category = typeof query['category'] === 'string' ? query['category'] : undefined;
      const assignedTo = typeof query['assignedTo'] === 'string' ? query['assignedTo'] : undefined;
      const createdBy = typeof query['createdBy'] === 'string' ? query['createdBy'] : undefined;
      const label = typeof query['label'] === 'string' ? query['label'] : undefined;
      const overdue = query['overdue'] === 'true';
      const sortField = typeof query['sortField'] === 'string' ? query['sortField'] : undefined;
      const sortOrder = query['sortOrder'] === 'asc' ? 'asc' : query['sortOrder'] === 'desc' ? 'desc' : undefined;
      const pageRaw = typeof query['page'] === 'string' ? query['page'] : undefined;
      const limitRaw = typeof query['limit'] === 'string' ? query['limit'] : undefined;

      const filters = {
        search,
        status: status as import('../shared/types').TaskStatus | undefined,
        priority: priority as import('../shared/types').TaskPriority | undefined,
        category,
        assignedTo,
        createdBy,
        label,
        overdue,
      };

      const result = await this.taskService.getTasks(
        filters,
        sortField,
        sortOrder,
        pageRaw ? parseInt(pageRaw, 10) : 1,
        limitRaw ? parseInt(limitRaw, 10) : 100
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.taskService.getTaskById(req.params['id']!);
      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userName = req.user!.name;
      const task = await this.taskService.updateTask(req.params['id']!, req.body as Record<string, unknown>, userId, userName);
      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userName = req.user!.name;
      await this.taskService.deleteTask(req.params['id']!, userId, userName);
      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  addComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userName = req.user!.name;
      const user = await this.userRepository.findById(userId) as { avatar?: string } | null;

      const body = req.body as { text: string };
      const task = await this.taskService.addComment(
        req.params['id']!,
        body.text,
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

  attachFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' },
        });
        return;
      }

      const userId = req.user!.id;
      const userName = req.user!.name;
      const task = await this.taskService.addAttachment(req.params['id']!, req.file, userId, userName);

      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  triggerAISubtasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.taskService.triggerAISubtasksBreakdown(req.params['id']!);
      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
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

  getAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
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
