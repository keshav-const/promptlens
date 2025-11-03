# Token Key and Port Configuration Fix Summary

## Issues Identified

### Issue 1: Storage Key Consistency ✅
**Status**: Already consistent - no fix needed

Upon investigation, the storage key `promptlens_auth_token` is already used consistently across all extension code:
- `extension/src/utils/auth.ts` - Uses `promptlens_auth_token` to store/retrieve tokens
- `extension/src/content/dashboardSync.ts` - Saves token to `promptlens_auth_token`
- `extension/src/background/background.ts` - Uses `getAuthToken()` from auth.ts

**Flow**:
1. contentScriptNew.tsx → sendMessageToBackground(OPTIMIZE_PROMPT)
2. background.ts → handles message → calls getAuthToken()
3. auth.ts → reads from `promptlens_auth_token`

### Issue 2: Port Configuration Mismatch ✅ FIXED
**Status**: Fixed

**Problem**: 
The extension and backend had inconsistent default port configurations:
- Extension default: `http://localhost:3000` (wrong)
- Backend default: Port `3000` (wrong)
- Documentation (TESTING_AUTH_SYNC.md): Backend should run on port `5000`

This caused a 404 error when the extension tried to call the optimize endpoint because it was calling the wrong port.

**Root Cause**:
The backend is intended to run on port 5000, while the web dashboard runs on port 3000. The code defaults were incorrect and inconsistent with the testing documentation.

## Changes Made

### 1. Backend Port Configuration
**File**: `backend/src/config/env.ts`
- Changed: `PORT: z.string().transform(Number).default('5000')` (was '3000')

**File**: `backend/.env.example`
- Changed: `PORT=5000` (was 3000)

### 2. Extension API Base URL
**File**: `extension/src/utils/config.ts`
- Changed: `apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'` (was 3000)

### 3. Documentation Updates

**File**: `QUICKSTART.md`
- Updated backend API URL references from port 3000 to 5000
- Updated web dashboard references (port 3000 is correct for dashboard)
- Fixed environment variable defaults

**File**: `README.md`
- Updated PORT default documentation: 5000 instead of 3000
- Updated Stripe webhook URLs: localhost:5000 instead of 3000
- Updated development workflow references
- Updated typical development workflow section

**File**: `backend/README.md`
- Updated PORT default: 5000 instead of 3000
- Updated Stripe webhook URL: localhost:5000
- Updated API testing curl example: localhost:5000
- Updated health check URL: localhost:5000

## Correct Port Configuration

The standardized port setup is now:
- **Backend API**: `http://localhost:5000` (default)
- **Web Dashboard**: `http://localhost:3000` (default)
- **Extension**: Points to backend at `http://localhost:5000`

## API Endpoints

All backend API endpoints are mounted at `/api` prefix:
- Health: `http://localhost:5000/api/health`
- Optimize: `http://localhost:5000/api/optimize` (requires auth)
- History: `http://localhost:5000/api/history` (requires auth)
- Usage: `http://localhost:5000/api/usage` (requires auth)
- Billing: `http://localhost:5000/api/billing/*`
- Upgrade: `http://localhost:5000/api/upgrade` (Stripe webhook)

## Testing the Fix

### 1. Backend
```bash
cd backend
npm run dev
# Should start on http://localhost:5000
# Verify: curl http://localhost:5000/api/health
```

### 2. Web Dashboard
```bash
cd web
npm run dev
# Should start on http://localhost:3000
```

### 3. Extension
```bash
cd extension
npm run build
# Load dist/ folder as unpacked extension in Chrome
```

### 4. Test Optimize Flow
1. Sign in to dashboard at http://localhost:3000
2. Wait for token sync (check extension storage)
3. Go to https://gemini.google.com or ChatGPT
4. Click optimize button
5. Should successfully optimize (no 404 error)

## Acceptance Criteria

- ✅ Backend runs on port 5000 by default
- ✅ Extension calls http://localhost:5000/api/optimize (not 3000)
- ✅ Token storage key is consistent: `promptlens_auth_token`
- ✅ Optimize endpoint exists and is properly registered
- ✅ Documentation is consistent across all files
- ✅ No 404 errors when calling optimize endpoint

## Notes

- Users can still override ports via environment variables
- CORS is configured to allow both dashboard (port 3000) and extension origins
- The optimize endpoint requires authentication (JWT token in Authorization header)
- The token sync happens automatically when user signs in to dashboard
