import { Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  timestamp: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
  };
}

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: (err?: unknown) => void
) => Promise<void> | void;
