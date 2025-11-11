# Phase 1 Testing Plan

## Table of Contents

1. [Testing Goals](#testing-goals)
2. [Prerequisites](#prerequisites)
3. [Role-Based Responsibilities](#role-based-responsibilities)
4. [Backend API Validation](#backend-api-validation)
5. [Automated Test Coverage](#automated-test-coverage)
6. [Manual Verification Checklists](#manual-verification-checklists)
7. [Integration Flow Testing](#integration-flow-testing)
8. [Sign-Off Checklist](#sign-off-checklist)

---

## Testing Goals

The Phase 1 testing blueprint ensures comprehensive validation of the PromptLens application across all components:

- **Backend API**: Validate all endpoints, authentication, rate limiting, quota management, and Stripe webhooks
- **Browser Extension**: Verify prompt optimization UI, textarea detection, modal interactions, and error handling
- **Web Dashboard**: Test authentication, prompt history, usage tracking, subscription management, and responsive design
- **Cross-Product Flows**: Ensure seamless integration between extension, backend API, and dashboard
- **Edge Cases**: Cover error scenarios, quota limits, network failures, and malformed inputs
- **Performance**: Verify acceptable response times and memory usage

**Success Criteria:**
- All automated tests pass (Jest, Playwright)
- Manual QA checklists completed without critical issues
- API contract validated via Postman collection
- Integration flows work end-to-end
- No console errors in normal operation
- Security measures (auth, rate limiting, CORS) functioning correctly

---

## Prerequisites

### Service Requirements

Before testing, ensure all services are running:

| Service | Port | Command | Health Check |
|---------|------|---------|--------------|
| Backend API | 3000 | `npm run dev --workspace=backend` | http://localhost:3000/api/health |
| Web Dashboard | 3001 | `npm run dev --workspace=web` | http://localhost:3001 |
| MongoDB | 27017 | Local instance or Atlas | Check connection in backend logs |
| Stripe CLI | - | `stripe listen --forward-to http://localhost:3000/api/upgrade` | See webhook events in CLI |

### Required Environment Files

#### Backend (`.env`)
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/promptlens

# API Keys
GEMINI_API_KEY=your_gemini_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3001,chrome-extension://*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Extension (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000
```

#### Web Dashboard (`.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Seed Data Options

#### Option 1: Manual Testing
Use the extension or dashboard UI to create test data naturally.

#### Option 2: Database Seeding (Recommended for QA)
Create a seed script (`backend/scripts/seed.js`) to populate test users and prompts:

```javascript
// Example seed data structure
const testUsers = [
  {
    email: 'free@test.com',
    name: 'Free User',
    plan: 'free',
    usageCount: 5,
    limit: 10
  },
  {
    email: 'pro@test.com',
    name: 'Pro User',
    plan: 'pro',
    usageCount: 50,
    limit: -1 // unlimited
  }
];
```

#### Option 3: Postman Pre-Request Scripts
Use Postman collection's setup requests to create test data via API.

### MongoDB Memory Server

For automated tests, MongoDB Memory Server is used (no local MongoDB required):

```bash
# Backend tests use in-memory MongoDB automatically
npm run test --workspace=backend

# Configuration in jest.config.js
# MONGODB_MEMORY_SERVER_VERSION=7.0.0
```

### Stripe CLI Setup

Install and configure Stripe CLI for webhook testing:

```bash
# Install (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local backend
stripe listen --forward-to http://localhost:3000/api/upgrade

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

---

## Role-Based Responsibilities

### QA Engineer
- Execute manual test checklists for extension and dashboard
- Document bugs with reproduction steps and screenshots
- Verify automated test coverage aligns with requirements
- Perform exploratory testing for edge cases
- Sign off on test completion

### Backend Developer
- Maintain Jest test suite for API endpoints
- Ensure MongoDB Memory Server tests cover all database operations
- Validate Stripe webhook handling and idempotency
- Review API contract in Postman collection
- Fix failing backend tests

### Frontend Developer (Extension)
- Maintain Jest tests for extension components and utilities
- Perform manual testing on ChatGPT and Gemini platforms
- Verify Chrome API mocks are accurate
- Test extension in Chrome and Edge browsers
- Address memory leaks and performance issues

### Frontend Developer (Dashboard)
- Maintain Jest tests for React components
- Create and maintain Playwright E2E tests
- Execute manual QA checklist for dashboard features
- Test responsive design across breakpoints
- Verify NextAuth integration and token management

### DevOps/Integration
- Run Postman/Newman collection in CI pipeline
- Monitor CI test results and artifact uploads
- Ensure all workspaces build and test successfully
- Configure test environments for staging/production
- Review integration flow test results

---

## Backend API Validation

### Authentication Middleware Scenarios

All authenticated endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

| Scenario | Setup | Expected Response | HTTP Status |
|----------|-------|-------------------|-------------|
| **Valid Token** | Send request with valid JWT | Request processed successfully | 200/201 |
| **Missing Token** | Omit `Authorization` header | `{ "success": false, "error": { "message": "Authentication required" } }` | 401 |
| **Expired Token** | Use token past `JWT_EXPIRES_IN` time | `{ "success": false, "error": { "message": "Token expired" } }` | 401 |
| **Malformed Token** | Send `Bearer invalid-token` | `{ "success": false, "error": { "message": "Invalid token" } }` | 401 |
| **Wrong Signature** | Token signed with different secret | `{ "success": false, "error": { "message": "Invalid token signature" } }` | 401 |

### Endpoint Testing Tables

#### `/api/health` - Health Check

| Method | Auth Required | Description |
|--------|---------------|-------------|
| GET | No | Check API and database status |

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "database": "connected"
  }
}
```

**Test Cases:**
- Service is running and responsive
- Database connection status is accurate
- Response time < 200ms

---

#### `/api/optimize` - Prompt Optimization

| Method | Auth Required | Description |
|--------|---------------|-------------|
| POST | Yes | Optimize a user prompt using Gemini API |

**Request Body:**
```json
{
  "prompt": "Write a poem"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "original": "Write a poem",
    "optimized": "Compose an evocative poem that explores themes of nature...",
    "explanation": "The optimized prompt provides more specific guidance..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Test Cases:**

| Scenario | Request Body | Expected Status | Expected Response |
|----------|--------------|-----------------|-------------------|
| **Valid Prompt** | `{ "prompt": "Write a story" }` | 200 | Returns optimized prompt and explanation |
| **Empty Prompt** | `{ "prompt": "" }` | 400 | `{ "error": { "message": "Prompt is required" } }` |
| **Missing Prompt Field** | `{}` | 400 | `{ "error": { "message": "Prompt is required" } }` |
| **Very Long Prompt** | `{ "prompt": "<10000 chars>" }` | 400 or 200* | Handles gracefully or optimizes (*depends on impl) |
| **Special Characters** | `{ "prompt": "<>&\"'🚀" }` | 200 | Characters preserved in response |
| **Quota Exhausted** | Valid request at 10/10 usage (free) | 429 | `{ "error": { "message": "Daily quota exceeded" } }` |
| **No Auth Token** | Valid request, no Authorization | 401 | `{ "error": { "message": "Authentication required" } }` |
| **Gemini API Failure** | Valid request, Gemini down | 500 | `{ "error": { "message": "Optimization service unavailable" } }` |

---

#### `/api/history` - Prompt History

| Method | Auth Required | Description |
|--------|---------------|-------------|
| GET | Yes | Retrieve user's saved prompts |

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "64a1b2c3d4e5f6g7h8i9",
        "original": "Write a poem",
        "optimized": "Compose an evocative poem...",
        "tags": ["creative", "poetry"],
        "favorite": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

**Test Cases:**

| Scenario | Setup | Expected Status | Expected Response |
|----------|-------|-----------------|-------------------|
| **User with Prompts** | User has saved prompts | 200 | Returns array of prompts |
| **Empty History** | New user with no prompts | 200 | `{ "prompts": [], "total": 0 }` |
| **No Auth Token** | Missing Authorization header | 401 | `{ "error": { "message": "Authentication required" } }` |
| **Pagination** | Query params `?limit=10&offset=0` | 200 | Returns paginated results |

---

#### `/api/usage` - Usage Statistics

| Method | Auth Required | Description |
|--------|---------------|-------------|
| GET | Yes | Get current usage stats and plan limits |

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "plan": "free",
    "usageCount": 5,
    "limit": 10,
    "remaining": 5,
    "lastResetAt": "2024-01-01T00:00:00.000Z",
    "nextResetAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Test Cases:**

| Scenario | User Plan | Usage Count | Expected Status | Expected Response |
|----------|-----------|-------------|-----------------|-------------------|
| **Free User - Under Limit** | free | 5 | 200 | `{ "plan": "free", "usageCount": 5, "limit": 10, "remaining": 5 }` |
| **Free User - At Limit** | free | 10 | 200 | `{ "plan": "free", "usageCount": 10, "limit": 10, "remaining": 0 }` |
| **Pro User** | pro | 50 | 200 | `{ "plan": "pro", "usageCount": 50, "limit": -1, "remaining": -1 }` (unlimited) |
| **No Auth Token** | - | - | 401 | `{ "error": { "message": "Authentication required" } }` |

---

#### `/api/billing/checkout` - Create Checkout Session

| Method | Auth Required | Description |
|--------|---------------|-------------|
| POST | Yes | Create Stripe checkout session for Pro upgrade |

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/c/pay/..."
  }
}
```

**Test Cases:**

| Scenario | User Plan | Expected Status | Expected Response |
|----------|-----------|-----------------|-------------------|
| **Free User Upgrade** | free | 200 | Returns sessionId and checkout URL |
| **Pro User Attempt** | pro | 400 | `{ "error": { "message": "Already subscribed to Pro" } }` |
| **No Auth Token** | - | 401 | `{ "error": { "message": "Authentication required" } }` |
| **Stripe API Failure** | free | 500 | `{ "error": { "message": "Failed to create checkout session" } }` |

---

#### `/api/upgrade` - Stripe Webhook

| Method | Auth Required | Description |
|--------|---------------|-------------|
| POST | No (Stripe signature) | Handle Stripe webhook events |

**Webhook Events Handled:**

| Event | Action | Expected Result |
|-------|--------|-----------------|
| `checkout.session.completed` | Upgrade user to Pro | User plan set to "pro", subscription ID stored, usage reset to 0 |
| `customer.subscription.deleted` | Downgrade user to Free | User plan set to "free", subscription ID cleared |
| `invoice.payment_failed` | Log failure | Event logged, no user changes (monitoring alert) |

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "received": true
  }
}
```

**Test Cases:**

| Scenario | Setup | Expected Status | Expected Behavior |
|----------|-------|-----------------|-------------------|
| **Valid Subscription Activated** | Send `subscription.activated` with valid signature | 200 | User upgraded to Pro, subscription ID saved |
| **Valid Subscription Cancelled** | Send `subscription.cancelled` with valid signature | 200 | User downgraded to Free |
| **Missing Signature** | Omit `x-razorpay-signature` header | 400 | `{ "error": { "message": "Missing signature" } }` |
| **Invalid Signature** | Send incorrect signature | 400 | `{ "error": { "message": "Invalid signature" } }` |
| **Duplicate Event** | Send same event twice (same event ID) | 200 | Idempotent - no duplicate processing |
| **Unknown Event** | Send unsupported event type | 200 | Event ignored, no error |

**Triggering Razorpay Test Events:**

```bash
# With Razorpay Dashboard
# Go to Settings → Webhooks → [Your Webhook] → Send Test Webhook
# Select event type: subscription.activated, subscription.cancelled, or payment.failed
```

---

### Rate Limiting Scenarios

| Scenario | Setup | Expected Status | Expected Response |
|----------|-------|-----------------|-------------------|
| **Under Limit** | < 100 requests in 15 min | 200 | Normal operation |
| **At Limit** | 100th request in 15 min | 200 | Last successful request |
| **Over Limit** | 101st request in 15 min | 429 | `{ "error": { "message": "Too many requests" } }` |
| **After Window** | Wait 15 min, retry | 200 | Limit reset, normal operation |

---

### Quota Exhaustion Testing

Test quota enforcement on `/api/optimize`:

```bash
# Test free user quota (10 requests/day)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/optimize \
    -H "Authorization: Bearer $FREE_USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Test prompt '$i'"}'
done

# Expected: First 10 succeed (200), 11th fails (429)
```

---

### Expected HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, POST requests |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request body, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit or quota exceeded |
| 500 | Internal Server Error | Unexpected server error, external API failure |
| 503 | Service Unavailable | Database connection lost, service down |

---

## Automated Test Coverage

### Backend Jest Suite

**Location:** `backend/src/__tests__/`

**Coverage Areas:**
- Unit tests for controllers, services, and middleware
- Integration tests for API endpoints with MongoDB Memory Server
- Supertest for HTTP endpoint testing
- Mock Stripe API calls

**Running Tests:**
```bash
# Run all backend tests
npm run test --workspace=backend

# Watch mode
npm run test:watch --workspace=backend

# With coverage
npm run test:coverage --workspace=backend
```

**Key Test Files:**
- `auth.middleware.test.ts` - Authentication scenarios
- `optimize.controller.test.ts` - Prompt optimization logic
- `billing.controller.test.ts` - Stripe checkout flow
- `webhook.controller.test.ts` - Stripe webhook handling
- `usage.service.test.ts` - Quota tracking and reset logic

**Expected Pass Rate:** 100% (all tests passing)

---

### Extension Jest Suite

**Location:** `extension/src/__tests__/`

**Coverage Areas:**
- React component tests with Testing Library
- Utility function tests
- Mock Chrome APIs (storage, runtime)
- Modal and button interaction tests

**Running Tests:**
```bash
# Run all extension tests
npm run test --workspace=extension

# Watch mode
npm run test:watch --workspace=extension
```

**Key Test Files:**
- `Modal.test.tsx` - Modal component rendering and interactions
- `Button.test.tsx` - Button positioning and click handling
- `api.test.ts` - API client with auth token
- `storage.test.ts` - Chrome storage wrapper

**Expected Pass Rate:** 100%

---

### Dashboard Jest Suite

**Location:** `web/src/__tests__/`

**Coverage Areas:**
- React component unit tests
- Page component tests
- Custom hooks tests
- API service mocks

**Running Tests:**
```bash
# Run all web tests
npm run test --workspace=web

# Watch mode
npm run test:watch --workspace=web
```

**Key Test Files:**
- `Dashboard.test.tsx` - Dashboard page rendering
- `UsageTracker.test.tsx` - Usage display and refresh
- `PromptCard.test.tsx` - Prompt card actions
- `useAuth.test.ts` - Authentication hook

**Expected Pass Rate:** 100%

---

### Dashboard Playwright Suite

**Location:** `web/tests/e2e/`

**Coverage Areas:**
- End-to-end user flows
- Authentication and authorization
- Stripe checkout flow (test mode)
- Responsive design across viewports
- Multi-page navigation

**Running Tests:**
```bash
# Run all E2E tests
npm run test:e2e --workspace=web

# Run specific test file
npx playwright test web/tests/e2e/auth.spec.ts --project=chromium

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui
```

**Key Test Files:**
- `auth.spec.ts` - Sign in/out flows
- `dashboard.spec.ts` - Dashboard interactions
- `upgrade.spec.ts` - Stripe checkout flow
- `settings.spec.ts` - Settings page

**Artifacts Generated:**
- Screenshots on failure: `web/test-results/`
- Trace files: `web/test-results/trace.zip`
- HTML report: `playwright-report/index.html`

**Expected Pass Rate:** 100%

---

## Manual Verification Checklists

### Extension Manual Testing

**Reference:** See [extension/TESTING.md](../extension/TESTING.md) for detailed checklist.

**Summary:**
- [ ] Textarea detection on ChatGPT and Gemini
- [ ] Button positioning and scroll behavior
- [ ] Modal interactions (replace, copy, save)
- [ ] Error handling (empty prompt, missing token, rate limit, network errors)
- [ ] Multi-tab testing
- [ ] Memory and cleanup verification
- [ ] Edge cases (long prompts, special characters, rapid clicks)
- [ ] Console log verification (no errors)
- [ ] Accessibility (keyboard navigation)
- [ ] Cross-browser (Chrome, Edge)

**Sign-off Required:** QA Engineer + Frontend Developer (Extension)

---

### Dashboard Manual Testing

**Reference:** See [web/MANUAL_QA.md](../web/MANUAL_QA.md) for detailed checklist.

**Summary:**
- [ ] Authentication flow (sign in with Google)
- [ ] Dashboard page (prompt history, search, filters)
- [ ] Prompt actions (copy, favorite, share, delete)
- [ ] Usage tracker display and refresh
- [ ] Pricing page content
- [ ] Upgrade flow (Stripe checkout)
- [ ] Settings page (account info, subscription management)
- [ ] Navigation (navbar, routing)
- [ ] Error handling (API errors, rate limiting, network errors)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Edge cases (empty states, long content, special characters, quota scenarios)
- [ ] Performance (load times, large datasets)

**Sign-off Required:** QA Engineer + Frontend Developer (Dashboard)

---

## Integration Flow Testing

### Flow 1: Optimize → Save → Dashboard View

**Objective:** Verify end-to-end flow from extension to dashboard.

**Steps:**
1. **Extension:**
   - Navigate to ChatGPT (https://chat.openai.com)
   - Enter prompt: "Write a blog post about AI"
   - Click "✨ Optimize with PromptLens" button
   - Wait for optimization result
   - Click "Save" button
   - **Expected:** Button shows "✓ Saved"

2. **Backend Verification:**
   - Check backend logs for POST request to `/api/optimize`
   - Verify 200 response
   - Check database for new prompt entry

3. **Dashboard:**
   - Navigate to dashboard (http://localhost:3001/dashboard)
   - **Expected:** New prompt appears in history
   - Verify prompt shows correct original and optimized text
   - Verify timestamp is recent

**Pass Criteria:**
- ✅ Prompt saved successfully from extension
- ✅ Backend processes and stores data
- ✅ Dashboard displays saved prompt immediately (or after refresh)

---

### Flow 2: Quota Sync Across Sessions

**Objective:** Verify quota tracking is consistent across extension and dashboard.

**Steps:**
1. **Dashboard:**
   - Navigate to dashboard
   - Note current usage count (e.g., 3/10)

2. **Extension:**
   - Optimize 2 prompts successfully
   - **Expected:** Each request increments usage count

3. **Dashboard:**
   - Refresh usage tracker (click refresh button)
   - **Expected:** Usage count increased to 5/10

4. **Extension:**
   - Make 5 more optimization requests (total 7, now at 10/10)
   - Attempt 11th optimization
   - **Expected:** 429 error, "Daily quota exceeded" message

5. **Dashboard:**
   - Refresh page
   - **Expected:** Usage tracker shows 10/10 (red progress bar)
   - **Expected:** "Daily limit reached" message visible

**Pass Criteria:**
- ✅ Usage count accurately tracked across extension and dashboard
- ✅ Quota enforcement prevents requests beyond limit
- ✅ UI reflects quota status in real-time

---

### Flow 3: Multi-Session Testing

**Objective:** Verify behavior with multiple browser sessions/users.

**Steps:**
1. **Session 1 (Free User):**
   - Sign in as free@test.com
   - Make 5 optimization requests
   - Note usage: 5/10

2. **Session 2 (Pro User):**
   - Sign in as pro@test.com (in incognito/different browser)
   - Make 20 optimization requests
   - **Expected:** All succeed (unlimited quota)
   - Note usage: 20/unlimited

3. **Session 1:**
   - Refresh dashboard
   - **Expected:** Still shows 5/10 (not affected by Session 2)

4. **Session 1:**
   - Make 5 more requests (total 10)
   - Attempt 11th request
   - **Expected:** 429 error (quota enforced per user)

5. **Session 2:**
   - Continue making requests
   - **Expected:** No limit, all requests succeed

**Pass Criteria:**
- ✅ Quota tracked separately per user
- ✅ Pro users have unlimited access
- ✅ Free users hit daily limit at 10 requests
- ✅ No cross-user interference

---

### Flow 4: Stripe Upgrade Flow

**Objective:** Test complete upgrade journey from free to pro.

**Steps:**
1. **Dashboard (Free User):**
   - Sign in as free user
   - Note plan: "FREE", limit: 10/day
   - Navigate to /pricing
   - Click "Upgrade to Pro" button

2. **Stripe Checkout:**
   - Verify redirect to Stripe Checkout
   - Use test card: 4242 4242 4242 4242
   - Complete payment
   - **Expected:** Redirect back to application

3. **Webhook Processing:**
   - Verify Stripe CLI logs `checkout.session.completed` event
   - Check backend logs for webhook processing
   - **Expected:** User upgraded to "pro" in database

4. **Dashboard (Post-Upgrade):**
   - Navigate to /dashboard
   - **Expected:** Success banner: "Welcome to Pro!"
   - **Expected:** Usage tracker shows "PRO" plan
   - **Expected:** Unlimited quota displayed

5. **Extension Verification:**
   - Make 20+ optimization requests
   - **Expected:** All succeed without quota error

6. **Settings Page:**
   - Navigate to /settings
   - **Expected:** Plan shows "PRO"
   - **Expected:** "Manage Subscription" button visible
   - Click "Manage Subscription"
   - **Expected:** Redirect to Stripe Customer Portal

**Pass Criteria:**
- ✅ Checkout flow completes successfully
- ✅ Webhook processes and upgrades user
- ✅ Dashboard reflects Pro status immediately
- ✅ Extension respects unlimited quota
- ✅ Customer portal accessible for subscription management

---

## Sign-Off Checklist

### Pre-Release Validation

Before deploying Phase 1 to production, complete the following:

#### Automated Tests
- [ ] Backend Jest suite: 100% passing
- [ ] Extension Jest suite: 100% passing
- [ ] Dashboard Jest suite: 100% passing
- [ ] Playwright E2E suite: 100% passing
- [ ] Postman/Newman collection: All requests successful (excluding live Stripe calls)

#### Manual Testing
- [ ] Extension manual checklist completed ([extension/TESTING.md](../extension/TESTING.md))
- [ ] Dashboard manual checklist completed ([web/MANUAL_QA.md](../web/MANUAL_QA.md))
- [ ] All integration flows tested and passing
- [ ] Cross-browser testing completed (Chrome, Edge, Firefox, Safari)
- [ ] Responsive design verified (mobile, tablet, desktop)

#### Console Log Review
- [ ] No error messages in browser console during normal operation
- [ ] No "Failed to load resource" errors
- [ ] Extension logs are clean and informative
- [ ] Dashboard logs are clean (no React warnings)
- [ ] Backend logs show no unexpected errors

#### Memory Checks
- [ ] Extension memory usage stable over 30-minute session
- [ ] No memory leaks in extension (heap snapshots reviewed)
- [ ] Dashboard memory usage acceptable (< 100MB typical)
- [ ] Backend memory usage stable under load

#### Regression Confirmation
- [ ] All previously working features still function correctly
- [ ] No broken links or navigation issues
- [ ] Environment variables properly configured
- [ ] API endpoints respond within acceptable times (< 2s)
- [ ] Database queries optimized (no N+1 issues)

#### Security Verification
- [ ] Authentication required on all protected endpoints
- [ ] CORS properly configured (allowed origins only)
- [ ] Rate limiting active and tested
- [ ] Stripe webhook signature validation working
- [ ] JWT tokens expire correctly
- [ ] No sensitive data exposed in client-side code or logs

#### Stripe Integration
- [ ] Test checkout flow completes successfully
- [ ] Webhook events processed correctly (checkout, subscription deleted, payment failed)
- [ ] Idempotency prevents duplicate event processing
- [ ] Customer portal accessible and functional
- [ ] Test cards work as expected (success: 4242..., decline: 0002...)

#### Documentation
- [ ] This testing plan reviewed and followed
- [ ] API documentation accurate (backend/README.md)
- [ ] Environment setup documented and tested
- [ ] Troubleshooting guides updated
- [ ] Known issues documented (if any)

---

### Final Sign-Off

**QA Engineer:**
- Name: _______________________
- Date: _______________________
- Status: [ ] APPROVED [ ] REJECTED
- Notes: _______________________

**Backend Developer:**
- Name: _______________________
- Date: _______________________
- Status: [ ] APPROVED [ ] REJECTED
- Notes: _______________________

**Frontend Developer (Extension):**
- Name: _______________________
- Date: _______________________
- Status: [ ] APPROVED [ ] REJECTED
- Notes: _______________________

**Frontend Developer (Dashboard):**
- Name: _______________________
- Date: _______________________
- Status: [ ] APPROVED [ ] REJECTED
- Notes: _______________________

**Project Lead:**
- Name: _______________________
- Date: _______________________
- Status: [ ] APPROVED FOR RELEASE [ ] NEEDS REVISION
- Notes: _______________________

---

## Additional Resources

- [Backend API Documentation](../backend/README.md)
- [Extension Manual Testing Guide](../extension/TESTING.md)
- [Dashboard Manual QA Plan](../web/MANUAL_QA.md)
- [Postman Collection](../tests/postman/README.md)
- [Project Structure](../STRUCTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [CI/CD Pipeline](.github/workflows/phase1-ci.yml)

---

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Verify all environment variables are set
- Ensure port 3000 is not in use

**Extension not detecting textarea:**
- Verify extension is loaded and enabled
- Check browser console for content script logs
- Ensure VITE_API_BASE_URL is correct

**Stripe webhook not working:**
- Verify Stripe CLI is running: `stripe listen`
- Check STRIPE_WEBHOOK_SECRET matches CLI output
- Ensure backend is accessible at forwarded URL

**Tests failing:**
- Clear node_modules and reinstall: `npm clean-install`
- Check environment variables are set for test environment
- Review test logs for specific error messages
- Ensure MongoDB Memory Server version matches (7.0.0)

**Quota not resetting:**
- Check backend job scheduler is running
- Verify lastResetAt and nextResetAt timestamps
- Manually trigger reset via database or API (for testing)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-01 | Initial | Phase 1 testing plan created |

