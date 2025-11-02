# Authentication Token Sync Implementation

## Overview

This document describes how authentication tokens are synchronized between the PromptLens dashboard and the Chrome extension, enabling seamless authentication without requiring users to log in twice.

## Problem

Users authenticate with the PromptLens dashboard using NextAuth (OAuth providers like Google), but the Chrome extension needs access to backend API tokens to make authenticated requests. Browser localStorage and Chrome extension storage are separate sandboxes that don't communicate by default.

## Solution

We implemented a token synchronization mechanism using Chrome extension content scripts that run on the dashboard domain to bridge the authentication gap.

## Architecture

### Components

1. **Dashboard Authentication** (`web/src/`)
   - NextAuth handles user authentication
   - `/api/token` endpoint creates backend-compatible JWT tokens
   - `TokenStorage` class manages token storage in localStorage
   - Custom events notify when tokens change

2. **Dashboard Sync Content Script** (`extension/src/content/dashboardSync.ts`)
   - Runs on dashboard domain (localhost:3000, *.vercel.app)
   - Monitors localStorage for token changes
   - Copies tokens to chrome.storage.local
   - Converts token format between dashboard and extension

3. **Extension Storage** (`extension/src/utils/auth.ts`)
   - Provides utilities to get/set/clear auth tokens
   - Stores tokens in chrome.storage.local
   - Handles token expiration

4. **Background Service Worker** (`extension/src/background/background.ts`)
   - Uses stored tokens for API authentication
   - Shows helpful error messages when auth is missing
   - Clears expired tokens

## Token Flow

```
User Login → Dashboard (NextAuth) → /api/token → localStorage
                                                      ↓
                                        Dashboard Sync Content Script
                                                      ↓
                                             chrome.storage.local
                                                      ↓
                                        Extension Background Worker
                                                      ↓
                                            Authenticated API Requests
```

### Detailed Flow

1. **User logs into dashboard:**
   - User authenticates via Google OAuth (NextAuth)
   - Dashboard creates NextAuth session
   - `_app.tsx` AuthSync component detects authentication
   - Calls `TokenStorage.fetchAndStoreToken()`

2. **Token generation:**
   - `/api/token` endpoint receives request
   - Verifies NextAuth session
   - Creates backend-compatible JWT using JWT_SECRET
   - Returns: `{ accessToken, user, expiresAt }`

3. **Dashboard storage:**
   - Token saved to localStorage key: `auth_token_data`
   - Token saved to sessionStorage (backup)
   - Custom event `promptlens-token-updated` dispatched

4. **Extension sync:**
   - Dashboard sync content script detects token change via:
     - Storage event listener (cross-tab changes)
     - Custom event listener (same-tab changes)
     - Periodic polling (every 5 seconds)
     - DOM mutation observer (after login redirects)
   
5. **Token conversion:**
   - Dashboard format: `{ accessToken, user, expiresAt (ISO string) }`
   - Extension format: `{ token, expiresAt (timestamp) }`
   - Script converts and saves to chrome.storage.local

6. **Extension usage:**
   - Background worker calls `getAuthToken()`
   - Token retrieved from chrome.storage.local
   - Expiration checked automatically
   - Token included in API requests as `Bearer` token

7. **Token expiration:**
   - Extension checks expiration before API calls
   - Backend validates JWT signature and expiration
   - On 401 response, extension clears token
   - User sees helpful message with dashboard link

## Token Formats

### Dashboard Token (localStorage)

```typescript
{
  accessToken: string;        // JWT token
  refreshToken?: string;      // Optional refresh token
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expiresAt: string;          // ISO 8601 timestamp
}
```

### Extension Token (chrome.storage.local)

```typescript
{
  token: string;              // JWT token (from accessToken)
  expiresAt?: number;         // Unix timestamp in milliseconds
}
```

### JWT Token Payload

```typescript
{
  sub: string;                // User email
  email: string;              // User email
  name?: string;              // User name
  picture?: string;           // User profile picture
  iss: "promptlens-dashboard"; // Issuer
  exp: number;                // Expiration timestamp
}
```

## Implementation Details

### Manifest Changes

Added host permissions for dashboard domains:
```json
"host_permissions": [
  "http://localhost:3000/*",
  "https://*.vercel.app/*"
]
```

Added dashboard sync content script:
```json
{
  "matches": [
    "http://localhost:3000/*",
    "https://*.vercel.app/*"
  ],
  "js": ["src/content/dashboardSync.ts"],
  "run_at": "document_start"
}
```

**Note:** Chrome extension manifest v3 doesn't support wildcard ports (e.g., `http://localhost:*/*`). For development on custom ports, you'll need to manually add them to the manifest.

### Dashboard Changes

1. **TokenStorage.saveToken()**: Dispatches custom event
2. **TokenStorage.clearToken()**: Dispatches custom event
3. **/api/token**: Returns expiresAt timestamp

### Extension Changes

1. **dashboardSync.ts**: New content script for token sync
2. **background.ts**: Enhanced error messages with dashboard URLs
3. **auth.ts**: Existing utilities for token management

## Sync Mechanisms

The dashboard sync script uses multiple mechanisms to ensure reliable token synchronization:

1. **Storage Event Listener**
   - Listens for localStorage changes
   - Fires when tokens change in other tabs
   - Standard browser API

2. **Custom Event Listener**
   - Listens for 'promptlens-token-updated' events
   - Fires when tokens change in the same tab
   - Overcomes storage event limitations

3. **Periodic Polling**
   - Checks localStorage every 5 seconds
   - Catches changes that might be missed by events
   - Provides redundancy

4. **DOM Mutation Observer**
   - Monitors DOM changes for 30 seconds after page load
   - Triggers sync when significant changes occur
   - Helpful after login redirects

## Error Handling

### No Token Found

**Error Message:**
```
Authentication required. Please sign in at http://localhost:3000 and reload this page.
```

**User Actions:**
1. Open dashboard in new tab
2. Sign in
3. Wait for sync (5-10 seconds)
4. Reload ChatGPT/Gemini page

### Token Expired

**Error Message:**
```
Session expired. Please sign in again at http://localhost:3000 and reload this page.
```

**Automatic Actions:**
- Extension clears stored token
- User must re-authenticate

**User Actions:**
1. Sign in to dashboard again
2. Wait for sync
3. Reload page

### Backend API Errors

- 401 Unauthorized: Clear token, show re-login message
- 429 Rate Limited: Show rate limit message
- Other errors: Show generic error with retry option

## Security Considerations

1. **Token Storage**
   - Tokens stored in chrome.storage.local (extension-only access)
   - Not accessible to regular web pages
   - Cleared on logout

2. **Token Transmission**
   - Tokens never sent over network except to backend API
   - HTTPS enforced for production
   - Bearer token in Authorization header

3. **Token Validation**
   - Backend validates JWT signature
   - Backend checks expiration
   - Backend verifies issuer

4. **Token Expiration**
   - Default: 7 days
   - Automatically cleared on expiration
   - User prompted to re-authenticate

## Testing

### Manual Testing

1. **Fresh Login:**
   - Clear all storage
   - Sign in to dashboard
   - Verify token synced to extension
   - Test extension functionality

2. **Token Expiration:**
   - Use old/expired token
   - Trigger API request
   - Verify error handling

3. **Logout:**
   - Sign out of dashboard
   - Verify token cleared from extension
   - Verify extension shows auth error

4. **Multiple Tabs:**
   - Open dashboard in multiple tabs
   - Sign in/out in one tab
   - Verify sync in all tabs

### Automated Testing

See `TESTING.md` for comprehensive test scenarios.

## Configuration

### Dashboard URLs

The extension determines dashboard URL from API base URL:

```typescript
const dashboardUrl = config.apiBaseUrl
  .replace('/api', '')
  .replace(':5000', ':3000');
```

**Examples:**
- `http://localhost:5000/api` → `http://localhost:3000`
- `https://api.example.com/api` → `https://api.example.com`

### Environment Variables

**Dashboard (.env.local):**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
JWT_SECRET=your-jwt-secret
```

**Extension (.env):**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Troubleshooting

### Tokens Not Syncing

1. Check browser console for dashboard sync logs
2. Verify extension is loaded (chrome://extensions)
3. Check host_permissions in manifest.json
4. Verify localStorage has token in dashboard
5. Check chrome.storage.local in extension

### Authentication Errors

1. Verify JWT_SECRET matches between dashboard and backend
2. Check token expiration
3. Verify backend API is accessible
4. Check network requests in DevTools

### Extension Not Loading

1. Check manifest.json syntax
2. Verify all content scripts exist
3. Check build output in dist/
4. Reload extension in chrome://extensions

## Future Enhancements

1. **Refresh Token Flow**
   - Implement automatic token refresh
   - Reduce login frequency

2. **Multi-Account Support**
   - Allow switching between accounts
   - Store multiple tokens

3. **Token Revocation**
   - Implement server-side token revocation
   - Clear all tokens on logout

4. **Better Error Recovery**
   - Automatic retry with exponential backoff
   - Silent re-authentication

## Related Files

- `extension/src/content/dashboardSync.ts`
- `extension/src/utils/auth.ts`
- `extension/src/background/background.ts`
- `web/src/lib/token.ts`
- `web/src/pages/api/token.ts`
- `web/src/pages/_app.tsx`
