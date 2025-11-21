# Quota Middleware Usage Guide

## Overview

The `checkQuota` middleware is used to enforce API usage limits based on user subscription plans. It is **CRITICAL** that this middleware is applied correctly to prevent users from being locked out of essential functionality.

## The Golden Rule

**checkQuota middleware should ONLY be applied to the `/api/optimize` endpoint.**

## Why This Matters

When a user exceeds their quota, they must still be able to:
1. **Check their usage** (`/api/usage`) - to understand why they're being limited
2. **View their history** (`/api/history`) - to access their previous optimizations
3. **Upgrade their plan** (`/api/billing/*`) - to remove the quota limitation
4. **Authenticate** (`/api/auth/*`) - to access the application

If `checkQuota` is applied to these endpoints, users who have exceeded their quota will:
- Get 429 errors when trying to check usage
- Get 429 errors when trying to upgrade
- Be stuck in an infinite redirect loop
- Have no way to resolve their quota issue

## Current Implementation

### ✅ CORRECT - Endpoints WITHOUT checkQuota

```typescript
// /api/usage - Users must check usage at any time
router.get('/', requireAuth, asyncHandler(getUsage));

// /api/history - Users must access history at any time
router.get('/', requireAuth, asyncHandler(getHistory));

// /api/billing/* - Users must upgrade when quota is exceeded
router.post('/checkout', requireAuth, asyncHandler(createCheckoutSession));
router.post('/verify', requireAuth, asyncHandler(verifyPayment));

// /api/auth/* - Users must authenticate
router.get('/token', requireAuth, asyncHandler(getToken));
```

### ✅ CORRECT - Endpoint WITH checkQuota

```typescript
// /api/optimize - The ONLY endpoint that consumes quota
router.post('/', requireAuth, checkQuota, asyncHandler(optimizePrompt));
```

## Testing

All route files have tests that verify:
- Endpoints work correctly when quota is exceeded
- Only `/api/optimize` returns 429 when quota is exceeded
- Other endpoints remain accessible

Run tests with:
```bash
npm test -- quota.test.ts
npm test -- usage.test.ts
npm test -- history.test.ts
npm test -- billing.test.ts
```

## Common Mistakes to Avoid

❌ **NEVER** apply checkQuota globally:
```typescript
// WRONG - Don't do this!
router.use(checkQuota); // This breaks everything
```

❌ **NEVER** add checkQuota to route groups:
```typescript
// WRONG - Don't do this!
router.use('/api', requireAuth, checkQuota, routes); // This breaks everything
```

❌ **NEVER** add checkQuota to individual non-optimize routes:
```typescript
// WRONG - Don't do this!
router.get('/usage', requireAuth, checkQuota, asyncHandler(getUsage));
router.get('/history', requireAuth, checkQuota, asyncHandler(getHistory));
router.post('/billing/checkout', requireAuth, checkQuota, asyncHandler(createCheckoutSession));
```

## How checkQuota Works

The `checkQuota` middleware (in `backend/src/middlewares/quota.ts`):

1. Verifies user is authenticated
2. Resets usage count if 24 hours have passed
3. Checks if user has exceeded their daily limit
4. Returns 429 error if quota is exceeded
5. Allows request to proceed if quota is available

## Plan Limits

- **Free**: 4 requests per day
- **Pro Monthly**: 50 requests per day
- **Pro Yearly**: Unlimited requests

## Questions?

If you're unsure whether to add `checkQuota` to an endpoint, ask yourself:
- "Should a user with exceeded quota be able to access this?"
- If YES → Don't add checkQuota
- If NO → Only add checkQuota if it's the optimize endpoint

**When in doubt, leave it out!**
