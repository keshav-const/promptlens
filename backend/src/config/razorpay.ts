import Razorpay from 'razorpay';
import { config } from './env.js';

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!razorpayInstance) {
    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials are not configured. Razorpay features are disabled.');
    }

    razorpayInstance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayInstance;
};

export const isRazorpayConfigured = (): boolean => {
  return !!(config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET);
};

export const RAZORPAY_CONFIG = {
  PRO_MONTHLY_PLAN_ID: config.RAZORPAY_PRO_MONTHLY_PLAN_ID || 'plan_pro_monthly_test',
  PRO_YEARLY_PLAN_ID: config.RAZORPAY_PRO_YEARLY_PLAN_ID || 'plan_pro_yearly_test',
  WEBHOOK_SECRET: config.RAZORPAY_WEBHOOK_SECRET,
  SUCCESS_URL: `${config.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard?checkout=success`,
  CANCEL_URL: `${config.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard?checkout=canceled`,
};