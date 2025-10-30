# Google OAuth Configuration Guide

## Overview

This guide covers configuring Google OAuth for production authentication in the PromptLens application. OAuth is used for user sign-in on both the web dashboard and browser extension.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Create Google Cloud Project](#create-google-cloud-project)
- [Configure OAuth Consent Screen](#configure-oauth-consent-screen)
- [Create OAuth Credentials](#create-oauth-credentials)
- [Configure Redirect URIs](#configure-redirect-uris)
- [Publish Consent Screen](#publish-consent-screen)
- [Test OAuth Flow](#test-oauth-flow)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access
- [ ] Google account (for Google Cloud Console access)
- [ ] Dashboard deployment URL (see [dashboard.md](./dashboard.md))
- [ ] Extension ID (from Chrome Web Store, see [extension.md](./extension.md))

### Required Information
Gather this information before starting:

```
Project Information:
- Application name: PromptLens
- Application logo: URL to hosted logo (256x256 px minimum)
- Support email: support@promptlens.app
- Homepage URL: https://promptlens.app
- Privacy policy URL: https://promptlens.app/privacy
- Terms of service URL: https://promptlens.app/terms

Redirect URIs:
- Dashboard: https://dashboard.promptlens.app/api/auth/callback/google
- Extension: chrome-extension://[EXTENSION_ID] (if using OAuth in extension)
```

## Create Google Cloud Project

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account

### Step 2: Create New Project

1. Click project dropdown (top left)
2. Click "New Project"
3. Fill in project details:

```
Project name: PromptLens Production
Project ID: promptlens-prod (auto-generated, or customize)
Location: No organization (or select your organization)
```

4. Click "Create"
5. Wait for project creation (30-60 seconds)
6. Select the new project from dropdown

### Step 3: Enable Required APIs

1. Go to "APIs & Services" → "Library"
2. Search and enable these APIs:

```
✅ Google+ API (for user profile information)
✅ Google Identity Services API (for OAuth)
```

3. Click "Enable" for each API

## Configure OAuth Consent Screen

### Step 1: Access OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose user type:

```
User Type:
○ Internal (only for Google Workspace domains)
● External (anyone with a Google account)
```

3. Click "Create"

### Step 2: Configure App Information

Fill in required fields:

```
App Information:
  App name: PromptLens
  
  User support email: support@promptlens.app
  
  App logo: [Upload 256x256 px PNG or JPG]
  
  Application home page: https://promptlens.app
  
  Application privacy policy link: https://promptlens.app/privacy
  
  Application terms of service link: https://promptlens.app/terms

Developer contact information:
  Email addresses: engineering@promptlens.app
```

### Step 3: Configure Scopes

1. Click "Add or Remove Scopes"
2. Select these scopes:

```
✅ .../auth/userinfo.email
   See your primary Google Account email address

✅ .../auth/userinfo.profile
   See your personal info, including any personal info you've made publicly available

✅ openid
   Authenticate using OpenID Connect
```

3. Click "Update"
4. Click "Save and Continue"

### Step 4: Add Test Users (For Testing Phase)

During development/testing (before publishing):

```
Test users:
- your-email@gmail.com
- team-member@example.com
- qa-tester@example.com

Add up to 100 test users during testing phase
```

⚠️ Only test users can sign in until consent screen is published!

### Step 5: Review Summary

Review all settings and click "Back to Dashboard"

## Create OAuth Credentials

### Step 1: Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "+ Create Credentials" → "OAuth client ID"
3. Select application type:

```
Application type: Web application
Name: PromptLens Web Dashboard
```

### Step 2: Configure Authorized Origins

Add authorized JavaScript origins (for dashboard):

```
Authorized JavaScript origins:
https://dashboard.promptlens.app
https://promptlens.app (if needed)

For local testing (optional):
http://localhost:3001
http://localhost:3000
```

### Step 3: Configure Authorized Redirect URIs

Add authorized redirect URIs:

```
Authorized redirect URIs:

Dashboard (NextAuth callback):
https://dashboard.promptlens.app/api/auth/callback/google

For local testing (optional):
http://localhost:3001/api/auth/callback/google
```

### Step 4: Create Credentials

1. Click "Create"
2. Copy credentials shown in popup:

```
Your Client ID:
123456789012-abcdefghijklmnopqrstuvwxyz1234.apps.googleusercontent.com

Your Client Secret:
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45
```

⚠️ **Security**: Save these securely! You'll add them to environment variables.

3. Click "OK"

### Step 5: Create Additional Credentials for Extension (If Needed)

If extension uses OAuth (separate from dashboard):

1. Create another OAuth client ID
2. Application type: "Chrome extension"
3. Application ID: `[EXTENSION_ID]` (from Chrome Web Store)
4. Save credentials

Or use the same credentials with extension origin:
```
Authorized JavaScript origins:
chrome-extension://[EXTENSION_ID]
```

## Configure Redirect URIs

### Dashboard Redirect URIs

Ensure these are added to OAuth credentials:

```
Production:
https://dashboard.promptlens.app/api/auth/callback/google

Staging (if applicable):
https://staging-dashboard.promptlens.app/api/auth/callback/google

Development:
http://localhost:3001/api/auth/callback/google
```

### Extension Redirect URIs (If Applicable)

```
Extension origin:
chrome-extension://[EXTENSION_ID]

Or extension-specific callback:
chrome-extension://[EXTENSION_ID]/callback.html
```

### Verify Redirect URI Format

Common mistakes to avoid:
```
❌ Trailing slash: https://dashboard.promptlens.app/
✅ No trailing slash: https://dashboard.promptlens.app

❌ Wrong protocol: http://dashboard.promptlens.app (use HTTPS in production)
✅ Correct protocol: https://dashboard.promptlens.app

❌ Query parameters: https://dashboard.promptlens.app?callback=true
✅ No query params: https://dashboard.promptlens.app/api/auth/callback/google
```

## Publish Consent Screen

### Step 1: Prepare for Verification

Before publishing, ensure you have:

- [ ] Privacy policy hosted and accessible
- [ ] Terms of service hosted and accessible
- [ ] Application logo uploaded
- [ ] All required information completed
- [ ] Scopes properly justified

### Step 2: Submit for Verification

1. Go to "OAuth consent screen"
2. Click "Publish App"
3. Review warning: "This will make your app available to any Google account user"
4. Click "Confirm"

### Step 3: Verification Process (If Using Sensitive Scopes)

If using sensitive or restricted scopes, Google may require verification:

```
Verification Requirements:
- Privacy policy review
- Security assessment
- Domain ownership verification
- Video demo of OAuth flow

Timeline: 4-6 weeks
```

For PromptLens (basic scopes only), verification is typically not required.

### Step 4: Monitor Verification Status

Check status in OAuth consent screen:
```
Publishing status: Published
Verification status: Not required (for basic scopes)
                     or In Progress (for sensitive scopes)
```

### Step 5: Remove Warning Screen (After Publishing)

Once published, users will no longer see "This app isn't verified" warning.

Before publishing:
```
⚠️ Google hasn't verified this app
[Continue] [Back to safety]
```

After publishing:
```
✅ Sign in with Google
[Continue]
```

## Test OAuth Flow

### Test with Dashboard

1. Visit: https://dashboard.promptlens.app
2. Click "Sign in with Google"
3. Select Google account
4. Review permissions requested
5. Click "Allow"
6. Verify redirect back to dashboard
7. Check user profile displayed
8. Verify session persists across page reloads

### Test with Extension (If Applicable)

1. Install extension from Chrome Web Store
2. Open extension popup
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Verify authentication token stored
6. Test API calls use authenticated token

### Test Session Management

```bash
# Test session creation
# 1. Sign in via Google OAuth
# 2. Check cookies set (NextAuth session cookie)
# 3. Close browser
# 4. Reopen browser and visit dashboard
# 5. Should still be signed in (session persists)

# Test logout
# 1. Click logout
# 2. Verify session cleared
# 3. Verify redirect to homepage
# 4. Try accessing protected page → should redirect to login
```

### Test Error Scenarios

```bash
# Scenario 1: User denies permission
# Expected: Redirect back with error message

# Scenario 2: Invalid redirect URI
# Expected: OAuth error page from Google

# Scenario 3: Expired credentials
# Expected: Automatic token refresh (if refresh token enabled)

# Scenario 4: Account disabled
# Expected: Clear error message to user
```

## Security Best Practices

### Secure Credential Storage

```bash
# ✅ DO:
# - Store client secret in environment variables
# - Use secret management tools (Railway secrets, Vercel env vars)
# - Never commit credentials to version control
# - Rotate credentials regularly (every 90 days)

# ❌ DON'T:
# - Hardcode credentials in source code
# - Share credentials via email or chat
# - Use same credentials for dev/staging/prod
# - Commit .env files with real values
```

### Limit OAuth Scopes

```bash
# Only request minimum necessary scopes
✅ openid, email, profile (basic user info)

# Avoid requesting unless needed:
❌ Full Google Drive access
❌ Gmail access
❌ Calendar access
```

### Validate Redirect URIs

```bash
# Only allow your own domains
✅ https://dashboard.promptlens.app
✅ chrome-extension://[your-extension-id]

# Never allow:
❌ http:// in production (use HTTPS only)
❌ Wildcard domains (*.example.com)
❌ Localhost in production credentials
```

### Monitor OAuth Usage

```bash
# Regularly review:
# - Google Cloud Console → APIs & Services → Credentials → Usage
# - Check for unusual traffic patterns
# - Monitor failed auth attempts
# - Review user consent metrics
```

### Handle Tokens Securely

```javascript
// ✅ DO:
// - Store tokens in secure, HTTP-only cookies
// - Use NextAuth session management
// - Implement token refresh
// - Clear tokens on logout

// ❌ DON'T:
// - Store tokens in localStorage (XSS vulnerable)
// - Log tokens to console
// - Send tokens in URL parameters
// - Store tokens in client-side JavaScript variables
```

## Troubleshooting

### "Redirect URI Mismatch" Error

**Problem**: Error during OAuth flow about redirect URI

```bash
# Error message:
"Error 400: redirect_uri_mismatch"

# Solutions:

# 1. Verify redirect URI in Google Cloud Console exactly matches request
# Dashboard should be: https://dashboard.promptlens.app/api/auth/callback/google

# 2. Check for typos
# Common mistakes: extra slash, http vs https, wrong path

# 3. Ensure URI is added to correct OAuth client ID
# Google Cloud Console → Credentials → [Your Client ID] → Edit

# 4. Wait for changes to propagate (up to 5 minutes)

# 5. Clear browser cache and cookies
# Old OAuth state may be cached
```

### "Access Blocked" Error

**Problem**: Users see "Access blocked: This app's request is invalid"

```bash
# Solutions:

# 1. Verify OAuth consent screen is configured
# Must have privacy policy and required fields

# 2. Check scopes are valid
# Remove any invalid or deprecated scopes

# 3. Ensure consent screen is published
# Test users can access before publishing

# 4. Verify client ID matches consent screen
# Credentials must be from same project as consent screen
```

### "App Not Verified" Warning

**Problem**: Users see warning about unverified app

```bash
# This is normal before publishing consent screen

# Solutions:

# 1. Publish OAuth consent screen (see above)
# Google Cloud Console → OAuth consent screen → Publish

# 2. Add test users during testing
# Up to 100 test users can bypass warning

# 3. Submit for verification (if using sensitive scopes)
# May take 4-6 weeks

# Temporary workaround:
# Users can click "Advanced" → "Go to [app name] (unsafe)"
```

### Client Secret Invalid

**Problem**: Authentication fails with "invalid_client"

```bash
# Solutions:

# 1. Verify client ID and secret in environment variables
# Check for typos, extra spaces, or line breaks

# 2. Ensure using credentials for correct environment
# Don't use test credentials in production

# 3. Regenerate credentials if compromised
# Google Cloud Console → Credentials → [Client ID] → Reset secret

# 4. Update environment variables after regenerating
# Backend: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# Dashboard: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

### Session Not Persisting

**Problem**: User signed out after page refresh

```bash
# Solutions:

# 1. Verify NEXTAUTH_SECRET is set
# Required for session encryption

# 2. Check NEXTAUTH_URL matches deployment URL
# Must exactly match: https://dashboard.promptlens.app

# 3. Verify cookies are being set
# Chrome DevTools → Application → Cookies
# Should see: next-auth.session-token

# 4. Check cookie domain settings
# Ensure cookies not blocked by browser
# Verify secure flag set for HTTPS

# 5. Review NextAuth session configuration
# pages/api/auth/[...nextauth].ts
# session.strategy should be 'jwt'
```

### CORS Errors

**Problem**: OAuth requests blocked by CORS

```bash
# Solutions:

# 1. Add origin to authorized JavaScript origins
# Google Cloud Console → Credentials → Authorized JavaScript origins
# Add: https://dashboard.promptlens.app

# 2. Verify origin includes protocol and no trailing slash
# ✅ https://dashboard.promptlens.app
# ❌ https://dashboard.promptlens.app/

# 3. For extension, add chrome-extension origin
# chrome-extension://[EXTENSION_ID]
```

## Deployment Checklist

### Google Cloud Setup
- [ ] Google Cloud project created
- [ ] Project name: PromptLens Production
- [ ] Required APIs enabled (Google+ API, Identity Services)
- [ ] OAuth consent screen configured
- [ ] App information completed (name, logo, support email)
- [ ] Privacy policy URL set and accessible
- [ ] Terms of service URL set and accessible
- [ ] Scopes configured (openid, email, profile)

### Credentials
- [ ] OAuth client ID created for web application
- [ ] Client ID and secret saved securely
- [ ] Authorized JavaScript origins configured
- [ ] Authorized redirect URIs configured for dashboard
- [ ] Additional credentials for extension (if needed)
- [ ] Test users added (during testing phase)

### Publishing
- [ ] OAuth consent screen published
- [ ] Verification submitted (if required)
- [ ] "App not verified" warning resolved
- [ ] Users can sign in without warnings

### Testing
- [ ] Dashboard OAuth flow tested end-to-end
- [ ] Extension OAuth flow tested (if applicable)
- [ ] Session persistence verified
- [ ] Logout flow tested
- [ ] Error scenarios tested (denied permission, etc.)
- [ ] Multiple browsers tested
- [ ] Mobile testing completed (if applicable)

### Security
- [ ] Credentials stored in environment variables (not code)
- [ ] Redirect URIs limited to production domains
- [ ] Only necessary scopes requested
- [ ] HTTP-only cookies used for session tokens
- [ ] No credentials in version control
- [ ] Credentials backed up in secure location

### Environment Variables
- [ ] Backend: NEXTAUTH_URL set
- [ ] Backend: NEXTAUTH_SECRET set
- [ ] Dashboard: NEXTAUTH_URL set
- [ ] Dashboard: NEXTAUTH_SECRET set
- [ ] Dashboard: GOOGLE_CLIENT_ID set
- [ ] Dashboard: GOOGLE_CLIENT_SECRET set
- [ ] All services restarted after variable updates

## Next Steps

After Google OAuth configuration:

1. **[Deploy Backend](./backend.md)** - Configure backend with OAuth credentials
2. **[Deploy Dashboard](./dashboard.md)** - Configure dashboard with OAuth credentials
3. **[Deploy Extension](./extension.md)** - Configure extension with OAuth (if needed)
4. **Test Complete Flow** - Verify OAuth works across all components

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server#security-considerations)

---

**Need Help?**
- OAuth configuration: Contact Frontend Engineer
- Google Cloud support: Google Cloud support console
- NextAuth issues: https://github.com/nextauthjs/next-auth/discussions
