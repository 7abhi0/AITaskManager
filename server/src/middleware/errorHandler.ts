import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details: any = null;

  // Log error using Pino
  logger.error({
    msg: err.message,
    stack: err.stack,
    code: err.code,
    statusCode,
    url: req.url,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate Key Error';
    const fields = Object.keys((err as any).keyValue || {});
    details = fields.map((f) => ({
      field: f,
      message: `${f} already exists.`,
    }));
  }

  // Handle Mongoose Cast Error (Invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID Format';
    details = {
      path: (err as any).path,
      value: (err as any).value,
    };
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};
