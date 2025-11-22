import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { billingService } from '../services/billing.service.js';
import { userService } from '../services/user.service.js';

export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId || !req.user?.email) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { plan = 'pro_monthly' } = req.body;

    if (!['pro_monthly', 'pro_yearly'].includes(plan)) {
      throw new AppError('Invalid plan specified', 400, 'INVALID_PLAN');
    }

    const sessionData = await billingService.createCheckoutSession(
      req.userId,
      req.user.email,
      plan
    );

    sendSuccess(res, sessionData);
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId, orderId, signature, subscriptionId } = req.body;

    // For subscriptions, orderId is optional (subscriptions don't have order IDs)
    if (!paymentId || !signature || !subscriptionId) {
      throw new AppError('Missing required payment verification data', 400, 'MISSING_DATA');
    }

    const result = await billingService.verifyPayment(
      paymentId,
      orderId,
      signature,
      subscriptionId
    );

    if (result.success) {
      sendSuccess(res, {
        success: true,
        message: 'Payment verified successfully',
        plan: result.plan
      });
    } else {
      throw new AppError('Payment verification failed', 400, 'VERIFICATION_FAILED');
    }
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
    const signature = req.headers['x-razorpay-signature'];

    if (!signature || typeof signature !== 'string') {
      throw new AppError('No Razorpay signature found', 400, 'MISSING_SIGNATURE');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!rawBody) {
      throw new AppError('No raw body found', 400, 'MISSING_RAW_BODY');
    }

    await billingService.handleWebhookEvent(rawBody.toString(), signature);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    next(error);
  }
};

export const getBillingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const user = await userService.findById(req.userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    sendSuccess(res, {
      plan: user.plan,
      planName: userService.getPlanName(user.plan),
      subscriptionId: user.razorpaySubscriptionId,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      isConfigured: billingService.isConfigured(),
    });
  } catch (error) {
    next(error);
  }
};