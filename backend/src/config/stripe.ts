import Stripe from 'stripe';
import { config } from './env.js';

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    stripeInstance = new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
  }

  return stripeInstance;
};

export const STRIPE_CONFIG = {
  PRICE_ID: config.STRIPE_PRICE_ID || 'price_test',
  WEBHOOK_SECRET: config.STRIPE_WEBHOOK_SECRET,
  SUCCESS_URL: `${config.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard?checkout=success`,
  CANCEL_URL: `${config.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard?checkout=canceled`,
};
