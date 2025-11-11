# Razorpay Configuration Guide

## Overview

This guide covers configuring Razorpay for production payment processing in the PromptLens application. Users can upgrade to Pro plans (Monthly: ₹999/month, Yearly: ₹9,999/year) which provide increased usage limits.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Switch to Live Mode](#switch-to-live-mode)
- [Create Subscription Plans](#create-subscription-plans)
- [Set Up Webhook Endpoint](#set-up-webhook-endpoint)
- [Update Environment Variables](#update-environment-variables)
- [Test Payment Flow](#test-payment-flow)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access
- [ ] Razorpay account with business verification completed
- [ ] Backend API deployed and accessible (see [backend.md](./backend.md))
- [ ] Dashboard deployed (see [dashboard.md](./dashboard.md))
- [ ] Admin access to Razorpay Dashboard

### Business Information Required
Before going live, Razorpay requires:
- Business name and address
- Business type (sole proprietorship, LLC, corporation, etc.)
- Tax ID (PAN, GSTIN if applicable)
- Bank account for payouts
- Business website URL
- Customer support contact

### Complete Razorpay Verification

1. Go to https://dashboard.razorpay.com/settings/branding
2. Complete business profile
3. Add bank account for payouts
4. Verify identity documents (if requested)
5. Wait for approval (typically 1-2 business days)

## Switch to Live Mode

### Step 1: Activate Live Mode

1. Log in to Razorpay Dashboard: https://dashboard.razorpay.com
2. Top left corner: Switch from "Test Mode" to "Live Mode"
3. If not activated, click "Activate your account"
4. Complete activation requirements

### Step 2: Get Live API Keys

1. Go to Settings → API Keys
2. Ensure "Live Mode" toggle is ON
3. Generate new key pair if needed:
4. Copy your keys:

```
Key ID: rzp_live_abc123...
Key Secret: (click "Reveal Secret Key")
```

⚠️ **Security Warning**: Never share or commit your secret key!

### Step 3: Store API Keys Securely

```bash
# Save to password manager
# Entry: "PromptLens Razorpay Live Keys"
# Key ID: rzp_live_...
# Key Secret: ...

# You'll add these to backend/dashboard environment variables later
```

## Create Subscription Plans

### Step 1: Create Pro Monthly Plan

1. Go to Subscriptions → Plans
2. Click "+ Create New Plan"
3. Configure plan:

```
Plan Name: Pro Monthly
Description: Upgrade to Pro for increased prompt limits
Amount: 99900 (₹999.00)
Period: Monthly
```

4. Click "Create Plan"
5. Copy the Plan ID: `plan_abc123...`

**Important**: Save this Plan ID - you'll need it for environment variables.

### Step 2: Create Pro Yearly Plan

1. Click "+ Create New Plan" again
2. Configure plan:

```
Plan Name: Pro Yearly
Description: Unlimited prompt optimization with yearly savings
Amount: 999900 (₹9,999.00)
Period: Yearly
```

3. Click "Create Plan"
4. Copy the Plan ID: `plan_def456...`

### Step 3: Configure Plan Settings (Optional)

For both plans, you can configure:
- Trial period (0 days for immediate activation)
- Notes for customer communication
- Custom invoice templates

## Set Up Webhook Endpoint

Webhooks notify your backend when payment events occur (subscription created, cancelled, payment failed, etc.)

### Step 1: Create Webhook Endpoint

1. Go to Settings → Webhooks
2. Click "+ Add Webhook"
3. Configure endpoint:

```
Webhook URL: https://api.promptlens.app/api/billing/webhook
Secret: (auto-generated, copy this)
Description: Production webhook for subscription events
```

### Step 2: Select Events to Listen

Select these events:

```
✅ subscription.activated
✅ subscription.cancelled
✅ payment.failed
```

Event descriptions:
- `subscription.activated`: User successfully subscribed
- `subscription.cancelled`: User cancelled subscription
- `payment.failed`: Payment failed (expired card, insufficient funds, etc.)

### Step 3: Create Endpoint

Click "Create Webhook"

### Step 4: Get Webhook Secret

1. Click on the newly created webhook
2. Copy the Webhook Secret (starts with your custom secret)
3. **Important**: Save this secret - you'll add it to backend environment variables.

### Step 5: Test Webhook Endpoint

1. In the webhook page, click "Send Test Webhook"
2. Select event: `subscription.activated`
3. Click "Send Test Webhook"
4. Verify response: 200 OK

Check backend logs to confirm event received:

```bash
# Railway
railway logs --tail

# Render
# View in dashboard logs

# Look for:
# ✅ Webhook event received: subscription.activated
# ✅ User upgraded to pro plan
```

## Update Environment Variables

### Step 1: Update Backend Environment Variables

Add/update these variables in your backend deployment:

```bash
# Railway
railway variables set RAZORPAY_KEY_ID="rzp_live_..."
railway variables set RAZORPAY_KEY_SECRET="..."
railway variables set RAZORPAY_PRO_MONTHLY_PLAN_ID="plan_..."
railway variables set RAZORPAY_PRO_YEARLY_PLAN_ID="plan_..."
railway variables set RAZORPAY_WEBHOOK_SECRET="..."

# Render
# Update via dashboard: Service → Environment → Add/Edit Variables
```

### Step 2: Update Dashboard Environment Variables

Add/update these variables in Vercel:

```bash
# Vercel CLI
vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production
# Enter: rzp_live_...

# Or via dashboard:
# Project → Settings → Environment Variables
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
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
  -H "Content-Type: application/json" \
  -d '{"plan": "pro_monthly"}'

# Should create subscription (not error about invalid API key)
```

## Test Payment Flow

### Step 1: Test with Live Test Cards

Razorpay provides test cards that work in live mode for testing:

```
Card number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/34)
CVV: Any 3 digits (e.g., 123)
```

⚠️ **Warning**: These test cards work in test mode. In live mode, you'll need a real card or use Razorpay's testing features.

### Step 2: Create Test Customer

For live mode testing without charging real money:

1. Go to Razorpay Dashboard → Settings → Testing
2. Enable "Test mode" temporarily, or
3. Use your own card and immediately refund the charge

### Step 3: Test Upgrade Flow

1. Visit dashboard: https://dashboard.promptlens.app
2. Sign in with Google
3. Click "Upgrade to Pro" button
4. Choose monthly or yearly plan
5. Verify Razorpay checkout page loads
6. Enter test card details (or real card for final verification)
7. Complete payment
8. Verify redirect back to dashboard
9. Verify user plan shows "Pro"

### Step 4: Verify Payment Verification

1. After payment completion, frontend calls verification endpoint
2. Check backend logs:

```bash
# Railway
railway logs --tail

# Expected output:
# ✅ Payment verified successfully
# ✅ User upgraded to pro plan
# ✅ Usage count reset to 0
# ✅ Razorpay customer ID saved: cus_...
# ✅ Razorpay subscription ID saved: sub_...
```

### Step 5: Test Subscription Cancellation

1. Go to customer portal (from dashboard)
2. Click "Cancel subscription"
3. Verify webhook received:

```bash
# Backend logs
# ✅ Webhook event received: subscription.cancelled
# ✅ User downgraded to free plan
```

### Step 6: Test Payment Failure

This is harder to test without actually failing a payment. Options:

1. **Razorpay Dashboard**: Use test scenarios in dashboard
2. **Test in live mode**: Cancel card after subscription created
3. **Wait for natural failure**: Card expires, insufficient funds, etc.

### Step 7: Verify in Razorpay Dashboard

1. Go to Customers
2. Find test customer
3. Verify:
   - Customer created
   - Subscription active (or cancelled)
   - Payment successful (or failed)
   - Webhook events delivered

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

## Monitoring and Alerts

### Step 1: Enable Email Notifications

1. Go to Settings → Email Settings
2. Enable notifications for:

```
✅ Failed payments
✅ Disputed payments
✅ Upcoming invoice payments
✅ Webhook failures
```

### Step 2: Configure Webhook Alerts

1. Go to Settings → Webhooks
2. Click on your production webhook
3. Enable alerts:

```
✅ Alert on webhook failures
Alert email: engineering@promptlens.app
```

### Step 3: Monitor Webhook Health

Regularly check webhook status:

```
Settings → Webhooks → [Your webhook]

Check metrics:
- Success rate (should be >99%)
- Average latency (should be <500ms)
- Failed events (should be 0)
```

### Step 4: Set Up Fraud Prevention

1. Go to Fraud → Razorpay Radar
2. Review default rules
3. Enable additional rules as needed:

```
Recommended rules:
✅ Block if CVV check fails
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

**Problem**: Events sent from Razorpay but backend not receiving

```bash
# Solutions:

# 1. Verify webhook URL is correct
# Should be: https://api.promptlens.app/api/billing/webhook

# 2. Check webhook endpoint health
curl -X POST https://api.promptlens.app/api/billing/webhook
# Should return 400 (signature required), not 404

# 3. Review webhook events in Razorpay Dashboard
# Settings → Webhooks → [webhook] → Recent events
# Check for failed deliveries

# 4. Verify webhook secret is correct
# Backend RAZORPAY_WEBHOOK_SECRET should match Razorpay Dashboard
```

### Signature Verification Failed

**Problem**: Webhook events rejected with signature error

```bash
# Solutions:

# 1. Verify RAZORPAY_WEBHOOK_SECRET matches webhook secret
# in Razorpay Dashboard → Settings → Webhooks → [webhook]

# 2. Check backend is preserving raw body for webhook endpoint
# Webhook signature verification requires raw body, not parsed JSON

# 3. Verify webhook secret for correct endpoint
# Each endpoint has its own signing secret
```

### Subscription Creation Fails

**Problem**: "Invalid API Key" or subscription creation error

```bash
# Solutions:

# 1. Check API keys are correct
# RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET should match live mode

# 2. Verify plan IDs are correct
# RAZORPAY_PRO_MONTHLY_PLAN_ID and RAZORPAY_PRO_YEARLY_PLAN_ID
# should match actual plan IDs from Razorpay Dashboard

# 3. Check account is activated
# Razorpay account must be verified and in live mode

# 4. Verify webhook endpoint is accessible
# Webhook URL must be reachable from Razorpay servers
```

### Payment Verification Fails

**Problem**: Payment completed but verification fails

```bash
# Solutions:

# 1. Check payment verification parameters
# paymentId, orderId, signature, subscriptionId must all be present

# 2. Verify signature generation
# Frontend should use Razorpay SDK to generate signature

# 3. Check subscription notes contain userId and plan
# Subscription should have notes with userId and plan information

# 4. Verify user exists in database
# User with matching ID should exist in your database
```

### Plan Limits Not Applied

**Problem**: User upgraded but still sees old limits

```bash
# Solutions:

# 1. Check webhook was processed
# Look for "subscription.activated" event in backend logs

# 2. Verify user record updated
# Check user.plan, user.razorpaySubscriptionId in database

# 3. Check quota middleware
# quota.ts should fetch fresh user data on each request

# 4. Test usage endpoint
# GET /api/usage should show updated plan and limits
```

## Security Best Practices

### API Key Management

1. **Never commit secrets**: Add all API keys to .gitignore
2. **Use environment-specific keys**: Separate test and live keys
3. **Rotate keys regularly**: Update keys every 90 days
4. **Monitor key usage**: Check for unusual API activity

### Webhook Security

1. **Always verify signatures**: Never trust webhook content without verification
2. **Use HTTPS**: Webhook URLs must use HTTPS
3. **Implement idempotency**: Handle duplicate events gracefully
4. **Log webhook events**: Keep audit trail of all webhook processing

### Payment Security

1. **Validate all inputs**: Sanitize all payment-related data
2. **Use Razorpay SDK**: Never implement payment logic from scratch
3. **Store minimal data**: Don't store full card numbers or CVV
4. **Monitor for fraud**: Set up alerts for suspicious activity

## Production Checklist

Before going live with Razorpay:

### Configuration
- [ ] Live API keys configured in backend
- [ ] Live plan IDs configured in backend
- [ ] Webhook endpoint configured and tested
- [ ] Frontend Razorpay key ID configured
- [ ] All environment variables set

### Testing
- [ ] Test subscription creation (monthly and yearly)
- [ ] Test payment verification workflow
- [ ] Test webhook event processing
- [ ] Test subscription cancellation
- [ ] Test quota limit enforcement
- [ ] Test error handling scenarios

### Monitoring
- [ ] Webhook monitoring configured
- [ ] Error logging set up
- [ ] Payment failure alerts configured
- [ ] Performance monitoring enabled

### Security
- [ ] API keys stored securely
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced everywhere
- [ ] Access controls implemented

### Documentation
- [ ] Internal documentation updated
- [ ] Customer support team trained
- [ ] FAQ updated for new payment flow
- [ ] Error messages user-friendly

## Support Resources

### Razorpay Documentation
- [Razorpay Docs](https://razorpay.com/docs/)
- [Subscription API](https://razorpay.com/docs/subscriptions/api/)
- [Webhooks Guide](https://razorpay.com/docs/webhooks/)
- [Testing Guide](https://razorpay.com/docs/payment-gateway/test-card-details/)

### Common Issues
- [Troubleshooting Guide](https://razorpay.com/docs/troubleshooting/)
- [FAQ](https://razorpay.com/docs/faq/)
- [Support Portal](https://razorpay.com/support/)

### Emergency Contacts
- Razorpay Support: support@razorpay.com
- Technical Support: Available 24/7 for live accounts
- Account Manager: Contact through dashboard for enterprise accounts