# Changes Summary - Auth Debug and Token Verification Fix

## Problem Identified

The previous implementation had a critical flaw:
- The `/api/token` endpoint was returning Google's OAuth access token instead of the NextAuth session token
- Google's OAuth token cannot be verified by the backend using NEXTAUTH_SECRET
- This caused "Invalid token format" errors

## Solution Implemented

### 1. Backend: Added comprehensive debug logging

**File: `backend/src/services/auth.service.ts`**
- Logs received token preview (first 50 characters)
- Logs NEXTAUTH_SECRET and JWT_SECRET existence and length
- Logs clean token length and preview (after removing "Bearer ")
- Logs token parts count (3 for JWT, 5 for JWE)
- Logs which verification method is attempted (JWE vs JWT)
- Logs success or detailed error information with error type

**File: `backend/src/middlewares/auth.ts`**
- Logs auth header preview
- Logs when no auth header is present
- Logs when token is missing from header
- Logs when token payload is missing email
- Logs successful authentication with user email

### 2. Frontend: Added comprehensive debug logging

**File: `web/src/services/api.ts`**
- Logs token preview being sent to backend (first 50 characters)
- Logs token length
- Logs warning when no token is available

### 3. Frontend: Fixed token endpoint to return correct token

**File: `web/src/pages/api/token.ts`**
- **CRITICAL FIX**: Now extracts and returns the NextAuth session token from cookies
- Handles both development (`next-auth.session-token`) and production (`__Secure-next-auth.session-token`) cookie names
- Logs token existence and user information from NextAuth
- Logs session token preview and length
- Returns the actual NextAuth JWE that backend can decrypt

## Key Changes in Detail

### Before (BROKEN):
```typescript
// web/src/pages/api/token.ts
const accessToken = (session as any).accessToken; // This was Google's OAuth token!
return res.status(200).json({ accessToken, ... });
```

### After (FIXED):
```typescript
// web/src/pages/api/token.ts
const sessionToken =
  req.cookies['next-auth.session-token'] || // Development
  req.cookies['__Secure-next-auth.session-token']; // Production (HTTPS)

return res.status(200).json({
  accessToken: sessionToken, // This is the NextAuth JWE token!
  user: session.user,
  expiresAt: session.expires,
});
```

## Testing

To test these changes:

1. **Ensure NEXTAUTH_SECRET is identical in both .env files**
   ```bash
   # backend/.env
   NEXTAUTH_SECRET=your-secret-here
   
   # web/.env.local
   NEXTAUTH_SECRET=your-secret-here  # MUST BE IDENTICAL!
   ```

2. **Start both servers and watch the logs:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd web && npm run dev
   ```

3. **Test the authentication flow:**
   - Clear browser cookies and localStorage
   - Navigate to http://localhost:3000
   - Sign in with Google
   - Navigate to /history or any protected route
   - Watch console logs in both terminals

## Expected Log Output

### Frontend Console (Browser):
```
🎫 Sending token: eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...
🎫 Token length: 256
```

### Web API Logs (Next.js Terminal):
```
🎫 Token from NextAuth: exists
🎫 Token sub: 1234567890
🎫 Token email: user@example.com
🍪 Session token from cookie: eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...
🍪 Session token length: 256
```

### Backend Logs (Backend Terminal):
```
📨 Auth header received: Bearer eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...
🔍 Token received: Bearer eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...
🔑 NEXTAUTH_SECRET exists: true
🔑 NEXTAUTH_SECRET length: 44
🔑 JWT_SECRET exists: true
🧹 Clean token length: 256
🧹 Clean token preview: eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...
🔢 Token parts count: 5
🔐 Attempting JWE verification (NextAuth token)...
✅ Token decoded successfully (JWE): { sub: '...', email: 'user@example.com', ... }
✅ User authenticated: user@example.com
```

## Files Modified

1. `backend/src/services/auth.service.ts` - Added debug logging
2. `backend/src/middlewares/auth.ts` - Added debug logging
3. `web/src/services/api.ts` - Added debug logging
4. `web/src/pages/api/token.ts` - **FIXED: Returns NextAuth session token instead of Google OAuth token**

## Additional Documentation

See `DEBUG_TESTING_GUIDE.md` for detailed testing instructions and troubleshooting steps.
