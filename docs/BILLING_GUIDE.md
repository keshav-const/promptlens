# Billing and Subscription Guide

This guide covers the complete billing system for PromptLens, including plan details, upgrade flows, and quota management.

## Overview

PromptLens uses Razorpay for subscription billing with three tiers designed to accommodate different usage patterns. The system includes real-time quota enforcement, automatic usage tracking, and seamless upgrade/downgrade capabilities.

## Subscription Plans

### Plan Comparison

| Feature | Free | Pro Monthly | Pro Yearly |
|---------|-------|-------------|------------|
| **Price** | Free | ₹999/month | ₹9,999/year |
| **Daily Requests** | 4 requests/day | 50 requests/day | Unlimited |
| **Monthly Requests** | ~120 requests | ~1,500 requests | Unlimited |
| **Annual Savings** | - | - | Save ₹1,989/year |
| **Features** | Basic optimization | Priority support | All features + unlimited |
| **Usage Reset** | Every 24 hours | Every 24 hours | No limits |
| **Upgrade Flow** | Instant | Instant | Instant |

### Use Cases

**Free Plan**: Perfect for casual users who optimize prompts occasionally
- Students learning prompt engineering
- Hobbyists experimenting with AI
- Users testing the platform

**Pro Monthly**: Ideal for regular users with consistent needs
- Content creators optimizing daily
- Developers working on multiple projects
- Small teams with moderate usage

**Pro Yearly**: Best for power users and professionals
- Agencies with high-volume needs
- Enterprise users requiring unlimited access
- Users wanting maximum value

## Quota System

### How Quotas Work

1. **Request Tracking**: Every API call to `/api/optimize` counts toward daily quota
2. **24-Hour Window**: Quotas reset 24 hours after your first request, not at midnight
3. **Real-time Enforcement**: Limits are checked before processing each request
4. **Graceful Degradation**: Clear error messages when limits are reached

### Quota Reset Behavior

```bash
# Example: Free user with 4 daily requests
Request 1: 9:00 AM - Usage: 1/4, Reset: Next day 9:00 AM
Request 2: 11:30 AM - Usage: 2/4, Reset: Next day 9:00 AM  
Request 3: 2:45 PM - Usage: 3/4, Reset: Next day 9:00 AM
Request 4: 6:20 PM - Usage: 4/4, Reset: Next day 9:00 AM
Request 5: 7:15 PM - ❌ LIMIT EXCEEDED - Reset: Next day 9:00 AM
```

### Quota Error Response

When limits are exceeded, users receive detailed information:

```json
{
  "success": false,
  "error": {
    "message": "Daily limit reached. You have used 4/4 requests. Quota resets at 2024-01-02T09:00:00.000Z",
    "code": "QUOTA_EXCEEDED",
    "details": {
      "usageCount": 4,
      "limit": 4,
      "plan": "free",
      "planName": "Free",
      "resetAt": "2024-01-02T09:00:00.000Z"
    }
  }
}
```

## Upgrade Flow

### Dashboard Upgrade Flow

1. **User Initiates Upgrade**
   - Clicks "Upgrade to Pro" button in dashboard
   - Chooses between Monthly (₹999) or Yearly (₹9,999) plan
   - Frontend calls `POST /api/billing/checkout`

2. **Backend Creates Subscription**
   - Validates user authentication
   - Creates Razorpay customer if needed
   - Creates subscription plan
   - Returns subscription details to frontend

3. **Payment Processing**
   - Frontend initializes Razorpay checkout modal
   - User enters payment details
   - Razorpay processes payment securely

4. **Payment Verification**
   - Frontend receives payment success callback
   - Calls `POST /api/billing/verify` with payment details
   - Backend verifies signature and updates user plan
   - User sees immediate plan upgrade

5. **Webhook Confirmation**
   - Razorpay sends `subscription.activated` webhook
   - Backend processes event and confirms subscription
   - User quota is immediately reset to 0

### Extension Upgrade Flow

1. **Quota Limit Triggered**
   - User hits quota limit during prompt optimization
   - Extension shows upgrade prompt with plan comparison
   - User clicks "Upgrade Now"

2. **Redirect to Dashboard**
   - Extension opens dashboard in new tab
   - Pre-selects upgrade plan based on usage patterns
   - User follows same flow as dashboard upgrade

3. **Seamless Return**
   - After successful upgrade, user returns to extension
   - Extension refreshes user status
   - User can immediately continue working

### Plan Change Effects

**Upgrading to Paid Plan:**
- ✅ Usage count immediately reset to 0
- ✅ New quota limits applied instantly
- ✅ All existing prompts preserved
- ✅ No interruption in service

**Downgrading to Free Plan:**
- ✅ Current usage preserved until next reset
- ✅ Plan changes at next quota reset
- ✅ All saved prompts remain accessible
- ⚠️ New quota limits apply after reset

## API Endpoints

### Create Subscription

```http
POST /api/billing/checkout
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "plan": "pro_monthly" | "pro_yearly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_00000000000001",
    "razorpayKeyId": "rzp_test_...",
    "plan": "pro_monthly",
    "planName": "Pro (Monthly)"
  }
}
```

### Verify Payment

```http
POST /api/billing/verify
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "paymentId": "pay_00000000000001",
  "orderId": "order_00000000000001", 
  "signature": "generated_signature",
  "subscriptionId": "sub_00000000000001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Payment verified successfully",
    "plan": "pro_monthly"
  }
}
```

### Get Billing Status

```http
GET /api/billing/status
Authorization: Bearer <jwt-token>
```

**Response:**
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
  }
}
```

### Get Usage Information

```http
GET /api/usage
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "pro_monthly",
    "usageCount": 12,
    "limit": 50,
    "remaining": 38,
    "lastResetAt": "2024-01-01T09:00:00.000Z",
    "nextResetAt": "2024-01-02T09:00:00.000Z"
  }
}
```

## Frontend Integration

### React Component Example

```tsx
import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const { createSubscription } = useBilling();

  const handleUpgrade = async (plan: 'pro_monthly' | 'pro_yearly') => {
    setLoading(true);
    try {
      const { subscriptionId, razorpayKeyId } = await createSubscription(plan);
      
      // Initialize Razorpay checkout
      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: 'PromptLens Pro',
        description: `${plan === 'pro_monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        handler: async function (response: any) {
          // Verify payment
          await verifyPayment(response);
          // Refresh user status
          await refetchUser();
        },
      };
      
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upgrade-options">
      <button 
        onClick={() => handleUpgrade('pro_monthly')}
        disabled={loading}
      >
        Upgrade to Pro (₹999/month)
      </button>
      <button 
        onClick={() => handleUpgrade('pro_yearly')}
        disabled={loading}
      >
        Upgrade to Pro (₹9,999/year)
        <span className="savings">Save ₹1,989/year</span>
      </button>
    </div>
  );
}
```

### Custom Hook for Billing

```tsx
// hooks/useBilling.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export function useBilling() {
  const { data: billingStatus } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => apiClient.get('/billing/status'),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (plan: 'pro_monthly' | 'pro_yearly') =>
      apiClient.post('/billing/checkout', { plan }),
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (paymentData: any) =>
      apiClient.post('/billing/verify', paymentData),
  });

  return {
    billingStatus,
    createSubscription: createSubscriptionMutation.mutateAsync,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isLoading: createSubscriptionMutation.isPending || verifyPaymentMutation.isPending,
  };
}
```

## Testing

### Development Testing

1. **Test Mode Setup**
   ```bash
   # Use test keys in .env
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=test_secret
   ```

2. **Test Cards**
   - Any valid card number works in test mode
   - Use future expiry date and any 3-digit CVV
   - No actual charges are made

3. **Test Scenarios**
   ```bash
   # Create subscription
   curl -X POST http://localhost:5000/api/billing/checkout \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"plan": "pro_monthly"}'

   # Test quota limits
   curl http://localhost:5000/api/usage \
     -H "Authorization: Bearer <token>"
   ```

### Production Testing

1. **Live Payment Testing**
   - Use small amount plans for initial testing
   - Test with actual payment methods
   - Immediately refund test transactions

2. **Webhook Testing**
   ```bash
   # Test webhook delivery
   razorpay listen --forward-to https://api.yourapp.com/api/billing/webhook
   ```

3. **End-to-End Testing**
   - Complete upgrade flow in dashboard
   - Verify quota changes immediately
   - Test extension integration
   - Validate webhook processing

## Monitoring and Analytics

### Key Metrics to Track

1. **Conversion Metrics**
   - Free to Pro upgrade rate
   - Monthly vs Yearly plan preference
   - Drop-off points in checkout flow
   - Time from limit hit to upgrade

2. **Usage Metrics**
   - Average requests per user per day
   - Quota utilization by plan
   - Peak usage times
   - Most active user segments

3. **Revenue Metrics**
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR)
   - Customer Lifetime Value (LTV)
   - Churn rate by plan

### Dashboard Implementation

```tsx
export function BillingMetrics() {
  const { data: metrics } = useQuery({
    queryKey: ['billing-metrics'],
    queryFn: () => apiClient.get('/admin/billing/metrics'),
  });

  return (
    <div className="metrics-grid">
      <MetricCard
        title="MRR"
        value={`₹${metrics?.mrr || 0}`}
        change={metrics?.mrrChange}
      />
      <MetricCard
        title="Active Subscriptions"
        value={metrics?.activeSubscriptions || 0}
        change={metrics?.subscriptionChange}
      />
      <MetricCard
        title="Conversion Rate"
        value={`${metrics?.conversionRate || 0}%`}
        change={metrics?.conversionChange}
      />
    </div>
  );
}
```

## Error Handling

### Common Error Scenarios

1. **Payment Failed**
   ```json
   {
     "error": "Payment processing failed",
     "code": "PAYMENT_FAILED",
     "action": "Please try a different payment method"
   }
   ```

2. **Webhook Not Processed**
   ```json
   {
     "error": "Subscription activation pending",
     "code": "PENDING_ACTIVATION",
     "action": "Please contact support if issue persists"
   }
   ```

3. **Quota Exceeded**
   ```json
   {
     "error": "Daily limit reached",
     "code": "QUOTA_EXCEEDED",
     "details": {
       "resetAt": "2024-01-02T09:00:00.000Z",
       "upgradeUrl": "/billing/upgrade"
     }
   }
   ```

### Graceful Degradation

- Always provide upgrade path when limits are hit
- Show time remaining until quota reset
- Offer plan comparison and benefits
- Maintain access to existing data regardless of plan

## Security Considerations

### Payment Security

1. **PCI Compliance**
   - Never store raw card details
   - Use Razorpay's secure payment forms
   - All sensitive data handled by Razorpay

2. **Webhook Security**
   - Verify all webhook signatures
   - Use HTTPS for webhook endpoints
   - Implement replay attack prevention

3. **API Security**
   - Require authentication for all billing endpoints
   - Validate all input parameters
   - Rate limit billing endpoints

### Data Privacy

1. **User Data**
   - Minimal data collection for billing
   - Secure storage of subscription information
   - GDPR compliance for user data

2. **Payment Data**
   - No payment details stored in application
   - All processing through Razorpay
   - Secure tokenization methods

## Support and Troubleshooting

### Common Issues

1. **Upgrade Not Reflected**
   - Check webhook processing logs
   - Verify payment verification succeeded
   - Confirm user plan updated in database

2. **Quota Not Updated**
   - Verify subscription is active
   - Check webhook event processing
   - Validate plan configuration

3. **Payment Processing Errors**
   - Verify Razorpay credentials
   - Check plan configuration
   - Test webhook endpoint accessibility

### Support Workflow

1. **User Reports Issue**
   - Check user's current plan and usage
   - Review payment and webhook logs
   - Verify subscription status in Razorpay

2. **Manual Intervention**
   - Update user plan directly if needed
   - Process refunds for failed payments
   - Extend quotas for service issues

3. **Escalation**
   - Contact Razorpay support for payment issues
   - Technical team for API problems
   - Product team for policy questions

## Future Enhancements

### Planned Features

1. **Advanced Plans**
   - Team/Enterprise plans
   - Custom usage limits
   - Volume discounts

2. **Billing Management**
   - Subscription cancellation portal
   - Payment method updates
   - Invoice history and downloads

3. **Analytics Dashboard**
   - Usage analytics for users
   - Cost optimization insights
   - Usage forecasting

4. **Integrations**
   - Corporate billing
   - Purchase orders
   - Expense reporting

### Technical Improvements

1. **Performance**
   - Cached quota calculations
   - Optimized webhook processing
   - Real-time usage updates

2. **Reliability**
   - Webhook retry mechanisms
   - Payment failure recovery
   - Data consistency checks

3. **User Experience**
   - Progressive upgrade prompts
   - Usage notifications
   - Smart plan recommendations

---

For technical implementation details, see:
- [Backend API Documentation](../backend/API.md)
- [Razorpay Integration Guide](../backend/RAZORPAY_INTEGRATION.md)
- [Deployment Guide](../deployment/razorpay.md)