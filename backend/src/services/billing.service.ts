import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getRazorpay, RAZORPAY_CONFIG, isRazorpayConfigured } from '../config/razorpay.js';
import { userService } from './user.service.js';
import { WebhookEvent } from '../models/index.js';

export interface CheckoutSessionData {
  subscriptionId: string;
  razorpayKeyId: string;
  plan: 'pro_monthly' | 'pro_yearly';
  planName: string;
}

export interface VerificationData {
  success: boolean;
  userId?: string;
  plan?: string;
  subscriptionId?: string;
}

export class BillingService {
  private razorpay: Razorpay | null = null;

  private getRazorpayInstance(): Razorpay {
    if (!this.razorpay) {
      this.razorpay = getRazorpay();
    }
    return this.razorpay;
  }

  async createCheckoutSession(
    userId: string, 
    userEmail: string, 
    plan: 'pro_monthly' | 'pro_yearly'
  ): Promise<CheckoutSessionData> {
    const user = await userService.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    let customerId = user.razorpayCustomerId;

    if (!customerId) {
      const customer = await this.getRazorpayInstance().customers.create({
        email: userEmail,
        name: user.displayName || userEmail,
        fail_existing: 0,
        notes: {
          userId,
        },
      });
      customerId = customer.id;

      await userService.updateRazorpayCustomerId(userId, customerId);
    }

    const planId = plan === 'pro_monthly' 
      ? RAZORPAY_CONFIG.PRO_MONTHLY_PLAN_ID 
      : RAZORPAY_CONFIG.PRO_YEARLY_PLAN_ID;

    // Create subscription
    const subscription = await this.getRazorpayInstance().subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // For yearly, this would be 1, for monthly 12
      notes: {
        userId,
        plan,
      },
    });

    return {
      subscriptionId: subscription.id,
      razorpayKeyId: (this.getRazorpayInstance() as any).key_id,
      plan,
      planName: userService.getPlanName(plan),
    };
  }

  async verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string,
    subscriptionId: string
  ): Promise<VerificationData> {
    try {
      // Verify the payment signature
      const generatedSignature = crypto
        .createHmac('sha256', (getRazorpay() as any).key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        return { success: false };
      }

      // Get payment details to find the user
      await this.getRazorpayInstance().payments.fetch(paymentId);
      const subscription = await this.getRazorpayInstance().subscriptions.fetch(subscriptionId);

      const userId = subscription.notes?.userId as string;
      const plan = subscription.notes?.plan as 'pro_monthly' | 'pro_yearly';

      if (!userId || !plan) {
        return { success: false };
      }

      // Update user subscription
      const user = await userService.updateSubscription(userId, {
        subscriptionId,
        plan,
        status: 'active',
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : undefined,
      });

      if (user) {
        console.log(`User ${userId} upgraded to ${plan} with subscription ${subscriptionId}`);
        return { 
          success: true, 
          userId, 
          plan, 
          subscriptionId 
        };
      } else {
        console.error(`Failed to update user ${userId} to ${plan} plan`);
        return { success: false };
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      return { success: false };
    }
  }

  async handleWebhookEvent(body: string, signature: string): Promise<void> {
    if (!RAZORPAY_CONFIG.WEBHOOK_SECRET) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_CONFIG.WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(body);

    // Check if event already processed
    const alreadyProcessed = await WebhookEvent.findOne({ eventId: event.event });

    if (alreadyProcessed) {
      console.log(`Event ${event.event} already processed, skipping`);
      return;
    }

    switch (event.event) {
      case 'subscription.authenticated':
      case 'subscription.activated':
        await this.handleSubscriptionActivated(event);
        break;
      case 'subscription.completed':
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(event);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    await WebhookEvent.create({
      eventId: event.event,
      type: event.event,
      processedAt: new Date(),
    });
  }

  private async handleSubscriptionActivated(event: any): Promise<void> {
    const subscription = event.payload.subscription.entity;
    const userId = subscription.notes?.userId as string;
    const plan = subscription.notes?.plan as 'pro_monthly' | 'pro_yearly';

    if (!userId || !plan) {
      console.error('Missing userId or plan in subscription activation');
      return;
    }

    const user = await userService.updateSubscription(userId, {
      subscriptionId: subscription.id,
      plan,
      status: subscription.status,
      currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : undefined,
    });

    if (user) {
      console.log(`User ${userId} activated ${plan} subscription ${subscription.id}`);
    } else {
      console.error(`Failed to update user ${userId} subscription`);
    }
  }

  private async handleSubscriptionCancelled(event: any): Promise<void> {
    const subscription = event.payload.subscription.entity;
    const user = await userService.findByRazorpaySubscriptionId(subscription.id);

    if (!user) {
      console.error('User not found for subscription', subscription.id);
      return;
    }

    const updatedUser = await userService.updateSubscription(user._id, {
      subscriptionId: subscription.id,
      plan: 'free',
      status: subscription.status,
    });

    if (updatedUser) {
      console.log(`User ${user._id} downgraded to free plan`);
    } else {
      console.error(`Failed to downgrade user ${user._id} to free plan`);
    }
  }

  private async handlePaymentFailed(event: {
    payload: { payment: { entity: { id: string } } };
  }): Promise<void> {
    const payment = event.payload.payment.entity;
    console.log(`Payment failed for payment ${payment.id}`);
  }

  isConfigured(): boolean {
    return isRazorpayConfigured();
  }
}

export const billingService = new BillingService();