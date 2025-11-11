# Backend API

Express.js backend service built with TypeScript, featuring MongoDB connectivity, authentication, and comprehensive middleware support.

## Features

- ✅ TypeScript with strict type checking
- ✅ Express.js server with hot reload (ts-node-dev)
- ✅ MongoDB with Mongoose (retry logic and graceful shutdown)
- ✅ CORS configured for dashboard and extension origins
- ✅ Centralized error handling
- ✅ Request logging (Morgan)
- ✅ Rate limiting
- ✅ Authentication middleware (stub implementation)
- ✅ Environment variable validation with Zod
- ✅ Jest testing infrastructure
- ✅ ESLint and Prettier configuration

## Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0
- MongoDB instance (optional for development)

## Installation

From the root of the monorepo:

```bash
npm install
```

Or from the backend directory:

```bash
cd backend
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Server Configuration
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development | production | test)

### Database Configuration
- `MONGODB_URI` - MongoDB connection string (optional, will skip if not provided)

### API Keys
- `GEMINI_API_KEY` - Gemini API key (for AI features)

### Razorpay Configuration
- `RAZORPAY_KEY_ID` - Razorpay key ID (get from Razorpay Dashboard)
- `RAZORPAY_KEY_SECRET` - Razorpay key secret (get from Razorpay Dashboard)
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret (get from webhook configuration)
- `RAZORPAY_PRO_MONTHLY_PLAN_ID` - Razorpay plan ID for Pro Monthly subscription
- `RAZORPAY_PRO_YEARLY_PLAN_ID` - Razorpay plan ID for Pro Yearly subscription

### Authentication
- `NEXTAUTH_URL` - NextAuth URL (for web dashboard)
- `NEXTAUTH_SECRET` - NextAuth secret (used to decrypt NextAuth JWE tokens from the dashboard - must match web app's NEXTAUTH_SECRET)
- `JWT_SECRET` - JWT signing secret for standard JWT tokens (default provided for development)
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)

### CORS Configuration
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (supports wildcard for chrome-extension://*)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window (default: 100)

## Razorpay Setup

### Prerequisites
1. Create a Razorpay account at https://razorpay.com
2. Get your API keys from the Razorpay Dashboard (Settings > API Keys)
3. Create subscription plans in the Razorpay Dashboard

### Setting up Razorpay for Development

#### 1. Configure Environment Variables
Add your Razorpay keys to `.env`:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_...
RAZORPAY_PRO_YEARLY_PLAN_ID=plan_...
```

#### 2. Create Subscription Plans
1. Go to Razorpay Dashboard > Subscriptions > Plans
2. Create a new plan for Pro Monthly:
   - Name: "Pro Monthly"
   - Amount: 99900 (₹999.00 - adjust as needed)
   - Period: monthly
   - Copy the Plan ID to `RAZORPAY_PRO_MONTHLY_PLAN_ID`
3. Create another plan for Pro Yearly:
   - Name: "Pro Yearly" 
   - Amount: 999900 (₹9,999.00 - adjust as needed)
   - Period: yearly
   - Copy the Plan ID to `RAZORPAY_PRO_YEARLY_PLAN_ID`

#### 3. Setup Webhook for Local Development
Use the Razorpay CLI to forward webhooks to your local server:

```bash
# Install Razorpay CLI
npm install -g razorpay-cli

# Login to Razorpay
razorpay login

# Forward webhooks to local server
razorpay listen --forward-to http://localhost:5000/api/billing/webhook
```

The CLI will output your webhook signing secret. Add it to `.env`:

```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### 4. Production Webhook Setup
For production, configure a webhook endpoint in the Razorpay Dashboard:

1. Go to Razorpay Dashboard > Settings > Webhooks
2. Click "Add Webhook"
3. Set URL to: `https://your-domain.com/api/billing/webhook`
4. Select the following events to listen for:
   - `subscription.activated`
   - `subscription.cancelled`
   - `payment.failed`
5. Copy the webhook signing secret and add to your production environment

### Plan Details and Quotas

The application offers three subscription tiers:

| Plan | Daily Requests | Price | Features |
|------|----------------|-------|----------|
| Free | 4 requests/day | Free | Basic prompt optimization |
| Pro Monthly | 50 requests/day | ₹999/month | Increased quota, priority support |
| Pro Yearly | Unlimited requests | ₹9,999/year | Unlimited usage, all features |

**Quota Behavior:**
- Quotas reset every 24 hours from the last request
- When limit is reached, users get a clear error message with reset time
- Upgrading to a paid plan immediately resets usage count to 0
- Downgrading to free preserves current usage until next reset

### Testing Razorpay Integration

#### Test Checkout Flow
```bash
# Make sure server is running
npm run dev

# Create checkout session (requires authentication)
curl -X POST http://localhost:5000/api/billing/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro_monthly"}'
```

The response will include subscription details for the frontend to process.

#### Test Payment
Use Razorpay's test mode with test cards:
- Success: Any valid card number (e.g., 4111 1111 1111 1111)
- Use any future expiry date and any 3-digit CVV

### Webhook Events Handled

The backend handles the following Razorpay webhook events:

1. **subscription.activated**
   - Triggered when a subscription is successfully created
   - Updates user plan to "pro_monthly" or "pro_yearly"
   - Stores subscription ID and current period end
   - Resets usage count to 0

2. **subscription.cancelled**
   - Triggered when a subscription is canceled or expires
   - Downgrades user plan to "free"

3. **payment.failed**
   - Triggered when a subscription payment fails
   - Logged for monitoring (future: send notification emails)

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on the configured PORT (default: 5000) and will be available at:
- Health check: http://localhost:5000/api/health

## Building

Build the TypeScript code to JavaScript:

```bash
npm run build
```

Output will be in the `dist/` directory.

## Production

Run the production server:

```bash
npm run start
```

Make sure to build first and set `NODE_ENV=production`.

## Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Code Quality

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (env, database)
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── __tests__/       # Test files
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## API Endpoints

### Health Check
- `GET /api/health` - Returns server health status and database connection status

### Billing (Razorpay Integration)
- `POST /api/billing/checkout` - Create Razorpay subscription for Pro upgrade (requires authentication)
  - Request: `{ plan: 'pro_monthly' | 'pro_yearly' }`
  - Returns: `{ subscriptionId, razorpayKeyId, plan, planName }`
- `POST /api/billing/verify` - Verify Razorpay payment after completion (requires authentication)
  - Request: `{ paymentId, orderId, signature, subscriptionId }`
  - Returns: `{ success: true, message: 'Payment verified successfully', plan }`
- `POST /api/billing/webhook` - Razorpay webhook endpoint for subscription events
  - Handles: subscription activation, cancellation, payment failures
  - Validates Razorpay signature for security
  - Implements idempotency to prevent duplicate event processing
- `GET /api/billing/status` - Get current billing status (requires authentication)
  - Returns: `{ plan, planName, subscriptionId, subscriptionStatus, subscriptionCurrentPeriodEnd, isConfigured }`

### Usage & Quotas
- `GET /api/usage` - Get current user's usage stats and plan limits (requires authentication)
  - Returns: `{ plan, usageCount, limit, remaining, lastResetAt, nextResetAt }`
  - Automatically reflects plan changes in real-time

### Example Routes (for testing middleware)
- `GET /api/example/public` - Public route demonstrating response wrapper
- `GET /api/example/protected` - Protected route demonstrating auth middleware (requires Authorization header)
- `GET /api/example/error` - Example route demonstrating error handling

## Middleware

### Authentication
- `requireAuth` - Requires valid authentication token (supports NextAuth JWE tokens and standard JWT tokens)
- `optionalAuth` - Optionally validates authentication token (supports NextAuth JWE tokens and standard JWT tokens)

### Rate Limiting
- `apiLimiter` - General API rate limiting (100 requests per 15 minutes)
- `strictLimiter` - Strict rate limiting (10 requests per 15 minutes)

### Error Handling
- Centralized error handler with standardized JSON responses
- Development mode includes detailed error information
- Production mode returns sanitized error messages

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database

MongoDB connection includes:
- Automatic retry with exponential backoff (5 attempts)
- Connection timeout handling
- Graceful shutdown on server termination
- Connection state monitoring

If `MONGODB_URI` is not set, the server will start without database connectivity (useful for development).

## Graceful Shutdown

The server handles graceful shutdown on:
- SIGTERM
- SIGINT (Ctrl+C)
- Uncaught exceptions
- Unhandled promise rejections

Shutdown process:
1. Stop accepting new requests
2. Close existing connections
3. Disconnect from MongoDB
4. Exit process

## TODO

The following features have stub implementations and need to be completed:

- [x] Authentication middleware (`requireAuth` and `optionalAuth`) - Supports NextAuth JWE and standard JWT tokens
- [x] JWT token verification - Supports both NextAuth JWE tokens (from dashboard) and standard JWT tokens
- [x] User models and authentication service
- [ ] API endpoints for Phase 1 features

## License

MIT
