import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getProtectedExample = (req: AuthRequest, res: Response) => {
  const data = {
    message: 'This is a protected route',
    user: req.user,
  };
  sendSuccess(res, data);
};

export const getPublicExample = (_req: AuthRequest, res: Response) => {
  const data = {
    message: 'This is a public route',
  };
  sendSuccess(res, data);
};

export const getErrorExample = () => {
  throw new AppError('This is an example error', 400, 'EXAMPLE_ERROR');
};
