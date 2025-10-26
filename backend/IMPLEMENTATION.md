# Backend Prompt APIs Implementation

This document describes the implementation of the core backend functionality for prompt optimization, quota enforcement, and usage tracking.

## Overview

The implementation provides three main API endpoints:
- `/api/optimize` - Optimize prompts using Gemini 1.5 Pro API
- `/api/history` - Retrieve paginated prompt history with filters
- `/api/usage` - Get current usage statistics and quota information

## Architecture

### Models

#### User Model (`src/models/User.ts`)
```typescript
{
  email: string;           // Unique, indexed
  displayName?: string;    // Optional display name
  plan: 'free' | 'pro';   // User plan type
  usageCount: number;      // Current daily usage count
  lastResetAt: Date;       // Last usage reset timestamp
  stripeCustomerId?: string; // For payment integration
  timestamps: true;        // Auto-managed createdAt/updatedAt
}
```

#### Prompt Model (`src/models/Prompt.ts`)
```typescript
{
  userId: ObjectId;        // Reference to User
  original: string;        // Original prompt text
  optimized: string;       // Optimized version from Gemini
  explanation: string;     // Explanation of improvements
  metadata?: {
    tags?: string[];       // User-defined tags
    source?: string;       // Source of the prompt
  };
  timestamps: true;        // Auto-managed createdAt/updatedAt
}
```

### Authentication Middleware (`src/middlewares/auth.ts`)

Verifies JWT tokens issued by NextAuth or extension:
- Validates HMAC-SHA256 signature using `NEXTAUTH_SECRET`
- Checks token expiration
- Auto-provisions user records on first valid request
- Attaches user context to request object

**Implementation Details:**
- Uses Web Crypto API for signature verification
- Supports both NextAuth JWTs and extension tokens
- Graceful handling of optional authentication

### Quota Middleware (`src/middlewares/quota.ts`)

Enforces daily usage limits:
- Resets usage count if `lastResetAt` > 24 hours
- Free plan: 4 requests/day
- Pro plan: 20 requests/day
- Returns HTTP 429 with detailed error on quota exceeded

**Response on quota exceeded:**
```json
{
  "success": false,
  "error": {
    "message": "Daily quota exceeded. You have used 4/4 requests...",
    "code": "QUOTA_EXCEEDED",
    "details": {
      "usageCount": 4,
      "limit": 4,
      "plan": "free",
      "resetAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

### Services

#### Gemini Service (`src/services/gemini.service.ts`)

Handles communication with Google Gemini 1.5 Pro API:
- Automatic retry with exponential backoff (3 attempts)
- Structured prompt for consistent optimization results
- JSON response parsing with validation
- Error handling for API failures

**Configuration:**
- Temperature: 0.7
- Top-K: 40
- Top-P: 0.95
- Max Output Tokens: 1024

#### User Service (`src/services/user.service.ts`)

User management operations:
- `findOrCreateUser()` - Auto-provision users
- `incrementUsage()` - Track API usage
- `resetUsageIfNeeded()` - Handle 24-hour reset logic
- `getUsageLimit()` - Get plan-based limits

#### Prompt Service (`src/services/prompt.service.ts`)

Prompt history management:
- `createPrompt()` - Save optimized prompts
- `getHistory()` - Paginated retrieval with filters
  - Filter by tags
  - Filter by date range
  - Sort by newest first
  - Pagination support (max 100 per page)

## API Endpoints

### POST /api/optimize

Optimize a prompt using Gemini API.

**Request:**
```json
{
  "prompt": "Write a story about a cat",
  "metadata": {
    "tags": ["creative", "story"],
    "source": "dashboard"
  },
  "save": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "Write a story about a cat",
    "optimized": "Write a compelling short story...",
    "explanation": "The prompt has been improved by...",
    "usage": {
      "count": 1,
      "limit": 4,
      "remaining": 3,
      "resetAt": "2024-01-02T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Validation:**
- `prompt`: Required, 1-5000 characters
- `metadata.tags`: Optional array of strings
- `metadata.source`: Optional string
- `save`: Optional boolean (default: true)

**Middleware Chain:**
1. `requireAuth` - Verify JWT token
2. `checkQuota` - Enforce usage limits
3. Controller logic

### GET /api/history

Retrieve saved prompt history.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (1-100, default: 10)
- `tags`: Comma-separated tag filter
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "...",
        "userId": "...",
        "original": "...",
        "optimized": "...",
        "explanation": "...",
        "metadata": { "tags": [...] },
        "createdAt": "2024-01-01T12:00:00.000Z",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/usage

Get current usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "free",
    "usageCount": 2,
    "limit": 4,
    "remaining": 2,
    "lastResetAt": "2024-01-01T00:00:00.000Z",
    "nextResetAt": "2024-01-02T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

### Test Coverage

All endpoints and features are covered by comprehensive tests:

1. **Auth Tests** (`src/__tests__/auth.test.ts`)
   - Token validation
   - User auto-provisioning
   - Invalid token handling
   - Expired token handling

2. **Quota Tests** (`src/__tests__/quota.test.ts`)
   - Free plan limits (4/day)
   - Pro plan limits (20/day)
   - 24-hour reset logic
   - Pre-reset behavior

3. **Optimize Tests** (`src/__tests__/optimize.test.ts`)
   - Successful optimization
   - Save/no-save functionality
   - Input validation
   - Usage tracking
   - Gemini API failure handling

4. **History Tests** (`src/__tests__/history.test.ts`)
   - Pagination
   - Tag filtering
   - Date range filtering
   - User isolation

5. **Usage Tests** (`src/__tests__/usage.test.ts`)
   - Usage statistics
   - Plan-based limits
   - Reset logic
   - Auto-provisioning

### Test Infrastructure

- **In-Memory MongoDB**: Uses `mongodb-memory-server` for isolated testing
- **Mocked Services**: Gemini API is mocked to avoid external dependencies
- **Test Helpers**: JWT token generation, mock responses
- **Global Setup**: Database initialization and cleanup

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
```

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {...}
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `INVALID_TOKEN` - Token validation failed
- `TOKEN_EXPIRED` - Token has expired
- `QUOTA_EXCEEDED` - Daily usage limit exceeded
- `VALIDATION_ERROR` - Request validation failed
- `GEMINI_API_ERROR` - Gemini API failure
- `USER_NOT_FOUND` - User not found

## Environment Variables

Required configuration in `.env`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/your-db

# API Keys
GEMINI_API_KEY=your-gemini-api-key

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
JWT_SECRET=your-jwt-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3001,chrome-extension://*
```

## Security Considerations

1. **JWT Verification**: All tokens are cryptographically verified
2. **CORS**: Strict origin validation for dashboard and extension
3. **Rate Limiting**: General API rate limiter on all endpoints
4. **Input Validation**: Zod schemas validate all user input
5. **Error Sanitization**: Production mode hides sensitive error details

## Performance Optimizations

1. **Database Indexes**: 
   - User email (unique)
   - Prompt userId + createdAt
   - Prompt metadata.tags

2. **Lean Queries**: Use `.lean()` for read-only operations
3. **Pagination**: Limit maximum page size to 100
4. **Retry Logic**: Exponential backoff for external API calls

## Future Enhancements

- [ ] Add caching layer for frequently accessed data
- [ ] Implement prompt sharing/collaboration features
- [ ] Add analytics and usage insights
- [ ] Support for multiple AI models
- [ ] Webhook notifications for quota alerts
