# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow a standardized format:

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
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Authentication

Protected endpoints require an `Authorization` header with a Bearer token:

```
Authorization: Bearer <your-token>
```

**Note**: Authentication is currently a stub implementation and will accept any token.

## Rate Limiting

- General API endpoints: 100 requests per 15 minutes
- Strict endpoints: 10 requests per 15 minutes

Rate limit information is included in response headers:
- `RateLimit-Limit` - Maximum requests allowed
- `RateLimit-Remaining` - Requests remaining
- `RateLimit-Reset` - Time when limit resets

## Endpoints

### Health Check

Check server and database status.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development",
    "uptime": 123.456,
    "database": {
      "connected": false,
      "status": "disconnected"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Endpoints

These endpoints demonstrate the middleware and error handling.

#### Public Example

**Endpoint:** `GET /example/public`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "This is a public route"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Protected Example

**Endpoint:** `GET /example/protected`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "This is a protected route",
    "user": {
      "id": "TODO_USER_ID",
      "email": "TODO_USER_EMAIL"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (No Auth):**
```json
{
  "success": false,
  "error": {
    "message": "No authorization header provided",
    "code": "UNAUTHORIZED"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Example

**Endpoint:** `GET /example/error`

**Authentication:** Not required

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "This is an example error",
    "code": "EXAMPLE_ERROR"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Codes

### Authentication Errors
- `UNAUTHORIZED` - Missing or invalid authentication

### Validation Errors
- `VALIDATION_ERROR` - Request validation failed
- `INVALID_ID` - Invalid ID format

### Database Errors
- `DUPLICATE_KEY` - Duplicate entry

### General Errors
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXAMPLE_ERROR` - Example error for testing

## CORS

The API accepts requests from:
- Dashboard domain (configured via `ALLOWED_ORIGINS`)
- Chrome extensions (`chrome-extension://*`)

## Development Notes

- In development mode (`NODE_ENV=development`), error responses include detailed information
- In production mode, error details are sanitized for security
- All timestamps are in ISO 8601 format (UTC)
- Request logging is enabled in development mode

## Coming Soon

The following endpoints will be added in Phase 1:

- User authentication and registration
- Bookmark management
- AI-powered insights with Gemini API
- Subscription management with Stripe
- User preferences and settings

Check the main README for the complete roadmap.
