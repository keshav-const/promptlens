# Dashboard API Routing Fix - Changes Documentation

## Summary
Fixed critical frontend issues preventing dashboard from working after login, including wrong API base URL, infinite redirect loop, and incorrect environment configuration.

## Issue Description
The frontend was calling `http://localhost:3000/api/usage` instead of `http://localhost:5000/api/usage` (backend), causing 404 errors. Additionally, an infinite redirect loop occurred when authentication checks failed.

## Changes Made

### 1. Fixed API Base URL (`web/src/services/api.ts`)

**Before:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

const headers: HeadersInit = {
  'Content-Type': 'application/json',
  ...options.headers,
};
```

**After:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (options.headers) {
  Object.assign(headers, options.headers);
}
```

**Changes:**
- Changed environment variable name from `NEXT_PUBLIC_API_BASE_URL` to `NEXT_PUBLIC_BACKEND_API_URL`
- Changed default URL from port 3000 to port 5000
- Fixed TypeScript type error by changing `HeadersInit` to `Record<string, string>`

### 2. Fixed Infinite Redirect Loop (`web/src/pages/index.tsx`)

**Before:**
```typescript
useEffect(() => {
  if (status === 'authenticated') {
    router.push('/dashboard');
  }
}, [status, router]);
```

**After:**
```typescript
useEffect(() => {
  if (status === 'authenticated' && !router.query.error) {
    router.push('/dashboard');
  }
}, [status, router, router.query.error]);
```

**Changes:**
- Added check for `router.query.error` to prevent redirect when auth error occurs
- Updated dependency array to include `router.query.error`

**Why This Fixes the Loop:**
- Before: User redirected from dashboard → home page with `?error=auth_required` → dashboard → loop
- After: If there's an error query param, don't auto-redirect to dashboard, breaking the loop

### 3. Updated Environment Configuration (`web/.env.example`)

**Changes:**
- Changed `NEXTAUTH_URL` from `http://localhost:3001` to `http://localhost:3000`
- Changed `NEXT_PUBLIC_API_BASE_URL` to `NEXT_PUBLIC_BACKEND_API_URL`
- Updated default value from `http://localhost:3000` to `http://localhost:5000/api`
- Added clarifying comment about backend API server

### 4. Created Local Environment File (`web/.env.local`)

**New file created with:**
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=development-secret-please-change-in-production-with-openssl-rand-base64-32`
- `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api`
- Commented placeholders for OAuth credentials

**Note:** This file is gitignored and won't be committed to the repository.

## Architecture Overview

### Service Separation
- **Frontend (Next.js)**: Runs on port 3000
- **Backend (Express)**: Runs on port 5000

### API Endpoint Mapping

| Endpoint Type | URL | Server |
|--------------|-----|--------|
| NextAuth | `http://localhost:3000/api/auth/*` | Next.js |
| Token API | `http://localhost:3000/api/token` | Next.js |
| Usage Data | `http://localhost:5000/api/usage` | Backend |
| History | `http://localhost:5000/api/history` | Backend |
| Billing | `http://localhost:5000/api/billing/*` | Backend |
| Optimize | `http://localhost:5000/api/optimize` | Backend |

## Testing

### Verify API Configuration
```bash
cd web
node test-api-config.js
```

Expected output:
```
✓ API configuration is CORRECT!
  Frontend will call: http://localhost:5000/api/*
```

### TypeScript Check
```bash
cd web
npm run typecheck
```

No errors related to modified files (api.ts, index.tsx).

### ESLint Check
```bash
cd web
npm run lint
```

No new lint errors introduced.

## Acceptance Criteria - Status

✅ **Fixed API Base URL**: All backend API calls now use `http://localhost:5000/api/*`
✅ **Fixed Redirect Loop**: Added error check to prevent infinite redirect
✅ **Environment Variables**: Created `.env.local` with correct backend URL
✅ **Updated Documentation**: Updated `.env.example` with correct variable names
✅ **No TypeScript Errors**: No type errors in modified files
✅ **No New Lint Errors**: Changes follow existing code style
✅ **Token Endpoint**: `/api/token` remains a Next.js API route (unchanged)

## How to Use

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

Backend should start on `http://localhost:5000`

### 2. Start Frontend Server
```bash
cd web
npm install
npm run dev
```

Frontend should start on `http://localhost:3000`

### 3. Configure OAuth (Required for Authentication)
1. Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Update `web/.env.local`:
   ```env
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```
3. Restart the Next.js dev server

### 4. Verify
- Open browser to `http://localhost:3000`
- Check console: API calls should go to `http://localhost:5000/api/*`
- No 404 errors for backend API endpoints
- No infinite redirect loop

## Files Modified
1. `web/src/services/api.ts` - API client configuration
2. `web/src/pages/index.tsx` - Home page redirect logic
3. `web/.env.example` - Environment variable documentation
4. `web/.env.local` - Created local environment configuration (gitignored)

## Additional Files
- `DASHBOARD_FIX_SUMMARY.md` - Detailed summary of changes
- `CHANGES.md` - This file
- `web/test-api-config.js` - Test script for API configuration

## Notes

### Environment Variables
- `.env.local` is gitignored and won't be committed
- OAuth credentials must be set up by each developer
- `NEXTAUTH_SECRET` in `.env.local` is for development only

### Backward Compatibility
- Old environment variable `NEXT_PUBLIC_API_BASE_URL` is replaced by `NEXT_PUBLIC_BACKEND_API_URL`
- Default values ensure the app works out of the box with standard port configuration

### Future Improvements
- Consider adding proper error boundaries for auth failures
- Add retry logic for failed API calls
- Implement better session persistence across server/client
