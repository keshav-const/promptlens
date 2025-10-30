# Browser Extension Deployment Guide

## Overview

This guide covers building and publishing the PromptLens browser extension to the Chrome Web Store. The extension captures prompts from ChatGPT and Google Gemini and syncs them to the user's account.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Production Build Configuration](#production-build-configuration)
- [Build Extension Package](#build-extension-package)
- [Chrome Web Store Setup](#chrome-web-store-setup)
- [Create Store Listing](#create-store-listing)
- [Submit for Review](#submit-for-review)
- [Publication and Distribution](#publication-and-distribution)
- [Post-Publish Updates](#post-publish-updates)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access
- [ ] Chrome Web Store Developer account ($5 one-time fee)
- [ ] Backend API deployed and accessible (see [backend.md](./backend.md))
- [ ] Dashboard deployed (see [dashboard.md](./dashboard.md))
- [ ] Google account for developer registration

### Required Assets
Prepare these assets before starting:

```
Icon sizes required:
- 16x16 px (toolbar icon)
- 32x32 px (Windows display)
- 48x48 px (extension management page)
- 128x128 px (Chrome Web Store, install dialog)

Screenshots:
- 1280x800 px or 640x400 px
- At least 1 screenshot required
- Recommended: 3-5 screenshots showing key features

Promotional images (optional but recommended):
- Small tile: 440x280 px
- Marquee: 1400x560 px
- Featured tile: 960x540 px

Documents:
- Privacy policy (hosted URL)
- Terms of service (optional)
```

### Developer Account Registration

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay $5 registration fee
3. Complete developer profile
4. Agree to terms of service

## Production Build Configuration

### Step 1: Update Environment Variables

Create production environment file:

```bash
cd extension

# Create production environment
cat > .env.production << 'EOF'
# Production Backend API
VITE_API_BASE_URL=https://api.promptlens.app

# Extension ID (will be set after first publish)
VITE_EXTENSION_ID=
EOF
```

### Step 2: Update Manifest.json

Verify production settings in `public/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "PromptLens",
  "version": "1.0.0",
  "description": "Capture and manage your AI prompts from ChatGPT and Google Gemini",
  "permissions": [
    "storage",
    "identity",
    "tabs"
  ],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://gemini.google.com/*",
    "https://api.promptlens.app/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://chatgpt.com/*",
        "https://gemini.google.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "openid",
      "email",
      "profile"
    ]
  },
  "key": "YOUR_PUBLIC_KEY_HERE"
}
```

**Important Updates:**
- Update `host_permissions` with production API URL
- Update `oauth2.client_id` with production Google OAuth client ID
- Set appropriate `version` (start with "1.0.0")
- Add `key` field for consistent extension ID (see below)

### Step 3: Generate Extension Key (For Consistent ID)

To maintain the same extension ID across updates:

```bash
# Generate private key
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out extension-key.pem

# Generate public key for manifest
openssl rsa -in extension-key.pem -pubout -outform DER | openssl base64 -A

# Copy output to manifest.json "key" field
```

⚠️ **Security**: Store `extension-key.pem` securely and never commit to version control!

Add to `.gitignore`:
```bash
echo "extension-key.pem" >> .gitignore
```

### Step 4: Update API Configuration

Ensure API calls use production URL:

```typescript
// src/config/api.ts (example)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.promptlens.app';
```

### Step 5: Remove Development Code

```typescript
// Remove console.log statements
// Remove debug flags
// Remove test/mock data
// Ensure error handling for production
```

## Build Extension Package

### Step 1: Install Dependencies

```bash
cd extension
npm install
```

### Step 2: Run Tests

```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

All checks must pass before building.

### Step 3: Build Production Bundle

```bash
# Build with production environment
npm run build

# This creates optimized bundle in dist/ folder
```

### Step 4: Verify Build Output

```bash
cd dist
ls -la

# Should contain:
# - manifest.json
# - background.js
# - content.js
# - popup.html
# - popup.js (or bundled JS)
# - icons/
# - Any other static assets
```

### Step 5: Test Built Extension Locally

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `extension/dist` folder
5. Test extension functionality:
   - Visit ChatGPT and capture a prompt
   - Visit Google Gemini and capture a prompt
   - Open popup and verify UI
   - Test login flow
   - Verify API calls go to production

### Step 6: Create Distribution Package

```bash
cd dist

# Create ZIP file for Chrome Web Store
zip -r promptlens-extension-v1.0.0.zip .

# Move to releases folder
mv promptlens-extension-v1.0.0.zip ../releases/

# Verify ZIP contents
unzip -l ../releases/promptlens-extension-v1.0.0.zip
```

## Chrome Web Store Setup

### Step 1: Access Developer Dashboard

Go to: https://chrome.google.com/webstore/devconsole

### Step 2: Create New Item

1. Click "New Item" button
2. Upload ZIP file: `promptlens-extension-v1.0.0.zip`
3. Wait for upload to complete
4. You'll be redirected to the item configuration page

### Step 3: Get Extension ID

After upload, note the extension ID:
```
Extension ID: abcdefghijklmnopqrstuvwxyz123456
```

**Important**: Update this ID in your configuration:

```bash
# Update extension environment
echo "VITE_EXTENSION_ID=abcdefghijklmnopqrstuvwxyz123456" >> .env.production

# Update backend ALLOWED_ORIGINS
# Railway:
railway variables set ALLOWED_ORIGINS="https://dashboard.promptlens.app,chrome-extension://abcdefghijklmnopqrstuvwxyz123456"

# Render: Update via dashboard
```

## Create Store Listing

### Step 1: Product Details

```
Store Listing:
  Language: English (United States)
  
Item Details:
  Name: PromptLens
  
  Summary (132 chars max):
  Capture and organize your AI prompts from ChatGPT and Google Gemini. Never lose a great prompt again!
  
  Description (16,000 chars max):
  PromptLens helps you capture, organize, and reuse your best AI prompts from ChatGPT and Google Gemini.
  
  ✨ Features:
  • Automatic prompt capture from ChatGPT and Google Gemini
  • Cloud sync across devices
  • Organize prompts with tags and folders
  • Search your prompt history
  • Export prompts for backup
  • Pro plan for unlimited storage
  
  🔒 Privacy:
  Your prompts are securely stored and never shared with third parties.
  
  💎 Pro Plan:
  Upgrade to Pro for unlimited prompt storage and advanced features ($9.99/month)
  
  📧 Support:
  Questions? Contact us at support@promptlens.app
  
  Category: Productivity
  
  Language: English
```

### Step 2: Upload Assets

#### Icons
Upload icon sizes (must be exact dimensions):
```
Small Icon (128x128): icons/icon-128.png
```

#### Screenshots
Upload 1-5 screenshots (1280x800 or 640x400):
```
1. Main dashboard view
2. Prompt capture in action (ChatGPT)
3. Prompt capture in action (Gemini)
4. Popup interface
5. Settings/upgrade screen
```

**Screenshot Tips:**
- Show actual extension UI
- Highlight key features
- Use clear, readable text
- Add captions if helpful

#### Promotional Images (Optional)
```
Small Promo Tile (440x280): promo-small.png
Marquee (1400x560): promo-marquee.png
```

### Step 3: Privacy Practices

```
Single Purpose Description:
PromptLens captures and syncs AI prompts from ChatGPT and Google Gemini to help users organize and reuse their conversations.

Permission Justifications:
  
  storage:
  Reason: Store user settings and cached prompt data locally
  
  identity:
  Reason: Authenticate users with Google OAuth for cloud sync
  
  tabs:
  Reason: Detect when user navigates to ChatGPT or Gemini to enable prompt capture
  
Host Permissions (https://chatgpt.com/*, https://gemini.google.com/*):
  Reason: Inject content scripts to capture prompts from these AI platforms

Remote Code: No

Data Usage:
  ✅ User's prompts are collected and synced to cloud storage
  ✅ Authentication handled via Google OAuth
  ❌ No data sold to third parties
  ❌ No data used for personalization or advertising
```

### Step 4: Privacy Policy

You must provide a privacy policy URL. Host at:
```
https://promptlens.app/privacy
```

**Privacy Policy Template** (customize as needed):
```markdown
# Privacy Policy for PromptLens

Last Updated: [Date]

## Data Collection
PromptLens collects:
- Prompts you create in ChatGPT and Google Gemini
- Your email address (via Google OAuth)
- Usage statistics (prompt count, last sync time)

## Data Usage
Your data is used to:
- Sync prompts across your devices
- Provide search and organization features
- Improve the service

## Data Sharing
We never sell your data. We may share data with:
- Service providers (hosting, analytics)
- Law enforcement (if legally required)

## Data Security
Your data is encrypted in transit (TLS) and at rest.

## Your Rights
You can:
- Export your data
- Delete your account and all data
- Opt out of analytics

## Contact
support@promptlens.app
```

### Step 5: Distribution

```
Visibility:
  ○ Public (available to everyone)
  ○ Unlisted (only accessible via direct link)
  
Geographic Distribution:
  ✅ All regions
  
Pricing:
  Free (with optional in-app purchases for Pro plan)
```

## Submit for Review

### Step 1: Review Checklist

Before submitting, verify:

- [ ] Extension package uploaded
- [ ] All required fields completed
- [ ] Icons uploaded (all sizes)
- [ ] Screenshots uploaded (at least 1)
- [ ] Privacy policy URL provided and accessible
- [ ] Permissions justified
- [ ] Version number set (e.g., 1.0.0)
- [ ] Extension tested in Chrome
- [ ] No console errors when running
- [ ] API calls work correctly

### Step 2: Submit for Review

1. Click "Submit for Review"
2. Review submission summary
3. Confirm submission

**Review Timeline:**
- Typical: 1-3 business days
- Complex extensions: Up to 7 days
- First submission: May take longer

### Step 3: Monitor Review Status

Check dashboard for review status:
```
Status: Under Review
  ↓
Status: Pending Developer Response (if issues found)
  ↓
Status: Published (approved!)
```

### Step 4: Address Review Feedback

If reviewers request changes:

1. Read feedback carefully
2. Make requested changes locally
3. Rebuild extension
4. Increment version (e.g., 1.0.0 → 1.0.1)
5. Upload new ZIP
6. Respond to reviewers
7. Resubmit

## Publication and Distribution

### Step 1: Publish Announcement

After approval, announce launch:

```
Channels:
- Website banner
- Email to beta users
- Social media
- Product Hunt (optional)
- Reddit /r/SideProject (follow rules)
```

### Step 2: Monitor Initial Reviews

Watch for:
- User reviews (respond to feedback)
- Bug reports
- Feature requests
- Performance issues

### Step 3: Update Documentation

Update links to published extension:

```markdown
# In README.md
[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/promptlens/[extension-id])
```

### Step 4: Set Up Analytics (Optional)

Track extension usage:

```javascript
// src/utils/analytics.ts
export function trackEvent(event: string, data?: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
  }
}
```

## Post-Publish Updates

### Releasing Updates

1. **Make changes** to extension code
2. **Increment version** in manifest.json:
   ```json
   {
     "version": "1.0.1"  // Bug fix
     // or "1.1.0"       // New feature
     // or "2.0.0"       // Breaking change
   }
   ```
3. **Test changes** locally
4. **Build new package**: `npm run build`
5. **Create new ZIP**: `zip -r promptlens-v1.0.1.zip dist/`
6. **Upload to Chrome Web Store**
7. **Submit for review**

### Update Review

Updates also require review but typically faster (< 1 day).

### Staged Rollout (Optional)

Chrome Web Store supports staged rollouts:

```
1. Upload update
2. Set rollout percentage: 10% → 50% → 100%
3. Monitor for issues
4. Increase percentage if stable
```

### Hotfix Process

For critical bugs:

1. Fix issue immediately
2. Increment patch version (1.0.1 → 1.0.2)
3. Submit with note: "Critical bug fix"
4. Monitor review closely
5. May get expedited review for security issues

## Troubleshooting

### Upload Failed

**Problem**: ZIP file rejected during upload

```bash
# Solutions:

# 1. Verify manifest.json is valid
cat dist/manifest.json | jq .

# 2. Check file structure (manifest.json must be in root)
unzip -l promptlens-v1.0.0.zip | head

# 3. Ensure all referenced files exist
# Check manifest references: icons, scripts, etc.

# 4. Remove unnecessary files
# No source maps, .DS_Store, etc. in production ZIP
```

### Review Rejected

**Problem**: Extension rejected during review

Common reasons and solutions:

```
Reason: "Permissions not justified"
Solution: Provide detailed explanation in permission justification field

Reason: "Privacy policy incomplete"
Solution: Ensure privacy policy covers all data collection clearly

Reason: "Single purpose unclear"
Solution: Clarify one main purpose of extension

Reason: "Misleading functionality"
Solution: Ensure screenshots and description match actual functionality

Reason: "Violates program policies"
Solution: Review Chrome Web Store policies and address violations
```

### Extension Not Loading After Install

**Problem**: Users report extension doesn't work after install

```bash
# Solutions:

# 1. Verify API URL is correct in production build
# Should be: https://api.promptlens.app

# 2. Check CORS configuration allows extension origin
# Backend ALLOWED_ORIGINS should include:
# chrome-extension://[extension-id]

# 3. Verify OAuth client ID is correct
# manifest.json oauth2.client_id should match production credentials

# 4. Check content script matches
# manifest.json matches should include target websites

# 5. Review extension errors
# Chrome → Extensions → Details → Errors
```

### API Calls Failing

**Problem**: Extension can't connect to backend

```bash
# Solutions:

# 1. Verify API_BASE_URL in build
console.log(import.meta.env.VITE_API_BASE_URL)
# Should output: https://api.promptlens.app

# 2. Test API directly
curl https://api.promptlens.app/health

# 3. Check CORS in backend logs
# Should allow: chrome-extension://[id]

# 4. Verify SSL certificate valid
# Chrome won't allow requests to invalid HTTPS
```

### OAuth Not Working

**Problem**: Google login fails in extension

```bash
# Solutions:

# 1. Verify oauth2 configuration in manifest.json
# client_id should match Google Cloud Console

# 2. Add extension origin to Google OAuth consent screen
# Google Cloud Console → APIs & Credentials → OAuth consent screen
# Add: chrome-extension://[extension-id]

# 3. Check identity permission
# manifest.json permissions should include "identity"

# 4. Test OAuth flow
# Open popup → Click sign in → Should redirect to Google
```

## Deployment Checklist

### Pre-Submission
- [ ] Production API URL configured
- [ ] OAuth client ID updated
- [ ] Extension key generated (for consistent ID)
- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] Extension tested locally with production API
- [ ] No console errors or warnings
- [ ] Privacy policy hosted and accessible
- [ ] All assets prepared (icons, screenshots)

### Store Listing
- [ ] Developer account registered ($5 fee paid)
- [ ] Extension package uploaded
- [ ] Product name and description written
- [ ] Category selected (Productivity)
- [ ] Icons uploaded (all required sizes)
- [ ] Screenshots uploaded (at least 1, recommended 3-5)
- [ ] Privacy policy URL provided
- [ ] Permissions justified
- [ ] Single purpose description clear
- [ ] Distribution settings configured

### Submission
- [ ] Review checklist completed
- [ ] Extension ID noted and saved
- [ ] Backend CORS updated with extension ID
- [ ] Submitted for review
- [ ] Review status monitored

### Post-Publication
- [ ] Installation tested from Chrome Web Store
- [ ] Full user flow tested (install → login → capture → sync)
- [ ] Launch announcement prepared
- [ ] Documentation updated with store link
- [ ] User feedback monitoring set up
- [ ] Update process documented

## Next Steps

After extension publication:

1. **Monitor User Feedback** - Respond to reviews and bug reports
2. **Plan Updates** - Schedule feature releases and improvements
3. **User Onboarding** - Create tutorial/welcome flow for new users
4. **Analytics** - Track usage metrics and engagement

## Additional Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Chrome Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/devguide/)
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Extension README](../extension/README.md)

---

**Need Help?**
- Extension issues: Contact Frontend Engineer
- Chrome Web Store support: chrome-webstore-support@google.com
- Policy questions: Review program policies and contact support
