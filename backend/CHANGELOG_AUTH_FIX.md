# Authentication Token Verification Fix

## Issue
The backend was receiving JWT tokens from the NextAuth dashboard but failing to verify them because NextAuth uses JWE (JSON Web Encryption) by default, not standard JWT tokens. This caused `401 Unauthorized` errors with "Invalid token format" messages when the dashboard tried to make API calls.

## Solution
Updated the backend's `AuthService.verifyToken` method to support both NextAuth JWE tokens (5-part tokens) and standard JWT tokens (3-part tokens) for backward compatibility.

## Changes Made

### 1. Dependencies
- **Added**: `jose` package (v4.15.9) for NextAuth JWE token decryption

### 2. Backend Service (`backend/src/services/auth.service.ts`)

#### New Features:
- Import `jwtDecrypt` from `jose` library
- Enhanced `verifyToken` method to:
  - Clean token by removing "Bearer " prefix (case-insensitive)
  - Detect token type by part count (5 parts = JWE, 3 parts = JWT)
  - Try JWE verification first for NextAuth tokens
  - Fall back to standard JWT verification for backward compatibility
  - Provide environment-aware error logging (development only)

#### New Methods:
- **`verifyJWEToken(token: string)`**: Handles NextAuth JWE token decryption
  - Uses `jwtDecrypt` from `jose` with `NEXTAUTH_SECRET`
  - Validates required fields (email)
  - Checks token expiration
  - Returns decoded payload

- **`verifyJWTToken(token: string)`**: Handles standard JWT verification
  - Refactored from original `verifyToken` logic
  - Validates signature using HMAC-SHA256
  - Checks expiration
  - Returns decoded payload

### 3. Documentation (`backend/README.md`)
- Updated authentication environment variable description
- Clarified that `NEXTAUTH_SECRET` must match the web app's value
- Updated middleware descriptions to note support for both token types
- Marked authentication features as completed in TODO section

### 4. Environment Variables
The `.env.example` already included `NEXTAUTH_SECRET`, so no changes were needed. For proper operation:

```env
# Must match the NEXTAUTH_SECRET in the web app
NEXTAUTH_SECRET=your-nextauth-secret-here-generate-with-openssl-rand-base64-32
```

## Backward Compatibility
✅ The implementation maintains full backward compatibility with standard JWT tokens:
- Existing test suite (49 tests) continues to pass without modifications
- Standard 3-part JWT tokens are still supported
- Falls back gracefully between token types

## Testing
All existing tests pass:
- ✅ 49/49 tests passing
- ✅ Auth middleware tests pass
- ✅ Usage endpoint tests pass
- ✅ All integration tests pass
- ✅ TypeScript compilation succeeds
- ✅ ESLint passes

## How It Works

### Token Flow:
1. Dashboard gets session token from NextAuth
2. Dashboard sends token to backend API via Authorization header
3. Backend receives token and:
   - Checks if it has 5 parts (JWE format)
   - If yes, tries to decrypt with `NEXTAUTH_SECRET`
   - If no or decryption fails, tries standard JWT verification
   - If valid, finds or creates user and grants access
   - If invalid, returns 401 error

### Security:
- Tokens are validated against `NEXTAUTH_SECRET` or `JWT_SECRET`
- Expiration times are checked
- Required fields (email) are validated
- Error messages don't leak sensitive information in production

## Benefits
1. ✅ Dashboard can authenticate using NextAuth tokens
2. ✅ Single source of truth for authentication
3. ✅ Automatic user provisioning on first API call
4. ✅ Backward compatible with existing JWT tokens
5. ✅ No breaking changes to existing code
6. ✅ Improved error handling and logging

## Files Changed
- `backend/package.json` - Added `jose` dependency
- `backend/src/services/auth.service.ts` - Enhanced token verification
- `backend/README.md` - Updated documentation

## Next Steps
To use this in production:
1. Ensure `NEXTAUTH_SECRET` in backend `.env` matches web app's value
2. Dashboard should send NextAuth session token to backend
3. Backend will automatically verify and process the token
4. Users will be auto-created in MongoDB on first API call
