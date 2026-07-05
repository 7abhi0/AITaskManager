import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { IUser } from '../shared/types';
import { logger } from '../middleware/logger';
import { JwtPayload } from '../middleware/auth';

export class AuthService {
  private userRepository = new UserRepository();

  async register(userData: Partial<IUser> & { password?: string }): Promise<{ user: Record<string, unknown>; token: string }> {
    logger.debug(`Registering user with email: ${userData.email}`);
    const existingUser = await this.userRepository.findByEmail(userData.email ?? '');
    if (existingUser) {
      const error: Error & { statusCode?: number } = new Error('Email is already registered.');
      error.statusCode = 400;
      throw error;
    }

    const user = await this.userRepository.create(userData) as unknown as Record<string, unknown>;
    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: Record<string, unknown>; token: string }> {
    logger.debug(`User attempting login: ${email}`);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      const error: Error & { statusCode?: number } = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error: Error & { statusCode?: number } = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj['password'];

    const token = this.generateToken(userObj);
    return { user: userObj, token };
  }

  async getUserProfile(userId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const error: Error & { statusCode?: number } = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    return user as unknown as Record<string, unknown>;
  }

  private generateToken(user: Record<string, unknown>): string {
    const payload: JwtPayload = {
      id: String(user['_id']),
      email: String(user['email']),
      role: user['role'] as JwtPayload['role'],
      name: String(user['name']),
    };

    const secret = process.env.JWT_SECRET ?? 'fallback_secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
    const options: SignOptions = { expiresIn };

    return jwt.sign(payload, secret, options);
  }
}
