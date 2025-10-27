import request from 'supertest';
import Stripe from 'stripe';
import { createApp } from '../app.js';
import { User, WebhookEvent } from '../models/index.js';
import { createMockToken } from './utils/testHelpers.js';

jest.mock('../config/stripe.ts', () => {
  const mockStripe = {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  return {
    getStripe: () => mockStripe,
    STRIPE_CONFIG: {
      PRICE_ID: 'price_test',
      WEBHOOK_SECRET: 'whsec_test',
      SUCCESS_URL: 'http://localhost:3001/dashboard?checkout=success',
      CANCEL_URL: 'http://localhost:3001/dashboard?checkout=canceled',
    },
  };
});

describe('Billing API', () => {
  const app = createApp();
  let token: string;
  const testEmail = 'billing@example.com';

  beforeAll(async () => {
    token = await createMockToken(testEmail);
  });

  describe('POST /api/billing/checkout', () => {
    beforeEach(() => {
      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.customers.create.mockClear();
      mockStripe.checkout.sessions.create.mockClear();
    });

    it('should create a checkout session for new customer', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
      });

      const mockCustomer = { id: 'cus_test123' };
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      };

      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        sessionId: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      });

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: testEmail,
        metadata: {
          userId: user._id.toString(),
        },
      });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.stripeCustomerId).toBe('cus_test123');
    });

    it('should reuse existing stripe customer', async () => {
      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
        stripeCustomerId: 'cus_existing',
      });

      const mockSession = {
        id: 'cs_test456',
        url: 'https://checkout.stripe.com/test2',
      };

      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing',
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/billing/checkout');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/upgrade - Webhook', () => {
    beforeEach(() => {
      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.webhooks.constructEvent.mockClear();
    });

    it('should handle checkout.session.completed event', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: new Date(),
        stripeCustomerId: 'cus_test123',
      });

      const mockEvent = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              userId: user._id.toString(),
            },
          },
        },
      } as unknown as Stripe.Event;

      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/upgrade')
        .set('stripe-signature', 'test_signature')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.plan).toBe('pro');
      expect(updatedUser?.stripeSubscriptionId).toBe('sub_test123');
      expect(updatedUser?.usageCount).toBe(0);

      const event = await WebhookEvent.findOne({ eventId: 'evt_test123' });
      expect(event).toBeTruthy();
      expect(event?.type).toBe('checkout.session.completed');
    });

    it('should handle customer.subscription.deleted event', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'pro',
        usageCount: 5,
        lastResetAt: new Date(),
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
      });

      const mockEvent = {
        id: 'evt_test456',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
          },
        },
      } as unknown as Stripe.Event;

      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/upgrade')
        .set('stripe-signature', 'test_signature')
        .send({});

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.plan).toBe('free');
    });

    it('should handle invoice.payment_failed event', async () => {
      const mockEvent = {
        id: 'evt_test789',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test',
            subscription: 'sub_test123',
          },
        },
      } as unknown as Stripe.Event;

      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/upgrade')
        .set('stripe-signature', 'test_signature')
        .send({});

      expect(response.status).toBe(200);

      const event = await WebhookEvent.findOne({ eventId: 'evt_test789' });
      expect(event).toBeTruthy();
    });

    it('should not process duplicate events', async () => {
      await WebhookEvent.create({
        eventId: 'evt_duplicate',
        type: 'checkout.session.completed',
        processedAt: new Date(),
      });

      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: new Date(),
        stripeCustomerId: 'cus_test123',
      });

      const mockEvent = {
        id: 'evt_duplicate',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              userId: user._id.toString(),
            },
          },
        },
      } as unknown as Stripe.Event;

      const mockStripe = jest.requireMock('../config/stripe.ts').getStripe();
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/upgrade')
        .set('stripe-signature', 'test_signature')
        .send({});

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.plan).toBe('free');
    });

    it('should require stripe signature', async () => {
      const response = await request(app).post('/api/upgrade').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Usage after plan upgrade', () => {
    it('should reflect plan change immediately in usage endpoint', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: new Date(),
      });

      let response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data).toMatchObject({
        plan: 'free',
        usageCount: 3,
        limit: 4,
        remaining: 1,
      });

      await User.findByIdAndUpdate(user._id, {
        plan: 'pro',
        usageCount: 0,
      });

      response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data).toMatchObject({
        plan: 'pro',
        usageCount: 0,
        limit: 20,
        remaining: 20,
      });
    });
  });
});
