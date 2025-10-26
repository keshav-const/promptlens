import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    code = 'DUPLICATE_KEY';
  } else {
    message = config.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  }

  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details: details || (config.NODE_ENV === 'development' ? err.stack : undefined),
    },
    timestamp: new Date().toISOString(),
  };

  if (config.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
};
