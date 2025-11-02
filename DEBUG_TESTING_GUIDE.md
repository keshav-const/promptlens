# Auth Debug Testing Guide

## Changes Made

### 1. Backend - `backend/src/services/auth.service.ts`
Added comprehensive debug logging in `verifyToken` method:
- Logs token preview (first 50 characters)
- Logs NEXTAUTH_SECRET and JWT_SECRET existence and length
- Logs clean token length and preview
- Logs token parts count (3 for JWT, 5 for JWE)
- Logs which verification method is being attempted (JWE vs JWT)
- Logs success or detailed error information

### 2. Backend - `backend/src/middlewares/auth.ts`
Added debug logging in `requireAuth` middleware:
- Logs auth header preview
- Logs when no auth header is present
- Logs when token is missing
- Logs when token payload is missing email
- Logs successful authentication with user email

### 3. Frontend - `web/src/services/api.ts`
Added debug logging in `fetchWithAuth` function:
- Logs token preview being sent to backend
- Logs token length
- Logs warning when no token is available

### 4. Frontend - `web/src/pages/api/token.ts`
**CRITICAL FIX**: Changed from returning Google OAuth token to NextAuth session token
- Now extracts the NextAuth session token from cookies
- Logs token existence and user information
- Logs session token from cookie with preview
- Returns the actual NextAuth JWT that backend can verify
- Handles both development (`next-auth.session-token`) and production (`__Secure-next-auth.session-token`) cookie names

## Issue Identified

The previous implementation was returning Google's OAuth access token instead of the NextAuth session token. This caused the backend to fail verification because:
1. Google's OAuth token is a different format (not a NextAuth JWE)
2. The backend was trying to decrypt it with NEXTAUTH_SECRET
3. This is fundamentally incompatible

## Solution

The `/api/token` endpoint now returns the NextAuth session token from cookies. This is the encrypted JWT (JWE) that NextAuth creates and stores in a cookie. The backend can decrypt this using the same NEXTAUTH_SECRET.

## Testing Steps

1. **Ensure both servers have the same NEXTAUTH_SECRET**:
   ```bash
   # Check backend/.env
   cat backend/.env | grep NEXTAUTH_SECRET
   
   # Check web/.env.local
   cat web/.env.local | grep NEXTAUTH_SECRET
   ```
   They MUST be identical!

2. **Start backend with logging**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Start web dashboard with logging**:
   ```bash
   cd web
   npm run dev
   ```

4. **Clear browser data and test**:
   - Open browser DevTools (F12)
   - Clear all cookies and localStorage for localhost
   - Navigate to http://localhost:3000
   - Sign in with Google
   - Check browser console for frontend logs
   - Check terminal for backend logs
   - Try to access a protected page (e.g., /history)

## Expected Debug Output

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

## Troubleshooting

### If you see "Invalid token format" with parts count != 5:
- The token being sent is not a NextAuth JWE
- Check that `/api/token` is returning the session token from cookies
- Verify cookies exist: check browser DevTools > Application > Cookies

### If you see JWE verification failed:
- NEXTAUTH_SECRET mismatch between frontend and backend
- Token was encrypted with a different secret than used for decryption
- Regenerate secret and ensure it's the same in both .env files

### If you see "No session token in cookies":
- User is not properly authenticated with NextAuth
- Cookie settings might be blocking (check SameSite, Secure flags)
- Try signing out and back in

### If parts count is 3 instead of 5:
- Token is a standard JWT, not a NextAuth JWE
- Check if a different token is being returned
- Verify the `/api/token` implementation

## Alternative Solution (If JWE Continues to Fail)

If NextAuth JWE decryption continues to fail, implement a backend-signed JWT approach:

1. Modify `/api/token` to create a new JWT signed with JWT_SECRET
2. Backend verifies using JWT_SECRET with standard JWT library
3. This bypasses NextAuth token format entirely

This would require:
- Installing `jsonwebtoken` in web project
- Creating new JWT in `/api/token` with user info from session
- Backend uses JWT verification instead of JWE decryption
