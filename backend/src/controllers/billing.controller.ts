import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { billingService } from '../services/billing.service.js';

export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId || !req.user?.email) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const session = await billingService.createCheckoutSession(req.userId, req.user.email);

    sendSuccess(res, {
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      throw new AppError('No Stripe signature found', 400, 'MISSING_SIGNATURE');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!rawBody) {
      throw new AppError('No raw body found', 400, 'MISSING_RAW_BODY');
    }

    const event = billingService.constructWebhookEvent(rawBody, signature);

    await billingService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    next(error);
  }
};
