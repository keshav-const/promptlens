# API Services

This directory contains client-side API integration services for the dashboard application.

## Overview

The API service layer provides typed, centralized access to backend endpoints with:

- Automatic JWT token handling
- Standardized error handling
- Type-safe request/response interfaces
- Centralized configuration

## Usage

### Importing

```typescript
import {
  fetchPromptHistory,
  fetchUsageData,
  createSubscription,
  verifySubscription,
  handleApiError,
} from '@/services/api';
```

### Fetching Prompt History

```typescript
// Get all prompts
const { prompts, total, stats } = await fetchPromptHistory();

// With filters
const { prompts, total, stats } = await fetchPromptHistory({
  search: 'optimization',
  tags: ['important', 'work'],
  favorites: true,
  limit: 20,
  offset: 0,
});

console.log(`Total prompts: ${stats.totalPrompts}`);
console.log(`Favorite prompts: ${stats.favoriteCount}`);
```

### Fetching Usage Data

```typescript
const usage = await fetchUsageData();
console.log(`Used ${usage.dailyCount}/${usage.dailyLimit} today`);
```

### Managing Prompts

```typescript
// Toggle favorite
await updatePromptFavorite('prompt-id', true);

// Delete prompt
await deletePrompt('prompt-id');
```

### Upgrade Flow

```typescript
// Create subscription
const checkoutData = await createSubscription('monthly');
// Open Razorpay checkout modal with checkoutData

// Verify payment after successful checkout
const result = await verifySubscription({
  paymentId: 'razorpay_payment_id',
  orderId: 'razorpay_order_id',
  signature: 'razorpay_signature',
  subscriptionId: 'razorpay_subscription_id',
});

// Create billing portal session (for Pro users)
const { url } = await createBillingPortalSession();
window.location.href = url; // Redirect to billing portal
```

## Error Handling

All API functions throw `ApiError` on failure. Use `handleApiError()` to get user-friendly error messages:

```typescript
try {
  const data = await fetchUsageData();
} catch (error) {
  const message = handleApiError(error);
  // Display message to user (e.g., toast, alert, or state)
  console.error(message);
}
```

### Error Types

- `RATE_LIMIT_EXCEEDED` - User hit API rate limit
- `QUOTA_EXCEEDED` - User exceeded daily/monthly usage limit
- `UNAUTHORIZED` - Invalid or missing authentication
- `NETWORK_ERROR` - Connection issues
- Custom error codes from backend

## Configuration

The base API URL is configured via environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Authentication

The service automatically:

1. Retrieves JWT token from `TokenStorage`
2. Includes token in `Authorization` header
3. Works seamlessly with NextAuth session management

## Type Safety

All functions use TypeScript types from `@/types/api`:

- `Prompt` - Prompt data structure
- `UsageData` - Usage/quota information
- `RazorpayCheckoutData` - Razorpay subscription checkout details
- `RazorpayVerificationData` - Razorpay payment verification payload
- `ApiResponse<T>` - Standard API response wrapper
- `ApiError` - Error structure

## Testing

Unit tests are located in `__tests__/api.test.ts`. Run with:

```bash
npm test
```

Tests cover:

- Successful API calls
- Error handling
- Query parameter serialization
- Token authentication
- Network errors

## API Endpoints

| Function                     | Endpoint            | Method | Auth |
| ---------------------------- | ------------------- | ------ | ---- |
| `fetchPromptHistory`         | `/history`          | GET    | Yes  |
| `fetchUsageData`             | `/usage`            | GET    | Yes  |
| `createSubscription`         | `/billing/checkout` | POST   | Yes  |
| `verifySubscription`         | `/billing/verify`   | POST   | Yes  |
| `createBillingPortalSession` | `/billing/portal`   | POST   | Yes  |
| `updatePromptFavorite`       | `/history/:id`      | PATCH  | Yes  |
| `deletePrompt`               | `/history/:id`      | DELETE | Yes  |

## Examples

### Complete Component Example

```typescript
import { useState, useEffect } from 'react';
import { fetchUsageData, handleApiError } from '@/services/api';
import { UsageData } from '@/types/api';

export default function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await fetchUsageData();
        setUsage(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!usage) return null;

  return (
    <div>
      <p>Daily: {usage.dailyCount}/{usage.dailyLimit}</p>
      <p>Plan: {usage.plan}</p>
    </div>
  );
}
```

### With State Management

```typescript
import { useState } from 'react';
import { createSubscription, verifySubscription, handleApiError } from '@/services/api';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay';

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const checkoutData = await createSubscription('monthly');

      openRazorpayCheckout({
        key: checkoutData.razorpayKeyId,
        subscription_id: checkoutData.subscriptionId,
        name: 'PromptLens Pro',
        description: checkoutData.planName,
        handler: async (response) => {
          try {
            await verifySubscription({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              subscriptionId: response.razorpay_subscription_id,
            });
            // Handle successful upgrade
          } catch (err) {
            setError(handleApiError(err));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
          escape: true,
          backdropclose: true,
          animate: true,
        },
        theme: {
          color: '#4F46E5',
        },
      });
    } catch (err) {
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleUpgrade} disabled={loading}>
        {loading ? 'Processing...' : 'Upgrade'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## Future Enhancements

- Request caching with SWR or React Query
- Retry logic for failed requests
- Request cancellation support
- Batch operations
- WebSocket support for real-time updates
