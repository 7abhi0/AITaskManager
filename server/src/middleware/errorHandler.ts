import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
  keyValue?: Record<string, unknown>;
  path?: string;
  value?: unknown;
}

interface ErrorDetail {
  field: string;
  message: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = err.statusCode ?? 500;
  let message = err.message || 'Internal Server Error';
  let details: ErrorDetail[] | Record<string, unknown> | null = null;

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
    const fields = Object.keys(err.keyValue ?? {});
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
      path: err.path,
      value: err.value,
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
