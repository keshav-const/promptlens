# Testing Auth Token Sync: Dashboard to Extension

## Overview

This document provides comprehensive testing instructions for the authentication token synchronization feature between the PromptLens dashboard and Chrome extension.

## Test Environment Setup

### Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm install
   npm run dev
   # Should be running on http://localhost:5000
   ```

2. **Dashboard Server Running**
   ```bash
   cd web
   npm install
   npm run dev
   # Should be running on http://localhost:3000
   ```

3. **Extension Built and Loaded**
   ```bash
   cd extension
   npm install
   npm run build
   # Load dist/ folder as unpacked extension in Chrome
   ```

4. **Environment Variables Configured**
   - Backend `.env` with JWT_SECRET, MONGODB_URI (optional), etc.
   - Web `.env.local` with NEXTAUTH_URL, JWT_SECRET (must match backend), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   - Extension: VITE_API_BASE_URL should point to backend (default: http://localhost:5000/api)

### Browser Setup

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Load the extension from `extension/dist/` folder
5. Open Developer Tools (F12) to monitor console logs

## Test Scenarios

### Test 1: Fresh Login Flow

**Objective:** Verify token sync works when user logs in for the first time.

**Steps:**
1. Clear all browser data (localStorage, cookies, extension storage)
   - Chrome DevTools → Application → Clear storage
   - Extension: Right-click extension → Inspect → Console → `chrome.storage.local.clear()`

2. Open dashboard at http://localhost:3000

3. Click "Sign In" and authenticate with Google

4. After successful login, check dashboard console for:
   ```
   ✅ Created backend JWT for: [user-email]
   ```

5. Wait 5-10 seconds for token sync

6. Check extension storage:
   - Extension DevTools → Console:
   ```javascript
   chrome.storage.local.get(['promptlens_auth_token'], console.log)
   ```
   - Should show: `{ promptlens_auth_token: { token: "...", expiresAt: ... } }`

7. Open ChatGPT (https://chat.openai.com) or Gemini (https://gemini.google.com)

8. Click on the chat input textarea

9. The "✨ Optimize with PromptLens" button should appear

10. Type a test prompt: "write a hello world program"

11. Click the optimize button

12. Modal should show "Optimizing your prompt..." and then display results

**Expected Results:**
- ✅ User successfully logs in to dashboard
- ✅ Token appears in extension storage within 10 seconds
- ✅ Extension button appears on ChatGPT/Gemini
- ✅ Optimization works without authentication errors

**If Failed:**
- Check dashboard console for sync script logs: `[PromptLens Dashboard Sync]`
- Check extension background script console for token retrieval
- Verify JWT_SECRET matches in backend and dashboard
- Verify extension host_permissions include localhost:3000

---

### Test 2: Token Persistence Across Browser Restart

**Objective:** Verify tokens persist after closing and reopening browser.

**Steps:**
1. Complete Test 1 (user logged in, token synced)

2. Close Chrome completely (all windows)

3. Reopen Chrome

4. Open ChatGPT or Gemini (without opening dashboard)

5. Try using the optimize button

**Expected Results:**
- ✅ Extension still has valid token
- ✅ Optimization works without re-authentication
- ✅ No "Authentication required" error

---

### Test 3: Logout Flow

**Objective:** Verify token is cleared when user logs out.

**Steps:**
1. Complete Test 1 (user logged in)

2. Open dashboard at http://localhost:3000

3. Click user avatar/menu and select "Sign Out"

4. After logout, check dashboard localStorage:
   - DevTools → Application → Local Storage → http://localhost:3000
   - `auth_token_data` should be removed

5. Wait 5-10 seconds for sync

6. Check extension storage:
   ```javascript
   chrome.storage.local.get(['promptlens_auth_token'], console.log)
   ```
   - Should be empty or undefined

7. Open ChatGPT/Gemini and try to optimize a prompt

**Expected Results:**
- ✅ Dashboard clears token on logout
- ✅ Extension clears token within 10 seconds
- ✅ Optimization shows error: "Authentication required. Please sign in at http://localhost:3000..."
- ✅ Error message includes dashboard URL

---

### Test 4: Token Expiration Handling

**Objective:** Verify extension handles expired tokens gracefully.

**Steps:**
1. Complete Test 1 (user logged in)

2. Manually set an expired token in extension storage:
   ```javascript
   chrome.storage.local.set({
     promptlens_auth_token: {
       token: 'expired-token',
       expiresAt: Date.now() - 1000 // 1 second in the past
     }
   })
   ```

3. Open ChatGPT/Gemini and try to optimize a prompt

**Expected Results:**
- ✅ Extension detects expired token
- ✅ Shows error: "Session expired. Please sign in again at http://localhost:3000..."
- ✅ Token cleared from storage

---

### Test 5: Multiple Tabs Sync

**Objective:** Verify token syncs across multiple dashboard tabs.

**Steps:**
1. Clear all storage (logged out state)

2. Open dashboard in Tab 1 (http://localhost:3000)

3. Open dashboard in Tab 2 (http://localhost:3000)

4. In Tab 1, sign in with Google

5. After successful login, check Tab 2

6. Refresh Tab 2

7. Verify both tabs show logged in state

8. Check extension storage for token

**Expected Results:**
- ✅ Login in Tab 1 creates token in localStorage
- ✅ Tab 2 can read token (storage event or page refresh)
- ✅ Extension receives token from either tab
- ✅ Both tabs and extension have same token

---

### Test 6: Extension Content Script Logs

**Objective:** Verify dashboard sync script is working correctly.

**Steps:**
1. Open dashboard at http://localhost:3000

2. Open DevTools on dashboard page (F12)

3. Go to Console tab

4. Look for logs starting with `[PromptLens Dashboard Sync]`

**Expected Logs:**
```
[PromptLens Dashboard Sync] Content script loaded
[PromptLens Dashboard Sync] All sync mechanisms initialized
[PromptLens Dashboard Sync] ✅ Token synced to extension storage
[PromptLens Dashboard Sync] Token expires at: 2024-11-09T...
```

Or if no token:
```
[PromptLens Dashboard Sync] No token found in localStorage, clearing extension storage
[PromptLens Dashboard Sync] Token cleared from extension storage
```

**Expected Results:**
- ✅ Content script loads on dashboard pages
- ✅ Periodic sync runs every 5 seconds
- ✅ Logs show successful token sync or clearing
- ✅ No JavaScript errors in console

---

### Test 7: Network Request Authentication

**Objective:** Verify extension sends correct Authorization header.

**Steps:**
1. Complete Test 1 (user logged in, token synced)

2. Open ChatGPT/Gemini

3. Open Network tab in DevTools (F12)

4. Filter requests by: `optimize`

5. Click optimize button with a test prompt

6. Inspect the request to `/api/optimize`

7. Check Request Headers

**Expected Results:**
- ✅ Request includes `Authorization: Bearer [token]`
- ✅ Token matches value in extension storage
- ✅ Backend accepts token (200 response)
- ✅ Response includes optimized prompt

---

### Test 8: Error Message Links

**Objective:** Verify error messages include correct dashboard URL.

**Steps:**
1. Clear extension storage (but keep dashboard logged in):
   ```javascript
   chrome.storage.local.remove(['promptlens_auth_token'])
   ```

2. Open ChatGPT/Gemini

3. Try to optimize a prompt

4. Read the error message

**Expected Results:**
- ✅ Error message: "Authentication required. Please sign in at http://localhost:3000 and reload this page."
- ✅ URL is clickable or can be copy-pasted
- ✅ User can follow instructions to fix

---

### Test 9: Production URL Handling

**Objective:** Verify sync works with production-like URLs.

**Steps:**
1. Update extension `.env`:
   ```
   VITE_API_BASE_URL=https://api.example.com/api
   ```

2. Rebuild extension: `npm run build`

3. Reload extension in Chrome

4. Check error messages

**Expected Results:**
- ✅ Dashboard URL derived correctly: `https://api.example.com`
- ✅ Content script matches production domains in manifest
- ✅ Error messages show correct production URL

Note: Full production testing requires deploying to real domains.

---

### Test 10: Concurrent Login/Optimization

**Objective:** Verify optimization works immediately after login.

**Steps:**
1. Clear all storage (logged out)

2. Open dashboard and ChatGPT in separate tabs

3. In dashboard tab, sign in with Google

4. Immediately after login redirect, switch to ChatGPT tab

5. Try to optimize a prompt

6. If authentication error occurs, wait 10 seconds and try again

**Expected Results:**
- ✅ Token syncs within 5-10 seconds of login
- ✅ First attempt may fail with auth error (timing)
- ✅ Second attempt succeeds
- ✅ User doesn't need to reload ChatGPT page

---

## Debugging Checklist

If token sync is not working, check these in order:

### 1. Extension Manifest
- [ ] Host permissions include dashboard domain
- [ ] Content script registered for dashboard domain
- [ ] Content script file path is correct

### 2. Dashboard Console
```javascript
// Check localStorage
localStorage.getItem('auth_token_data')

// Should show token object with accessToken

// Dispatch test event
window.dispatchEvent(new CustomEvent('promptlens-token-updated'))
```

### 3. Extension Storage
```javascript
// Background script console
chrome.storage.local.get(['promptlens_auth_token'], console.log)

// Should show token object
```

### 4. Content Script Loaded
- [ ] Dashboard page shows `[PromptLens Dashboard Sync]` logs
- [ ] No errors about missing chrome.storage API
- [ ] Content script shows in Chrome DevTools → Sources

### 5. API Configuration
- [ ] Backend JWT_SECRET matches dashboard JWT_SECRET
- [ ] Extension VITE_API_BASE_URL points to backend
- [ ] CORS configured to allow extension requests

### 6. Network Connectivity
- [ ] Backend server is running
- [ ] Dashboard can reach backend API
- [ ] Extension can reach backend API
- [ ] No CORS errors in console

---

## Console Commands Reference

### Dashboard Page Console

```javascript
// Check if token exists in localStorage
localStorage.getItem('auth_token_data')

// Parse and view token
JSON.parse(localStorage.getItem('auth_token_data'))

// Manually trigger sync event
window.dispatchEvent(new CustomEvent('promptlens-token-updated'))

// Clear dashboard token
localStorage.removeItem('auth_token_data')
sessionStorage.removeItem('auth_token_data')
```

### Extension Background Console

```javascript
// Check extension storage
chrome.storage.local.get(['promptlens_auth_token'], console.log)

// Get full config
chrome.storage.local.get(null, console.log)

// Clear extension token
chrome.storage.local.remove(['promptlens_auth_token'])

// Clear all extension storage
chrome.storage.local.clear()

// Test token retrieval
chrome.runtime.sendMessage({
  type: 'GET_AUTH_TOKEN'
}, console.log)
```

### Extension Content Script Console (on dashboard)

```javascript
// Check if content script is running
console.log('Content script test')

// Check localStorage from content script context
localStorage.getItem('auth_token_data')

// Test chrome.storage access
chrome.storage.local.get(['promptlens_auth_token'], console.log)
```

---

## Success Criteria

All tests should pass with the following outcomes:

- ✅ User logs in once to dashboard
- ✅ Token automatically syncs to extension within 10 seconds
- ✅ Extension works on ChatGPT/Gemini without separate login
- ✅ Token persists across browser restarts
- ✅ Logout clears tokens everywhere
- ✅ Expired tokens handled gracefully
- ✅ Clear error messages guide users to dashboard
- ✅ No console errors or warnings
- ✅ Works across multiple tabs
- ✅ Network requests include correct auth headers

---

## Known Issues / Limitations

1. **Initial Sync Delay**: Token sync can take up to 10 seconds after login. This is by design (periodic polling). Users may need to wait briefly before using extension.

2. **Cross-Domain Limitations**: Content script only works on domains listed in manifest.json. Adding new dashboard domains requires manifest update and extension reload.

3. **Storage Event Timing**: Storage events don't fire in the same tab that makes changes. We use custom events to work around this, but some timing issues may occur.

4. **Extension Reload**: After updating extension, user may need to reload dashboard and ChatGPT/Gemini pages for changes to take effect.

---

## Troubleshooting Common Issues

### "Authentication required" Error

**Cause:** Extension doesn't have valid token

**Solutions:**
1. Sign in to dashboard (http://localhost:3000)
2. Wait 10 seconds for sync
3. Reload ChatGPT/Gemini page
4. Try again

### Token Not Syncing

**Cause:** Content script not running on dashboard

**Solutions:**
1. Check extension is loaded in chrome://extensions
2. Verify dashboard URL matches manifest host_permissions
3. Check dashboard console for `[PromptLens Dashboard Sync]` logs
4. Reload extension and dashboard page

### "Session expired" Error

**Cause:** Token expired or invalid

**Solutions:**
1. Sign out of dashboard
2. Sign in again
3. Wait for token sync
4. Try again

### Backend Rejects Token

**Cause:** JWT_SECRET mismatch

**Solutions:**
1. Verify JWT_SECRET in backend/.env
2. Verify JWT_SECRET in web/.env.local (must match backend)
3. Restart both backend and dashboard servers
4. Sign in again to get new token

---

## Contact & Support

For issues or questions:
- Check console logs in dashboard, extension background, and content script
- Review implementation docs: `extension/AUTH_SYNC_IMPLEMENTATION.md`
- Check backend JWT validation in `backend/src/middlewares/auth.ts`
- Review token generation in `web/src/pages/api/token.ts`
