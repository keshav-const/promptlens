# Dashboard API Routing Fix - Summary

## Changes Made

### 1. Fixed API Base URL (`web/src/services/api.ts`)
- **Changed**: Environment variable from `NEXT_PUBLIC_API_BASE_URL` to `NEXT_PUBLIC_BACKEND_API_URL`
- **Changed**: Default URL from `http://localhost:3000/api` to `http://localhost:5000/api`
- **Impact**: All backend API calls (usage, history, billing) now correctly point to the Express backend on port 5000

### 2. Created `.env.local` File (`web/.env.local`)
- **Added**: Environment configuration for local development
- **Set**: `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api`
- **Set**: `NEXTAUTH_URL=http://localhost:3000`
- **Set**: Development `NEXTAUTH_SECRET` (should be changed for production)
- **Note**: Google OAuth credentials are commented out and need to be filled in

### 3. Updated `.env.example` File (`web/.env.example`)
- **Changed**: `NEXTAUTH_URL` from port 3001 to 3000
- **Changed**: `NEXT_PUBLIC_API_BASE_URL` to `NEXT_PUBLIC_BACKEND_API_URL`
- **Updated**: Documentation to clarify this points to backend API server

### 4. Fixed Infinite Redirect Loop (`web/src/pages/index.tsx`)
- **Added**: Check for error query parameter before redirecting to dashboard
- **Impact**: Prevents redirect loop when authentication fails
- **Before**: `if (status === 'authenticated') { router.push('/dashboard'); }`
- **After**: `if (status === 'authenticated' && !router.query.error) { router.push('/dashboard'); }`

## Architecture Overview

### Port Configuration
- **Frontend (Next.js)**: Port 3000
- **Backend (Express)**: Port 5000

### API Endpoints
- **Next.js API Routes** (remain on port 3000):
  - `/api/auth/*` - NextAuth authentication
  - `/api/token` - Returns JWT token from session

- **Backend API Routes** (now correctly calling port 5000):
  - `/api/usage` - User usage data
  - `/api/history` - Prompt history
  - `/api/billing/checkout` - Stripe checkout
  - `/api/billing/portal` - Stripe customer portal
  - `/api/optimize` - Prompt optimization
  - `/api/health` - Backend health check

## Testing the Fixes

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

### 3. Verify API Calls
Open browser console and check:
- ✅ API calls should go to `http://localhost:5000/api/*`
- ✅ No more 404 errors for `/api/usage`
- ✅ No more redirect loops

### 4. Set Up OAuth (Required for Login)
To test authentication features:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Update `web/.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```
5. Restart the Next.js dev server

## Expected Behavior After Fixes

✅ **Dashboard loads successfully** after login (once OAuth is configured)
✅ **API calls use correct backend URL** (`http://localhost:5000/api/*`)
✅ **No infinite redirect loop** when auth fails
✅ **Console shows no 404 errors** for API endpoints
✅ **Usage data displays correctly** (when backend is running and user is authenticated)
✅ **Token endpoint works** at `http://localhost:3000/api/token`

## Troubleshooting

### Issue: Still seeing redirect loop
- **Cause**: OAuth credentials not configured
- **Solution**: Add Google OAuth credentials to `.env.local` and restart server

### Issue: API calls still failing with CORS
- **Cause**: Backend not running or ALLOWED_ORIGINS not set correctly
- **Solution**: Ensure backend is running on port 5000 and has proper CORS configuration

### Issue: 401 Unauthorized errors
- **Cause**: User not authenticated or token expired
- **Solution**: Log in again through the UI

### Issue: Environment variables not loading
- **Cause**: `.env.local` changes require server restart
- **Solution**: Stop and restart `npm run dev` in the web directory

## Files Modified
1. `web/src/services/api.ts` - API base URL configuration
2. `web/.env.local` - Created with correct backend URL
3. `web/.env.example` - Updated documentation
4. `web/src/pages/index.tsx` - Redirect loop fix
