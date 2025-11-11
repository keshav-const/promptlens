# Web Dashboard Deployment Guide

## Overview

This guide covers deploying the PromptLens web dashboard (Next.js application) to Vercel. The dashboard provides user authentication, prompt management, and subscription management interfaces.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Preparation](#pre-deployment-preparation)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Custom Domain Setup](#custom-domain-setup)
- [NextAuth Configuration](#nextauth-configuration)
- [Preview vs Production](#preview-vs-production)
- [Smoke Tests](#smoke-tests)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services
- [ ] Backend API deployed and accessible (see [backend.md](./backend.md))
- [ ] MongoDB database configured (see [database.md](./database.md))
- [ ] Google OAuth credentials (see [google-oauth.md](./google-oauth.md))
- [ ] Razorpay configured (see [razorpay.md](./razorpay.md))
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] GitHub repository access

### Required Secrets
Gather these secrets before deployment:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://dashboard.promptlens.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# Backend API
NEXT_PUBLIC_API_BASE_URL=https://api.promptlens.app

# Razorpay (from Razorpay Dashboard - live mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_abc123def456
```

### CLI Tools

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

## Pre-Deployment Preparation

### 1. Verify Local Build

```bash
cd web

# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Build production bundle
npm run build

# Test production build locally
npm start
# Visit http://localhost:3000
```

### 2. Verify Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Add production values
cat > .env.local << 'EOF'
NEXTAUTH_URL=https://dashboard.promptlens.app
NEXTAUTH_SECRET=[your-secret]
GOOGLE_CLIENT_ID=[your-client-id]
GOOGLE_CLIENT_SECRET=[your-client-secret]
NEXT_PUBLIC_API_BASE_URL=https://api.promptlens.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-key]
EOF

# Test with production-like values
npm run build
npm start
```

### 3. Update OAuth Redirect URIs

Before deploying, add production redirect URIs to Google Cloud Console:

```
Authorized redirect URIs:
https://dashboard.promptlens.app/api/auth/callback/google
https://[vercel-preview-url]/api/auth/callback/google (optional for previews)
```

See [google-oauth.md](./google-oauth.md) for detailed instructions.

## Vercel Deployment

### Option A: Deploy via Git Integration (Recommended)

#### Step 1: Import Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Configure import settings:

```
Project Name: promptlens-dashboard
Framework Preset: Next.js
Root Directory: web
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

#### Step 2: Configure Build Settings

```
Node.js Version: 20.x
Environment Variables: [Configure in next step]
```

#### Step 3: Add Environment Variables

In project settings, add all environment variables:

```
NEXTAUTH_URL=https://dashboard.promptlens.app
NEXTAUTH_SECRET=[your-secret]
GOOGLE_CLIENT_ID=[your-client-id]
GOOGLE_CLIENT_SECRET=[your-client-secret]
NEXT_PUBLIC_API_BASE_URL=https://api.promptlens.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-key]
```

**Important**: 
- Mark sensitive variables as "Secret" (NEXTAUTH_SECRET, GOOGLE_CLIENT_SECRET)
- `NEXT_PUBLIC_*` variables are exposed to browser (non-sensitive only)

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Visit deployment URL (e.g., `https://promptlens-dashboard.vercel.app`)

### Option B: Deploy via Vercel CLI

```bash
cd web

# Login
vercel login

# Link project
vercel link

# Add environment variables
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# Deploy to production
vercel --prod

# Visit deployment URL shown in output
```

## Environment Variables Configuration

### Production Environment Variables

Configure these in Vercel dashboard: Project → Settings → Environment Variables

| Variable | Value | Scope | Encrypted |
|----------|-------|-------|-----------|
| `NEXTAUTH_URL` | `https://dashboard.promptlens.app` | Production | No |
| `NEXTAUTH_SECRET` | `[32-byte base64 string]` | Production, Preview | Yes |
| `GOOGLE_CLIENT_ID` | `[from GCP Console]` | Production, Preview | No |
| `GOOGLE_CLIENT_SECRET` | `[from GCP Console]` | Production, Preview | Yes |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.promptlens.app` | Production | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_[key]` | Production | No |

### Preview Environment (Optional)

For preview deployments (PR previews), you may want separate values:

```
NEXTAUTH_URL=[leave auto-generated by Vercel]
NEXT_PUBLIC_API_BASE_URL=https://api-staging.promptlens.app (if you have staging)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[key] (use test key)
```

### Environment Variable Precedence

Vercel environment variables have precedence:
1. Production (only on production deployments)
2. Preview (PR previews and branch deployments)
3. Development (local `vercel dev`)

## Custom Domain Setup

### Step 1: Add Domain in Vercel

1. Project → Settings → Domains
2. Click "Add Domain"
3. Enter: `dashboard.promptlens.app`
4. Click "Add"

### Step 2: Configure DNS

Vercel will provide DNS instructions. Typically:

**Option A: CNAME Record (Recommended)**
```
Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
TTL: 3600
```

**Option B: A Record**
```
Type: A
Name: dashboard
Value: 76.76.21.21
TTL: 3600
```

### Step 3: Verify Domain

1. Wait for DNS propagation (5-30 minutes)
2. Vercel will automatically provision SSL certificate
3. Verify HTTPS works: https://dashboard.promptlens.app

### Step 4: Update Environment Variables

After domain is active:

```bash
# Update NEXTAUTH_URL
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
# Enter: https://dashboard.promptlens.app

# Redeploy to apply changes
vercel --prod
```

### Step 5: Update OAuth Redirect URIs

Update Google Cloud Console with custom domain:
```
https://dashboard.promptlens.app/api/auth/callback/google
```

### Step 6: Update Backend CORS

Update backend's `ALLOWED_ORIGINS`:
```bash
# Railway
railway variables set ALLOWED_ORIGINS="https://dashboard.promptlens.app,chrome-extension://[ID]"

# Or in Render dashboard
```

## NextAuth Configuration

### Callback URLs

Ensure NextAuth is configured for production:

```javascript
// web/pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Custom JWT logic
      return token;
    },
    async session({ session, token }) {
      // Custom session logic
      return session;
    },
  },
});
```

### Session Configuration

```javascript
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 days
},
```

### Testing NextAuth

```bash
# Test login flow
# 1. Visit https://dashboard.promptlens.app
# 2. Click "Sign in with Google"
# 3. Complete OAuth flow
# 4. Verify redirect back to dashboard
# 5. Check session cookie set
```

## Preview vs Production

### Branch Deployments

Vercel automatically deploys:
- **Production**: `main` branch → `dashboard.promptlens.app`
- **Preview**: Other branches/PRs → `promptlens-dashboard-[hash].vercel.app`

### Configure Production Branch

```
Project → Settings → Git
Production Branch: main
```

### Preview Deployment Settings

```
Project → Settings → Git
Ignored Build Step: [optional script to skip unnecessary builds]
```

### Environment Variables per Branch

```
Production:
  NEXT_PUBLIC_API_BASE_URL=https://api.promptlens.app
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

Preview:
  NEXT_PUBLIC_API_BASE_URL=https://api-staging.promptlens.app
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Smoke Tests

Run these tests after each deployment:

### Manual Smoke Test Checklist

```bash
# Base URL
DASHBOARD_URL="https://dashboard.promptlens.app"

# 1. Homepage loads
curl -I $DASHBOARD_URL
# Expected: 200 OK

# 2. Static assets load
curl -I $DASHBOARD_URL/_next/static/
# Expected: 200 OK

# 3. OAuth login page accessible
# Visit: $DASHBOARD_URL and click "Sign in with Google"
# Expected: Redirects to Google OAuth consent screen

# 4. Dashboard page accessible (after login)
# Expected: Shows user profile, prompts list

# 5. Upgrade button works
# Expected: Redirects to Stripe checkout

# 6. Logout works
# Expected: Clears session, redirects to home
```

### Automated Smoke Test Script

```javascript
// deployment/scripts/smoke-test-dashboard.js
const puppeteer = require('puppeteer');

async function runSmokeTests() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    // Test 1: Homepage loads
    console.log('✓ Testing homepage...');
    await page.goto('https://dashboard.promptlens.app');
    await page.waitForSelector('body');
    console.log('✅ Homepage loads');
    
    // Test 2: Sign in button exists
    console.log('✓ Testing sign in button...');
    const signInButton = await page.$('button:contains("Sign in")');
    if (signInButton) {
      console.log('✅ Sign in button found');
    }
    
    // Add more tests as needed...
    
    console.log('🎉 All smoke tests passed!');
  } catch (error) {
    console.error('❌ Smoke test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runSmokeTests();
```

### Playwright E2E Tests

If you have E2E tests configured:

```bash
cd web

# Run E2E tests against production
PLAYWRIGHT_BASE_URL=https://dashboard.promptlens.app npm run test:e2e

# Or update playwright.config.ts:
# use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000' }
```

## Performance Optimization

### Enable Edge Runtime (Optional)

For API routes that benefit from edge deployment:

```javascript
// pages/api/some-route.ts
export const config = {
  runtime: 'edge',
};
```

### Image Optimization

Ensure Next.js Image component is used:

```javascript
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="PromptLens"
  width={200}
  height={50}
  priority
/>
```

### Code Splitting

Verify code splitting is working:

```bash
# After build, check bundle sizes
npm run build

# Output should show individual page bundles
# Page                                       Size     First Load JS
# ┌ ○ /                                      5.2 kB          85 kB
# ├ ○ /dashboard                            12 kB           92 kB
# └ ○ /api/auth/[...nextauth]                0 B           80 kB
```

### Static Page Generation

Optimize static pages:

```javascript
// pages/index.tsx
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 3600, // Revalidate every hour
  };
}
```

## Monitoring

### Vercel Analytics

Enable Analytics:
1. Project → Analytics
2. Enable Web Vitals tracking
3. Review metrics:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)
   - First Input Delay (FID)

### Real User Monitoring (RUM)

Integrate RUM for production insights:

```javascript
// pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### Error Tracking

Consider integrating error tracking:

```bash
# Example: Sentry
npm install @sentry/nextjs

# Configure in next.config.js
```

### Uptime Monitoring

Set up external uptime monitoring:

```bash
# Example services:
# - UptimeRobot (free)
# - Pingdom
# - StatusCake

# Monitor:
# https://dashboard.promptlens.app (every 5 minutes)
```

### Rate Limiting

NextAuth has built-in rate limiting. Monitor for abuse:

```javascript
// pages/api/auth/[...nextauth].ts
export default NextAuth({
  // ...
  events: {
    signIn: async ({ user }) => {
      console.log(`User signed in: ${user.email}`);
    },
    signOut: async ({ session }) => {
      console.log(`User signed out`);
    },
  },
});
```

## Troubleshooting

### Build Fails

**Problem**: Build fails with TypeScript errors
```bash
# Solution: Fix TypeScript errors locally first
cd web
npm run typecheck
# Fix all errors, then commit and redeploy
```

**Problem**: Build fails with missing environment variable
```bash
# Solution: Ensure all required variables are set in Vercel
# Vercel Dashboard → Project → Settings → Environment Variables
```

### OAuth Redirect Error

**Problem**: `redirect_uri_mismatch` error during OAuth login
```bash
# Solution:
# 1. Check NEXTAUTH_URL matches deployment URL exactly
# 2. Verify Google Cloud Console has correct redirect URI:
#    https://dashboard.promptlens.app/api/auth/callback/google
# 3. Ensure no trailing slash in NEXTAUTH_URL
```

**Problem**: CSRF token error
```bash
# Solution:
# 1. Clear browser cookies
# 2. Verify NEXTAUTH_SECRET is set correctly
# 3. Check NEXTAUTH_URL matches actual deployment URL
```

### API Connection Issues

**Problem**: Dashboard can't connect to backend API
```bash
# Check NEXT_PUBLIC_API_BASE_URL is correct
echo $NEXT_PUBLIC_API_BASE_URL

# Test API directly
curl https://api.promptlens.app/health

# Verify CORS allows dashboard origin
# Backend should have: ALLOWED_ORIGINS=https://dashboard.promptlens.app
```

### Slow Page Loads

**Problem**: Dashboard loads slowly
```bash
# Solutions:
# 1. Check Web Vitals in Vercel Analytics
# 2. Optimize images (use Next.js Image component)
# 3. Enable code splitting
# 4. Review bundle size
npm run build
# Look for large bundles

# 5. Consider edge runtime for API routes
```

### Custom Domain Not Working

**Problem**: Custom domain shows "Domain not found"
```bash
# Solutions:
# 1. Verify DNS records are correct
nslookup dashboard.promptlens.app

# 2. Wait for DNS propagation (up to 48 hours, usually 5-30 min)

# 3. Check domain status in Vercel
# Project → Settings → Domains
# Should show "Valid Configuration"

# 4. Force refresh SSL certificate
# Vercel Dashboard → Domain → Refresh SSL
```

## Deployment Checklist

### Pre-Deployment
- [ ] Local build succeeds (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables documented
- [ ] Backend API accessible
- [ ] OAuth credentials configured

### Deployment
- [ ] Project imported to Vercel
- [ ] Environment variables configured
- [ ] Production branch set to `main`
- [ ] Build settings verified
- [ ] First deployment successful

### Post-Deployment
- [ ] Default Vercel URL accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] OAuth login flow works
- [ ] Dashboard displays after login
- [ ] Upgrade button creates Stripe session
- [ ] API calls succeed (check Network tab)
- [ ] Images load correctly
- [ ] No console errors

### Monitoring Setup
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (optional)
- [ ] Uptime monitoring configured (optional)
- [ ] Web Vitals reviewed

### Integration Testing
- [ ] User can sign up with Google
- [ ] User can view dashboard
- [ ] User can upgrade to Pro (Stripe checkout)
- [ ] User can view prompts
- [ ] User can logout
- [ ] Session persists across page reloads

## Next Steps

After dashboard deployment:

1. **[Deploy Extension](./extension.md)** - Deploy browser extension
2. **Update Extension** - Point extension to production dashboard URL
3. **End-to-End Testing** - Test complete user flow from extension to dashboard

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Web Dashboard README](../web/README.md)

---

**Need Help?**
- Dashboard issues: Contact Frontend Engineer
- Vercel support: support@vercel.com
- NextAuth issues: https://github.com/nextauthjs/next-auth/discussions
