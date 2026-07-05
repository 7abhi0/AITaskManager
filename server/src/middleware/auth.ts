import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../shared/types';

// Payload shape stored in the JWT
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * AuthenticatedRequest extends Express.Request with:
 * - user: the decoded JWT payload
 * - file: an optional uploaded file from Multer
 *
 * body, params, query and headers are already on Express.Request.
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  // Express.Multer.File is declared globally by @types/multer; re-exposing it
  // here keeps the signature consistent across controllers.
  file?: Express.Multer.File;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required. Please login.' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? 'fallback_secret'
    ) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired authentication token.' },
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Insufficient permissions.' },
      });
      return;
    }

    next();
  };
};
