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
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development | production | test)

### Database Configuration
- `MONGODB_URI` - MongoDB connection string (optional, will skip if not provided)

### API Keys
- `GEMINI_API_KEY` - Gemini API key (for AI features)

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

### Authentication
- `NEXTAUTH_URL` - NextAuth URL (for web dashboard)
- `NEXTAUTH_SECRET` - NextAuth secret
- `JWT_SECRET` - JWT signing secret (default provided for development)
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)

### CORS Configuration
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (supports wildcard for chrome-extension://*)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window (default: 100)

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on the configured PORT (default: 3000) and will be available at:
- Health check: http://localhost:3000/api/health

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

### Example Routes (for testing middleware)
- `GET /api/example/public` - Public route demonstrating response wrapper
- `GET /api/example/protected` - Protected route demonstrating auth middleware (requires Authorization header)
- `GET /api/example/error` - Example route demonstrating error handling

## Middleware

### Authentication
- `requireAuth` - Requires valid authentication token (stub implementation)
- `optionalAuth` - Optionally validates authentication token

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

- [ ] Authentication middleware (`requireAuth` and `optionalAuth`) - Currently returns placeholder user data
- [ ] JWT token verification
- [ ] User models and authentication service
- [ ] API endpoints for Phase 1 features

## License

MIT
