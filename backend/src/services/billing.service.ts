import Stripe from 'stripe';
import { getStripe, STRIPE_CONFIG } from '../config/stripe.js';
import { userService } from './user.service.js';
import { WebhookEvent } from '../models/index.js';

export class BillingService {
  private stripe: Stripe;

  constructor() {
    this.stripe = getStripe();
  }

  async createCheckoutSession(userId: string, userEmail: string): Promise<Stripe.Checkout.Session> {
    const user = await userService.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      await userService.updateStripeCustomerId(userId, customerId);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: STRIPE_CONFIG.CANCEL_URL,
      metadata: {
        userId,
      },
    });

    return session;
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const alreadyProcessed = await WebhookEvent.findOne({ eventId: event.id });

    if (alreadyProcessed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await WebhookEvent.create({
      eventId: event.id,
      type: event.type,
      processedAt: new Date(),
    });
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      console.error('No subscription ID in checkout session');
      return;
    }

    const user = await userService.updateSubscription(userId, subscriptionId, 'pro');

    if (user) {
      console.log(`User ${userId} upgraded to pro plan with subscription ${subscriptionId}`);
    } else {
      console.error(`Failed to update user ${userId} to pro plan`);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const user = await userService.findByStripeCustomerId(subscription.customer as string);

    if (!user) {
      console.error('User not found for customer', subscription.customer);
      return;
    }

    const updatedUser = await userService.updateSubscription(user._id, subscription.id, 'free');

    if (updatedUser) {
      console.log(`User ${user._id} downgraded to free plan`);
    } else {
      console.error(`Failed to downgrade user ${user._id} to free plan`);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const invoiceData = invoice as { subscription?: string | { id: string } };
    const subscriptionId =
      typeof invoiceData.subscription === 'string'
        ? invoiceData.subscription
        : invoiceData.subscription?.id;

    if (!subscriptionId) {
      console.error('No subscription ID in invoice');
      return;
    }

    console.log(`Payment failed for subscription ${subscriptionId}`);
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, STRIPE_CONFIG.WEBHOOK_SECRET);
  }
}

export const billingService = new BillingService();
