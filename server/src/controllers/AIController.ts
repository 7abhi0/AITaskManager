import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from '../services/AIService';
import { TaskRepository } from '../repositories/TaskRepository';
import { AuthenticatedRequest } from '../middleware/auth';

export const predictAISchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required for AI predictions'),
    description: z.string().optional().default(''),
  }),
});

export class AIController {
  private taskRepository = new TaskRepository();

  predictCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      const category = await aiService.categorizeTask(title, description);
      res.status(200).json({
        success: true,
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  };

  predictPriority = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      const priority = await aiService.predictPriority(title, description);
      res.status(200).json({
        success: true,
        data: { priority },
      });
    } catch (error) {
      next(error);
    }
  };

  recommendDeadline = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      const deadline = await aiService.recommendDeadline(title, description);
      res.status(200).json({
        success: true,
        data: { deadline: deadline.toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  suggestNextTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      // Fetch user's pending tasks
      const result = await this.taskRepository.findPaginated(
        { assignedTo: userId, status: undefined },
        'createdAt',
        'desc',
        1,
        100
      );

      const nextTask = await aiService.suggestNextBestTask(result.tasks, userId);
      res.status(200).json({
        success: true,
        data: { nextTask },
      });
    } catch (error) {
      next(error);
    }
  };
}
