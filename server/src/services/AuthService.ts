import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { IUser } from '../shared/types';
import { logger } from '../middleware/logger';

export class AuthService {
  private userRepository = new UserRepository();

  async register(userData: Partial<IUser> & { password?: string }): Promise<{ user: any; token: string }> {
    logger.debug(`Registering user with email: ${userData.email}`);
    const existingUser = await this.userRepository.findByEmail(userData.email || '');
    if (existingUser) {
      const error: any = new Error('Email is already registered.');
      error.statusCode = 400;
      throw error;
    }

    const user = await this.userRepository.create(userData);
    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    logger.debug(`User attempting login: ${email}`);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const userObj = user.toObject();
    delete userObj.password;

    const token = this.generateToken(userObj);
    return { user: userObj, token };
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  private generateToken(user: any): string {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });
  }
}
