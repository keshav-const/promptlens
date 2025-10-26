# Backend Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Testing the API

Once the server is running, you can test the endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Public endpoint
curl http://localhost:3000/api/example/public

# Protected endpoint (requires auth)
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/example/protected

# Error example
curl http://localhost:3000/api/example/error
```

## Creating New Endpoints

### 1. Create a Controller

```typescript
// src/controllers/myfeature.controller.ts
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMyFeature = (req: Request, res: Response) => {
  const data = { message: 'Hello from my feature' };
  sendSuccess(res, data);
};
```

### 2. Create Routes

```typescript
// src/routes/myfeature.routes.ts
import { Router } from 'express';
import { getMyFeature } from '../controllers/myfeature.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, getMyFeature);

export default router;
```

### 3. Register Routes

```typescript
// src/routes/index.ts
import myFeatureRoutes from './myfeature.routes.js';

router.use('/myfeature', myFeatureRoutes);
```

## Error Handling

### Throwing Errors

```typescript
import { AppError } from '../middlewares/errorHandler.js';

throw new AppError('Resource not found', 404, 'NOT_FOUND');
```

### Async Handlers

For async route handlers, wrap with `asyncHandler`:

```typescript
import { asyncHandler } from '../utils/asyncHandler.js';

router.get('/', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  sendSuccess(res, data);
}));
```

## Database Models

Create Mongoose models in `src/models/`:

```typescript
// src/models/user.model.ts
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
```

## Middleware

### Available Middleware

- `requireAuth` - Requires authentication (stub - needs implementation)
- `optionalAuth` - Optional authentication
- `apiLimiter` - Rate limiting (100 requests per 15 min)
- `strictLimiter` - Strict rate limiting (10 requests per 15 min)

### Creating Custom Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler.js';

export const myMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['x-custom-header']) {
    throw new AppError('Missing custom header', 400);
  }
  next();
};
```

## Testing

### Writing Tests

```typescript
import request from 'supertest';
import { createApp } from '../app.js';

describe('My Feature', () => {
  const app = createApp();

  it('should return success', async () => {
    const response = await request(app).get('/api/myfeature');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- health.test.ts
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - development | production | test
- `MONGODB_URI` - MongoDB connection string (optional)
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

## Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format
```

## Deployment

```bash
# Build production bundle
npm run build

# Start production server (after building)
npm start
```

Make sure to set `NODE_ENV=production` in your production environment.

## Troubleshooting

### MongoDB Connection Issues

If MongoDB fails to connect:
1. Check `MONGODB_URI` is set correctly
2. Verify MongoDB is running
3. Check network connectivity
4. Review connection logs for retry attempts

The server will start without MongoDB if `MONGODB_URI` is not set.

### Port Already in Use

If port 3000 is busy, set a different port:
```bash
PORT=3001 npm run dev
```

### ESM Import Issues

Always use `.js` extensions in imports:
```typescript
import { something } from './file.js';  // ✓ Correct
import { something } from './file';     // ✗ Wrong
```

## Next Steps

1. Implement JWT authentication in `src/middlewares/auth.ts`
2. Create user models and authentication service
3. Add Phase 1 API endpoints
4. Integrate with Gemini API
5. Set up Stripe webhooks
