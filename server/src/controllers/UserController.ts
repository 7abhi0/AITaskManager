import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserRepository } from '../repositories/UserRepository';
import { AuthenticatedRequest } from '../middleware/auth';

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    avatar: z.string().optional(),
    role: z.enum(['ADMIN', 'TEAM_LEAD', 'MEMBER']).optional(),
  }),
});

export class UserController {
  private userRepository = new UserRepository();

  getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const users = await this.userRepository.findAll();
      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      // Normal users can only update their own profile, Admins can update anyone
      if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied. You can only update your own profile.' },
        });
      }

      const updatedUser = await this.userRepository.update(userId, req.body);
      res.status(200).json({
        success: true,
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      if (req.user?.id === userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'You cannot delete your own admin account.' },
        });
      }

      await this.userRepository.delete(userId);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}
