# Stripe Configuration Guide

## Overview

This guide covers configuring Stripe for production payment processing in the PromptLens application. Users can upgrade to a Pro plan ($9.99/month) which provides increased usage limits.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Switch to Live Mode](#switch-to-live-mode)
- [Create Product and Price](#create-product-and-price)
- [Configure Customer Portal](#configure-customer-portal)
- [Set Up Webhook Endpoint](#set-up-webhook-endpoint)
- [Update Environment Variables](#update-environment-variables)
- [Test Payment Flow](#test-payment-flow)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access
- [ ] Stripe account with business verification completed
- [ ] Backend API deployed and accessible (see [backend.md](./backend.md))
- [ ] Dashboard deployed (see [dashboard.md](./dashboard.md))
- [ ] Admin access to Stripe Dashboard

### Business Information Required
Before going live, Stripe requires:
- Business name and address
- Business type (sole proprietorship, LLC, corporation, etc.)
- Tax ID (EIN or SSN)
- Bank account for payouts
- Business website URL
- Customer support contact

### Complete Stripe Verification

1. Go to https://dashboard.stripe.com/settings/account
2. Complete business profile
3. Add bank account for payouts
4. Verify identity documents (if requested)
5. Wait for approval (typically 1-2 business days)

## Switch to Live Mode

### Step 1: Activate Live Mode

1. Log in to Stripe Dashboard: https://dashboard.stripe.com
2. Top right corner: Switch from "Test mode" to "Live mode"
3. If not activated, click "Activate your account"
4. Complete activation requirements

### Step 2: Get Live API Keys

1. Go to Developers → API keys
2. Ensure "Viewing live data" toggle is ON
3. Copy your keys:

```
Publishable key: pk_live_51ABC123...
Secret key: sk_live_51ABC123... (click "Reveal live key token")
```

⚠️ **Security Warning**: Never share or commit your secret key!

### Step 3: Store API Keys Securely

```bash
# Save to password manager
# Entry: "PromptLens Stripe Live Keys"
# Publishable Key: pk_live_...
# Secret Key: sk_live_...

# You'll add these to backend/dashboard environment variables later
```

## Create Product and Price

### Step 1: Create Product

1. Go to Products → + Add product
2. Fill in product details:

```
Name: PromptLens Pro
Description: Upgrade to Pro for unlimited prompt saves and advanced features
Image: [Upload product image] (optional)
Statement descriptor: PROMPTLENS PRO
```

3. Click "Save product"

### Step 2: Add Recurring Price

1. In the product page, scroll to "Pricing"
2. Click "+ Add another price"
3. Configure pricing:

```
Price model: Standard pricing
Price: $9.99 USD
Billing period: Monthly
Payment behavior: Charge automatically
Usage type: Licensed
```

4. Click "Add price"
5. Copy the Price ID: `price_1ABC123...`

**Important**: Save this Price ID - you'll need it for environment variables.

### Step 3: Configure Price Settings (Optional)

```
Tax behavior: Exclusive (tax calculated on top of price)
Invoicing: Automatic
Trial period: 0 days (no free trial)
```

## Configure Customer Portal

The customer portal allows users to manage their subscription (update payment method, cancel, etc.)

### Step 1: Enable Customer Portal

1. Go to Settings → Billing → Customer portal
2. Click "Activate"

### Step 2: Configure Portal Settings

```
Business Information:
  Business name: PromptLens
  Support email: support@promptlens.app
  Support phone: [Optional]
  Terms of service URL: https://promptlens.app/terms
  Privacy policy URL: https://promptlens.app/privacy

Branding:
  Brand color: #3B82F6 (or your brand color)
  Logo: [Upload logo]
  Icon: [Upload icon]
```

### Step 3: Configure Products and Features

```
Products:
  ✅ Allow customers to switch plans
  ✅ Show pricing table
  ✅ Allow customers to cancel subscriptions

Features:
  ✅ Update payment methods
  ✅ View invoice history
  ✅ Update billing address
  ❌ Update subscription quantities (not needed)
```

### Step 4: Configure Cancellation Settings

```
Cancellation:
  ✅ Allow customers to cancel subscriptions
  Cancellation behavior: Cancel immediately
  
  Feedback:
    ✅ Request cancellation feedback
    
  Confirmation:
    ✅ Send cancellation confirmation email
```

### Step 5: Save Portal Configuration

Click "Save changes"

### Step 6: Get Portal URL

The portal URL is:
```
https://billing.stripe.com/p/login/[unique-id]
```

You can create a portal session programmatically in your backend, which is the recommended approach (already implemented in backend).

## Set Up Webhook Endpoint

Webhooks notify your backend when payment events occur (subscription created, cancelled, payment failed, etc.)

### Step 1: Create Webhook Endpoint

1. Go to Developers → Webhooks
2. Click "+ Add endpoint"
3. Configure endpoint:

```
Endpoint URL: https://api.promptlens.app/api/upgrade
Description: Production webhook for subscription events
```

### Step 2: Select Events to Listen

Select these events:

```
✅ checkout.session.completed
✅ customer.subscription.deleted
✅ invoice.payment_failed
```

Event descriptions:
- `checkout.session.completed`: User completed checkout, subscription created
- `customer.subscription.deleted`: User cancelled subscription
- `invoice.payment_failed`: Payment failed (expired card, insufficient funds, etc.)

### Step 3: Create Endpoint

Click "Add endpoint"

### Step 4: Get Webhook Signing Secret

1. Click on the newly created endpoint
2. In the "Signing secret" section, click "Reveal"
3. Copy the webhook signing secret: `whsec_...`

**Important**: Save this secret - you'll add it to backend environment variables.

### Step 5: Test Webhook Endpoint

1. In the webhook endpoint page, click "Send test webhook"
2. Select event: `checkout.session.completed`
3. Click "Send test webhook"
4. Verify response: 200 OK

Check backend logs to confirm event received:

```bash
# Railway
railway logs --tail

# Render
# View in dashboard logs

# Look for:
# ✅ Webhook event received: checkout.session.completed
# ✅ User upgraded to pro plan
```

## Update Environment Variables

### Step 1: Update Backend Environment Variables

Add/update these variables in your backend deployment:

```bash
# Railway
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."
railway variables set STRIPE_PRICE_ID="price_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."

# Render
# Update via dashboard: Service → Environment → Add/Edit Variables
```

### Step 2: Update Dashboard Environment Variables

Add/update these variables in Vercel:

```bash
# Vercel CLI
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_...

# Or via dashboard:
# Project → Settings → Environment Variables
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Step 3: Restart Services

```bash
# Backend (Railway)
railway restart

# Backend (Render)
# Automatically restarts on env variable change

# Dashboard (Vercel)
vercel --prod  # Redeploy
# Or commit and push to trigger auto-deploy
```

### Step 4: Verify Environment Variables

```bash
# Test backend has correct keys
curl -X POST https://api.promptlens.app/api/billing/checkout \
  -H "Authorization: Bearer [valid-token]" \
  -H "Content-Type: application/json"

# Should create checkout session (not error about invalid API key)
```

## Test Payment Flow

### Step 1: Test with Live Test Card

Stripe provides test cards that work in live mode for testing:

```
Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any valid ZIP (e.g., 12345)
```

⚠️ **Warning**: These test cards work in test mode. In live mode, you'll need a real card or use Stripe's testing features.

### Step 2: Create Test Customer

For live mode testing without charging real money:

1. Go to Stripe Dashboard → Settings → Testing
2. Enable "Test mode" temporarily, or
3. Use your own card and immediately refund the charge

### Step 3: Test Upgrade Flow

1. Visit dashboard: https://dashboard.promptlens.app
2. Sign in with Google
3. Click "Upgrade to Pro" button
4. Verify Stripe checkout page loads
5. Enter test card details (or real card for final verification)
6. Complete checkout
7. Verify redirect back to dashboard
8. Verify user plan shows "Pro"

### Step 4: Verify Webhook Processed

Check backend logs:

```bash
# Railway
railway logs --tail

# Expected output:
# ✅ Webhook event received: checkout.session.completed
# ✅ User upgraded to pro plan
# ✅ Usage count reset to 0
# ✅ Stripe customer ID saved: cus_...
# ✅ Stripe subscription ID saved: sub_...
```

### Step 5: Test Subscription Cancellation

1. Go to customer portal (from dashboard)
2. Click "Cancel subscription"
3. Confirm cancellation
4. Verify webhook received:

```bash
# Backend logs
# ✅ Webhook event received: customer.subscription.deleted
# ✅ User downgraded to free plan
```

### Step 6: Test Payment Failure

This is harder to test without actually failing a payment. Options:

1. **Stripe CLI (recommended for testing)**:
```bash
stripe trigger invoice.payment_failed --stripe-account=acct_...
```

2. **Test in live mode**: Cancel card after subscription created

3. **Wait for natural failure**: Card expires, insufficient funds, etc.

### Step 7: Verify in Stripe Dashboard

1. Go to Customers
2. Find test customer
3. Verify:
   - Customer created
   - Subscription active (or cancelled)
   - Payment successful (or failed)
   - Webhook events delivered

## Monitoring and Alerts

### Step 1: Enable Email Notifications

1. Go to Settings → Email settings
2. Enable notifications for:

```
✅ Failed payments
✅ Disputed payments
✅ Upcoming invoice payments
✅ Webhook failures
```

### Step 2: Configure Webhook Alerts

1. Go to Developers → Webhooks
2. Click on your production endpoint
3. Enable alerts:

```
✅ Alert on webhook failures
Alert email: engineering@promptlens.app
```

### Step 3: Monitor Webhook Health

Regularly check webhook status:

```
Developers → Webhooks → [Your endpoint]

Check metrics:
- Success rate (should be >99%)
- Average latency (should be <500ms)
- Failed events (should be 0)
```

### Step 4: Set Up Stripe Radar (Fraud Prevention)

1. Go to Fraud → Radar
2. Review default rules
3. Enable additional rules as needed:

```
Recommended rules:
✅ Block if CVC check fails
✅ Block if ZIP code check fails
✅ Review high-risk charges
```

### Step 5: Configure Dispute Settings

1. Go to Settings → Disputes
2. Set up dispute alerts:

```
✅ Email alerts on new disputes
✅ Require evidence within 7 days
```

## Troubleshooting

### Webhook Not Receiving Events

**Problem**: Events sent from Stripe but backend not receiving

```bash
# Solutions:

# 1. Verify webhook URL is correct
# Should be: https://api.promptlens.app/api/upgrade

# 2. Check webhook endpoint health
curl -X POST https://api.promptlens.app/api/upgrade
# Should return 400 (signature required), not 404

# 3. Review webhook events in Stripe Dashboard
# Developers → Webhooks → [endpoint] → Recent events
# Check for failed deliveries

# 4. Verify webhook secret is correct
# Backend STRIPE_WEBHOOK_SECRET should match Stripe Dashboard
```

### Signature Verification Failed

**Problem**: Webhook events rejected with signature error

```bash
# Solutions:

# 1. Verify STRIPE_WEBHOOK_SECRET matches webhook signing secret
# in Stripe Dashboard → Developers → Webhooks → [endpoint]

# 2. Check backend is preserving raw body for webhook endpoint
# Webhook signature verification requires raw body, not parsed JSON

# 3. Verify webhook secret for correct endpoint
# Each endpoint has its own signing secret
```

### Checkout Session Creation Fails

**Problem**: "Invalid API Key" or checkout session error

```bash
# Solutions:

# 1. Verify using live mode API keys (starts with sk_live_)
# Not test mode (sk_test_)

# 2. Check STRIPE_SECRET_KEY is set correctly in backend
railway variables list | grep STRIPE_SECRET_KEY

# 3. Verify Stripe account is activated for live mode
# Dashboard → Settings → Account

# 4. Check price ID exists and is active
# Dashboard → Products → [Your product] → Prices
```

### Payment Fails with Card Error

**Problem**: Card declined or payment fails

```bash
# Common reasons:

# 1. Insufficient funds
# 2. Card expired
# 3. CVC check failed
# 4. Billing address verification failed
# 5. Card blocked by issuer

# Solutions:

# 1. Ask user to try different card
# 2. Check Stripe Dashboard → Payments → [payment] for decline reason
# 3. Implement retry logic (Stripe Smart Retries does this automatically)
```

### User Not Upgraded After Payment

**Problem**: Payment successful but user still on free plan

```bash
# Solutions:

# 1. Check webhook was delivered
# Stripe Dashboard → Webhooks → Recent events

# 2. Check backend processed webhook correctly
railway logs --tail | grep "checkout.session.completed"

# 3. Verify user record updated in database
# MongoDB: db.users.findOne({ email: "user@example.com" })
# Should show: plan: "pro", stripeCustomerId, stripeSubscriptionId

# 4. Check for webhook processing errors in logs
# Look for error messages in backend logs
```

### Subscription Not Canceling

**Problem**: User cancels via customer portal but subscription remains active

```bash
# Solutions:

# 1. Verify webhook event received
# Backend logs should show: customer.subscription.deleted

# 2. Check webhook endpoint is listening to correct event
# Stripe Dashboard → Webhooks → [endpoint] → Events to send

# 3. Verify backend processes deletion event correctly
# Check BillingService.handleSubscriptionDeleted() logic

# 4. Check database updated
# db.users.findOne({ email: "user@example.com" })
# Should show: plan: "free", stripeSubscriptionId: null
```

## Deployment Checklist

### Pre-Deployment
- [ ] Stripe account verified and activated for live mode
- [ ] Business information completed
- [ ] Bank account added for payouts
- [ ] Live API keys obtained and stored securely

### Product Configuration
- [ ] Pro product created ($9.99/month)
- [ ] Price ID saved for environment variables
- [ ] Product description and branding set
- [ ] Customer portal configured
- [ ] Portal cancellation settings configured

### Webhook Configuration
- [ ] Webhook endpoint created (https://api.promptlens.app/api/upgrade)
- [ ] Events selected (checkout.session.completed, customer.subscription.deleted, invoice.payment_failed)
- [ ] Webhook signing secret obtained and stored
- [ ] Webhook tested with test event
- [ ] Webhook alerts configured

### Environment Variables
- [ ] Backend: STRIPE_SECRET_KEY set to live key
- [ ] Backend: STRIPE_PUBLISHABLE_KEY set to live key
- [ ] Backend: STRIPE_PRICE_ID set to product price ID
- [ ] Backend: STRIPE_WEBHOOK_SECRET set to webhook signing secret
- [ ] Dashboard: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set to live key
- [ ] Services restarted after environment variable updates

### Testing
- [ ] Checkout session creates successfully
- [ ] Payment completes successfully
- [ ] Webhook received and processed
- [ ] User upgraded to Pro plan in database
- [ ] User sees Pro plan in dashboard
- [ ] Usage limits reflect Pro tier
- [ ] Customer portal accessible
- [ ] Subscription cancellation works
- [ ] Cancellation webhook received and processed
- [ ] User downgraded to free plan

### Monitoring
- [ ] Email notifications enabled
- [ ] Webhook alerts configured
- [ ] Webhook health monitored (success rate >99%)
- [ ] Fraud prevention (Radar) reviewed
- [ ] Dispute alerts configured

## Next Steps

After Stripe configuration:

1. **[Test Complete Flow](./dashboard.md#smoke-tests)** - Test end-to-end from dashboard
2. **[Monitor Payments](https://dashboard.stripe.com/payments)** - Monitor first real payments
3. **[Set Up Refund Policy](https://stripe.com/docs/refunds)** - Configure refund procedures

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Backend Stripe Integration](../backend/STRIPE_INTEGRATION.md)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

**Need Help?**
- Stripe configuration: Contact Backend Engineer
- Payment issues: Stripe support (https://support.stripe.com)
- Webhook issues: Check backend logs and Stripe Dashboard webhook logs
