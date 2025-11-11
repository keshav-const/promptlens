import request from 'supertest';
import { createApp } from '../app.js';
import { User, WebhookEvent } from '../models/index.js';
import { createMockToken } from './utils/testHelpers.js';

jest.mock('../config/razorpay.ts', () => {
  const mockRazorpay = {
    customers: {
      create: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      fetch: jest.fn(),
    },
    payments: {
      fetch: jest.fn(),
    },
    key_id: 'rzp_test_key_id',
    key_secret: 'rzp_test_key_secret',
  };

  return {
    getRazorpay: () => mockRazorpay,
    isRazorpayConfigured: () => true,
    RAZORPAY_CONFIG: {
      PRO_MONTHLY_PLAN_ID: 'plan_pro_monthly_test',
      PRO_YEARLY_PLAN_ID: 'plan_pro_yearly_test',
      WEBHOOK_SECRET: 'whsec_test',
      SUCCESS_URL: 'http://localhost:3001/dashboard?checkout=success',
      CANCEL_URL: 'http://localhost:3001/dashboard?checkout=canceled',
    },
  };
});

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn((algorithm) => {
      if (algorithm === 'hex') {
        return 'valid_signature';
      }
      return 'invalid_signature';
    }),
  })),
}));

describe('Billing API', () => {
  const app = createApp();
  let token: string;
  const testEmail = 'billing@example.com';

  beforeAll(async () => {
    token = await createMockToken(testEmail);
  });

  describe('POST /api/billing/checkout', () => {
    beforeEach(() => {
      const mockRazorpay = jest.requireMock('../config/razorpay.ts').getRazorpay();
      mockRazorpay.customers.create.mockClear();
      mockRazorpay.subscriptions.create.mockClear();
    });

    it('should create a checkout session for new customer with monthly plan', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
      });

      const mockCustomer = { id: 'cust_test123' };
      const mockSubscription = {
        id: 'sub_test123',
        current_end: Math.floor(Date.now() / 1000) + 86400,
      };

      const mockRazorpay = jest.requireMock('../config/razorpay.ts').getRazorpay();
      mockRazorpay.customers.create.mockResolvedValue(mockCustomer);
      mockRazorpay.subscriptions.create.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'pro_monthly' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        subscriptionId: 'sub_test123',
        razorpayKeyId: 'rzp_test_key_id',
        plan: 'pro_monthly',
        planName: 'Pro (Monthly)',
      });

      expect(mockRazorpay.customers.create).toHaveBeenCalledWith({
        email: testEmail,
        name: testEmail,
        fail_existing: '0',
        notes: {
          userId: user._id.toString(),
        },
      });

      expect(mockRazorpay.subscriptions.create).toHaveBeenCalledWith({
        plan_id: 'plan_pro_monthly_test',
        customer_notify: 1,
        quantity: 1,
        total_count: 12,
        notes: {
          userId: user._id.toString(),
          plan: 'pro_monthly',
        },
        customer_id: 'cust_test123',
      });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.razorpayCustomerId).toBe('cust_test123');
    });

    it('should create a checkout session for yearly plan', async () => {
      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
        razorpayCustomerId: 'cust_existing',
      });

      const mockSubscription = {
        id: 'sub_yearly_test',
        current_end: Math.floor(Date.now() / 1000) + 86400,
      };

      const mockRazorpay = jest.requireMock('../config/razorpay.ts').getRazorpay();
      mockRazorpay.subscriptions.create.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'pro_yearly' });

      expect(response.status).toBe(200);
      expect(response.body.data.plan).toBe('pro_yearly');
      expect(response.body.data.planName).toBe('Pro (Yearly)');

      expect(mockRazorpay.customers.create).not.toHaveBeenCalled();
      expect(mockRazorpay.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: 'plan_pro_yearly_test',
        })
      );
    });

    it('should reuse existing razorpay customer', async () => {
      await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 0,
        lastResetAt: new Date(),
        razorpayCustomerId: 'cust_existing',
      });

      const mockSubscription = {
        id: 'sub_test456',
        current_end: Math.floor(Date.now() / 1000) + 86400,
      };

      const mockRazorpay = jest.requireMock('../config/razorpay.ts').getRazorpay();
      mockRazorpay.subscriptions.create.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'pro_monthly' });

      expect(response.status).toBe(200);
      expect(mockRazorpay.customers.create).not.toHaveBeenCalled();
      expect(mockRazorpay.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'cust_existing',
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/billing/checkout');

      expect(response.status).toBe(401);
    });

    it('should validate plan parameter', async () => {
      const response = await request(app)
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'invalid_plan' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PLAN');
    });
  });

  describe('POST /api/billing/verify', () => {
    beforeEach(() => {
      const mockRazorpay = jest.requireMock('../config/razorpay.ts').getRazorpay();
      mockRazorpay.payments.fetch.mockClear();
      mockRazorpay.subscriptions.fetch.mockClear();
    });

    it('should verify payment successfully', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: new Date(),
        razorpayCustomerId: 'cust_test123',
        razorpaySubscriptionId: 'sub_test123',
      });

      const mockPayment = { id: 'pay_test123' };
      const mockSubscription = {
        id: 'sub_test123',
        notes: {
          userId: user._id.toString(),
          plan: 'pro_monthly',
        },
        current_end: Math.floor(Date.now() / 1000) + 86400,
      };

      const mockRazorpay = jest.requireMock('../config/razorpay.ts').getRazorpay();
      mockRazorpay.payments.fetch.mockResolvedValue(mockPayment);
      mockRazorpay.subscriptions.fetch.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/billing/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: 'pay_test123',
          orderId: 'order_test123',
          signature: 'valid_signature',
          subscriptionId: 'sub_test123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Payment verified successfully');
      expect(response.body.data.plan).toBe('pro_monthly');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.plan).toBe('pro_monthly');
      expect(updatedUser?.usageCount).toBe(0);
      expect(updatedUser?.subscriptionStatus).toBe('active');
    });

    it('should reject invalid signature', async () => {
      const { createHmac } = jest.requireMock('crypto');
      createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('invalid_signature'),
      });

      const response = await request(app)
        .post('/api/billing/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: 'pay_test123',
          orderId: 'order_test123',
          signature: 'invalid_signature',
          subscriptionId: 'sub_test123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VERIFICATION_FAILED');
    });

    it('should require all verification parameters', async () => {
      const response = await request(app)
        .post('/api/billing/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: 'pay_test123',
          // Missing orderId, signature, subscriptionId
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_DATA');
    });
  });

  describe('POST /api/billing/webhook', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle subscription.activated event', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: new Date(),
        razorpayCustomerId: 'cust_test123',
      });

      const webhookEvent = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_test123',
              status: 'active',
              current_end: Math.floor(Date.now() / 1000) + 86400,
              notes: {
                userId: user._id.toString(),
                plan: 'pro_monthly',
              },
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', 'valid_signature')
        .send(webhookEvent);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.plan).toBe('pro_monthly');
      expect(updatedUser?.razorpaySubscriptionId).toBe('sub_test123');
      expect(updatedUser?.subscriptionStatus).toBe('active');

      const event = await WebhookEvent.findOne({ eventId: 'subscription.activated' });
      expect(event).toBeTruthy();
      expect(event?.type).toBe('subscription.activated');
    });

    it('should handle subscription.cancelled event', async () => {
      const user = await User.create({
        email: testEmail,
        plan: 'pro_monthly',
        usageCount: 5,
        lastResetAt: new Date(),
        razorpayCustomerId: 'cust_test123',
        razorpaySubscriptionId: 'sub_test123',
      });

      const webhookEvent = {
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: {
              id: 'sub_test123',
              status: 'cancelled',
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', 'valid_signature')
        .send(webhookEvent);

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.plan).toBe('free');
      expect(updatedUser?.subscriptionStatus).toBe('cancelled');
    });

    it('should handle payment.failed event', async () => {
      const webhookEvent = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', 'valid_signature')
        .send(webhookEvent);

      expect(response.status).toBe(200);

      const event = await WebhookEvent.findOne({ eventId: 'payment.failed' });
      expect(event).toBeTruthy();
      expect(event?.type).toBe('payment.failed');
    });

    it('should not process duplicate events', async () => {
      await WebhookEvent.create({
        eventId: 'subscription.activated',
        type: 'subscription.activated',
        processedAt: new Date(),
      });

      const user = await User.create({
        email: testEmail,
        plan: 'free',
        usageCount: 3,
        lastResetAt: new Date(),
        razorpayCustomerId: 'cust_test123',
      });

      const webhookEvent = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_test123',
              notes: {
                userId: user._id.toString(),
                plan: 'pro_monthly',
              },
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', 'valid_signature')
        .send(webhookEvent);

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.plan).toBe('free'); // Should remain unchanged
    });

    it('should require razorpay signature', async () => {
      const response = await request(app).post('/api/billing/webhook').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_SIGNATURE');
    });

    it('should reject invalid signature', async () => {
      const { createHmac } = jest.requireMock('crypto');
      createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('invalid_signature'),
      });

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', 'invalid_signature')
        .send({ event: 'test' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/billing/status', () => {
    it('should return billing status for authenticated user', async () => {
      await User.create({
        email: testEmail,
        plan: 'pro_monthly',
        usageCount: 5,
        lastResetAt: new Date(),
        razorpayCustomerId: 'cust_test123',
        razorpaySubscriptionId: 'sub_test123',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date(),
      });

      const response = await request(app)
        .get('/api/billing/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        plan: 'pro_monthly',
        planName: 'Pro (Monthly)',
        subscriptionId: 'sub_test123',
        subscriptionStatus: 'active',
        isConfigured: true,
      });
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/billing/status');

      expect(response.status).toBe(401);
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
        planName: 'Free',
        dailyCount: 3,
        dailyLimit: 4,
        remaining: 1,
        isUnlimited: false,
      });

      await User.findByIdAndUpdate(user._id, {
        plan: 'pro_yearly',
        usageCount: 0,
      });

      response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data).toMatchObject({
        plan: 'pro_yearly',
        planName: 'Pro (Yearly)',
        dailyCount: 0,
        dailyLimit: null,
        remaining: null,
        isUnlimited: true,
      });
    });

    it('should handle pro_monthly plan limits', async () => {
      await User.create({
        email: testEmail,
        plan: 'pro_monthly',
        usageCount: 25,
        lastResetAt: new Date(),
      });

      const response = await request(app).get('/api/usage').set('Authorization', `Bearer ${token}`);

      expect(response.body.data).toMatchObject({
        plan: 'pro_monthly',
        planName: 'Pro (Monthly)',
        dailyCount: 25,
        dailyLimit: 50,
        remaining: 25,
        isUnlimited: false,
      });
    });
  });
});