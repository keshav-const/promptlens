# Stripe Integration Implementation

This document describes the Stripe integration for Pro subscription upgrades.

## Overview

The backend implements a complete Stripe checkout flow with webhook-based plan updates, including:
- Checkout session creation for Pro upgrades ($9.99/mo)
- Webhook handling for subscription lifecycle events
- Idempotency safeguards to prevent duplicate processing
- Real-time plan updates reflected in usage limits

## Architecture

### Components

#### 1. Configuration (`/src/config/stripe.ts`)
- Lazy-initializes Stripe client with API version locking (2025-09-30.clover)
- Provides STRIPE_CONFIG with price ID, webhook secret, and redirect URLs
- Uses environment variables: STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET

#### 2. Models
- **User** (`/src/models/User.ts`): Extended with `stripeCustomerId` and `stripeSubscriptionId`
- **WebhookEvent** (`/src/models/WebhookEvent.ts`): Tracks processed event IDs with 30-day TTL

#### 3. Services
- **BillingService** (`/src/services/billing.service.ts`):
  - `createCheckoutSession()`: Creates Stripe checkout session, manages customer creation
  - `handleWebhookEvent()`: Processes webhook events with idempotency checking
  - `constructWebhookEvent()`: Validates webhook signatures
- **UserService** (`/src/services/user.service.ts`): Extended with:
  - `updateStripeCustomerId()`: Stores Stripe customer ID
  - `updateSubscription()`: Updates plan and subscription ID, resets usage on upgrade
  - `findByStripeCustomerId()`: Finds user by Stripe customer ID

#### 4. Controllers (`/src/controllers/billing.controller.ts`)
- `createCheckoutSession`: POST /api/billing/checkout - Creates checkout session (authenticated)
- `handleWebhook`: POST /api/upgrade - Processes Stripe webhooks with signature validation

#### 5. Routes
- `/api/billing/checkout`: Billing routes (requires authentication)
- `/api/upgrade`: Webhook endpoint (no authentication, signature validation)

#### 6. Middleware Updates
- **app.ts**: Modified JSON parser to preserve raw body for webhook signature verification
- **quota.ts**: Already refreshes user from DB before checking limits (real-time plan updates)

## API Endpoints

### POST /api/billing/checkout
Creates a Stripe Checkout Session for Pro subscription.

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Behavior**:
- Creates new Stripe customer if user doesn't have one
- Reuses existing customer for returning users
- Stores customer ID on user record
- Returns URL to redirect user for checkout

### POST /api/upgrade
Webhook endpoint for Stripe events.

**Authentication**: Signature validation via `stripe-signature` header

**Events Handled**:
1. `checkout.session.completed`:
   - Upgrades user to "pro" plan
   - Stores subscription ID
   - Resets usage count to 0

2. `customer.subscription.deleted`:
   - Downgrades user to "free" plan
   - Keeps subscription ID for reference

3. `invoice.payment_failed`:
   - Logs failure for monitoring
   - Future: Send notification emails

**Idempotency**:
- Checks WebhookEvent collection before processing
- Stores event ID after successful processing
- Events expire after 30 days (TTL index)

## Stripe Dashboard Setup

### Required Configuration

1. **Product & Price**:
   - Create a subscription product (e.g., "Pro Plan")
   - Add recurring price (e.g., $9.99/month)
   - Copy Price ID to `STRIPE_PRICE_ID`

2. **Webhook Endpoint** (Production):
   - URL: `https://your-domain.com/api/upgrade`
   - Events to select:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

3. **API Keys**:
   - Get Secret Key from Developers > API keys
   - Add to `STRIPE_SECRET_KEY`

### Local Development

Use Stripe CLI to forward webhooks:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/upgrade
```

Copy the webhook signing secret from CLI output to `.env`.

## Testing

### Test Suite (`/src/__tests__/billing.test.ts`)

Comprehensive tests covering:
- Checkout session creation (new customer, existing customer)
- Webhook event processing (all event types)
- Idempotency (duplicate event handling)
- Authentication and signature validation
- Real-time plan updates in usage endpoint

### Manual Testing

1. **Create Checkout Session**:
```bash
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

2. **Complete Checkout**:
   - Open returned URL in browser
   - Use test card: 4242 4242 4242 4242
   - Any future expiry, any CVC, any postal code

3. **Verify Webhook**:
   - Check console logs for "User X upgraded to pro plan"
   - Verify in database: user.plan = 'pro', user.usageCount = 0

4. **Test Usage Limits**:
```bash
curl http://localhost:3000/api/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
Should show: limit: 20, plan: "pro"

### Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

Full list: https://stripe.com/docs/testing

## Error Handling

### Common Issues

1. **"STRIPE_SECRET_KEY is not configured"**:
   - Add STRIPE_SECRET_KEY to .env

2. **"No Stripe signature found"**:
   - Webhook missing stripe-signature header
   - Check webhook endpoint configuration

3. **"No raw body found"**:
   - JSON parser not preserving raw body
   - Verify app.ts JSON parser configuration

4. **Signature validation failed**:
   - Wrong STRIPE_WEBHOOK_SECRET
   - For local dev, use CLI secret (whsec_...)
   - For production, use dashboard webhook secret

## Security Considerations

1. **Webhook Signature Verification**:
   - All webhook requests validate signature
   - Prevents replay attacks and unauthorized requests

2. **Idempotency**:
   - Duplicate events are rejected
   - Prevents double-charging or plan flip-flopping

3. **Authentication**:
   - Checkout endpoint requires valid JWT
   - Webhook endpoint uses Stripe signature (no JWT needed)

4. **Raw Body Preservation**:
   - Only for /api/upgrade endpoint
   - Other endpoints use parsed JSON

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
   - Annual billing with discount
   - Custom usage limits per tier
