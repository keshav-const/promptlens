# Razorpay Integration Implementation

This document describes the Razorpay integration for Pro subscription upgrades.

## Overview

The backend implements a complete Razorpay subscription flow with webhook-based plan updates, including:
- Subscription creation for Pro upgrades (Monthly: ₹999/month, Yearly: ₹9,999/year)
- Webhook handling for subscription lifecycle events
- Idempotency safeguards to prevent duplicate processing
- Real-time plan updates reflected in usage limits
- Payment verification workflow

## Architecture

### Components

#### 1. Configuration (`/src/config/razorpay.ts`)
- Lazy-initializes Razorpay client with API credentials
- Provides RAZORPAY_CONFIG with plan IDs, webhook secret, and redirect URLs
- Uses environment variables: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET

#### 2. Models
- **User** (`/src/models/User.ts`): Extended with `razorpayCustomerId` and `razorpaySubscriptionId`
- **WebhookEvent** (`/src/models/WebhookEvent.ts`): Tracks processed event IDs with 30-day TTL

#### 3. Services
- **BillingService** (`/src/services/billing.service.ts`):
  - `createCheckoutSession()`: Creates Razorpay subscription, manages customer creation
  - `verifyPayment()`: Verifies payment signature and updates user subscription
  - `handleWebhookEvent()`: Processes webhook events with idempotency checking
- **UserService** (`/src/services/user.service.ts`): Extended with:
  - `updateRazorpayCustomerId()`: Stores Razorpay customer ID
  - `updateSubscription()`: Updates plan and subscription ID, resets usage on upgrade
  - `findByRazorpayCustomerId()`: Finds user by Razorpay customer ID
  - `findByRazorpaySubscriptionId()`: Finds user by subscription ID

#### 4. Controllers (`/src/controllers/billing.controller.ts`)
- `createCheckoutSession`: POST /api/billing/checkout - Creates subscription (authenticated)
- `verifyPayment`: POST /api/billing/verify - Verifies payment completion (authenticated)
- `handleWebhook`: POST /api/billing/webhook - Processes Razorpay webhooks with signature validation
- `getBillingStatus`: GET /api/billing/status - Gets current billing status (authenticated)

#### 5. Routes
- `/api/billing/checkout`: Create subscription (requires authentication)
- `/api/billing/verify`: Verify payment (requires authentication)
- `/api/billing/status`: Get billing status (requires authentication)
- `/api/billing/webhook`: Webhook endpoint (no authentication, signature validation)

#### 6. Middleware Updates
- **app.ts**: Modified JSON parser to preserve raw body for webhook signature verification
- **quota.ts**: Already refreshes user from DB before checking limits (real-time plan updates)

## API Endpoints

### POST /api/billing/checkout
Creates a Razorpay Subscription for Pro plan upgrade.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "plan": "pro_monthly" | "pro_yearly"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_00000000000001",
    "razorpayKeyId": "rzp_test_...",
    "plan": "pro_monthly",
    "planName": "Pro (Monthly)"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Behavior**:
- Creates new Razorpay customer if user doesn't have one
- Reuses existing customer for returning users
- Stores customer ID on user record
- Returns subscription details for frontend payment processing

### POST /api/billing/verify
Verifies Razorpay payment completion and activates subscription.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "paymentId": "pay_00000000000001",
  "orderId": "order_00000000000001",
  "signature": "generated_signature",
  "subscriptionId": "sub_00000000000001"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Payment verified successfully",
    "plan": "pro_monthly"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/billing/status
Get current user's billing status and subscription details.

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "success": true,
  "data": {
    "plan": "pro_monthly",
    "planName": "Pro (Monthly)",
    "subscriptionId": "sub_00000000000001",
    "subscriptionStatus": "active",
    "subscriptionCurrentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "isConfigured": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/billing/webhook
Webhook endpoint for Razorpay events.

**Authentication**: Signature validation via `x-razorpay-signature` header

**Events Handled**:
1. `subscription.activated`:
   - Upgrades user to "pro_monthly" or "pro_yearly" plan
   - Stores subscription ID and current period end
   - Resets usage count to 0

2. `subscription.cancelled`:
   - Downgrades user to "free" plan
   - Keeps subscription ID for reference

3. `payment.failed`:
   - Logs failure for monitoring
   - Future: Send notification emails

**Idempotency**:
- Checks WebhookEvent collection before processing
- Stores event ID after successful processing
- Events expire after 30 days (TTL index)

## Plan Configuration

### Available Plans

| Plan | Daily Requests | Price | Period | Plan ID |
|------|----------------|-------|--------|---------|
| Free | 4 requests/day | Free | N/A | free |
| Pro Monthly | 50 requests/day | ₹999 | Monthly | pro_monthly |
| Pro Yearly | Unlimited requests | ₹9,999 | Yearly | pro_yearly |

### Quota Behavior

- **Free Plan**: 4 requests per day, resets every 24 hours
- **Pro Monthly**: 50 requests per day, resets every 24 hours
- **Pro Yearly**: Unlimited requests, no daily limits
- **Usage Reset**: Occurs 24 hours after last request, not at midnight
- **Limit Reached**: Returns detailed error with current usage, limit, and reset time
- **Plan Changes**: Upgrading immediately resets usage to 0, downgrading preserves current usage

## Razorpay Dashboard Setup

### Required Configuration

1. **Subscription Plans**:
   - Create two subscription plans in Razorpay Dashboard > Subscriptions > Plans
   - Pro Monthly: ₹999/month, copy Plan ID to `RAZORPAY_PRO_MONTHLY_PLAN_ID`
   - Pro Yearly: ₹9,999/year, copy Plan ID to `RAZORPAY_PRO_YEARLY_PLAN_ID`

2. **Webhook Endpoint** (Production):
   - URL: `https://your-domain.com/api/billing/webhook`
   - Events to select:
     - `subscription.activated`
     - `subscription.cancelled`
     - `payment.failed`
   - Copy webhook signing secret to `RAZORPAY_WEBHOOK_SECRET`

3. **API Keys**:
   - Get Key ID and Key Secret from Settings > API keys
   - Add to `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### Local Development

Use Razorpay CLI to forward webhooks:

```bash
# Install Razorpay CLI
npm install -g razorpay-cli

# Login to Razorpay
razorpay login

# Forward webhooks to local server
razorpay listen --forward-to http://localhost:5000/api/billing/webhook
```

Copy the webhook signing secret from CLI output to `.env`.

## Testing

### Test Suite (`/src/__tests__/billing.test.ts`)

Comprehensive tests covering:
- Subscription creation (new customer, existing customer)
- Payment verification workflow
- Webhook event processing (all event types)
- Idempotency (duplicate event handling)
- Authentication and signature validation
- Real-time plan updates in usage endpoint

### Manual Testing

1. **Create Subscription**:
```bash
curl -X POST http://localhost:5000/api/billing/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro_monthly"}'
```

2. **Complete Payment**:
   - Use subscription details in frontend Razorpay checkout
   - Use test card: 4111 1111 1111 1111
   - Any future expiry, any CVV

3. **Verify Payment**:
```bash
curl -X POST http://localhost:5000/api/billing/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_...",
    "orderId": "order_...",
    "signature": "...",
    "subscriptionId": "sub_..."
  }'
```

4. **Verify Webhook**:
   - Check console logs for "User X upgraded to pro plan"
   - Verify in database: user.plan = 'pro_monthly', user.usageCount = 0

5. **Test Usage Limits**:
```bash
curl http://localhost:5000/api/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
Should show: limit: 50, plan: "pro_monthly"

### Test Cards

Use Razorpay's test mode with any valid card number:
- **Success**: 4111 1111 1111 1111
- Any future expiry date and any 3-digit CVV work in test mode

## Error Handling

### Common Issues

1. **"RAZORPAY_KEY_ID is not configured"**:
   - Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env

2. **"No Razorpay signature found"**:
   - Webhook missing x-razorpay-signature header
   - Check webhook endpoint configuration

3. **"No raw body found"**:
   - JSON parser not preserving raw body
   - Verify app.ts JSON parser configuration

4. **Signature validation failed**:
   - Wrong RAZORPAY_WEBHOOK_SECRET
   - For local dev, use CLI secret
   - For production, use dashboard webhook secret

## Security Considerations

1. **Webhook Signature Verification**:
   - All webhook requests validate signature
   - Prevents replay attacks and unauthorized requests

2. **Idempotency**:
   - Duplicate events are rejected
   - Prevents double-charging or plan flip-flopping

3. **Authentication**:
   - Checkout and verify endpoints require valid JWT
   - Webhook endpoint uses Razorpay signature (no JWT needed)

4. **Raw Body Preservation**:
   - Only for /api/billing/webhook endpoint
   - Other endpoints use parsed JSON

## Upgrade Flow

### End-to-End User Experience

1. **User Clicks Upgrade**:
   - Frontend calls POST /api/billing/checkout with plan choice
   - Backend creates Razorpay subscription and returns details

2. **Payment Processing**:
   - Frontend initializes Razorpay checkout with subscription details
   - User completes payment using Razorpay's secure payment page

3. **Payment Verification**:
   - Frontend receives payment success callback
   - Frontend calls POST /api/billing/verify with payment details
   - Backend verifies signature and updates user subscription

4. **Webhook Confirmation**:
   - Razorpay sends subscription.activated webhook
   - Backend processes webhook and confirms subscription status
   - User plan is updated and usage quota is reset

5. **Real-time Updates**:
   - All subsequent API calls reflect new plan limits
   - Usage endpoint shows updated quota and remaining requests

### Dashboard vs Extension Flow

**Dashboard Users**:
- See upgrade buttons in billing section
- Can choose between monthly/yearly plans
- Get immediate feedback on payment completion
- See updated plan status in dashboard

**Extension Users**:
- See upgrade prompt when hitting quota limits
- Redirected to dashboard for payment completion
- Return to extension with updated plan status
- Seamless continuation of work after upgrade

## Future Enhancements

1. **Email Notifications**:
   - Send confirmation on successful upgrade
   - Alert on payment failures
   - Notify before subscription renewal

2. **Subscription Management**:
   - Cancel subscription endpoint
   - Update payment method endpoint
   - View billing history

3. **Analytics**:
   - Track conversion rates
   - Monitor churn
   - Identify failed payments

4. **Proration**:
   - Handle mid-cycle upgrades/downgrades
   - Credit unused time

5. **Multiple Plans**:
   - Add business/enterprise tiers
   - Custom usage limits per tier

6. **Free Trial**:
   - 7-day free trial for paid plans
   - Automatic conversion to paid plan