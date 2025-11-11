# Phase 1 Deployment Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Deployment Timeline](#deployment-timeline)
- [Responsible Parties](#responsible-parties)
- [Prerequisites](#prerequisites)
- [Environment Variables Matrix](#environment-variables-matrix)
- [Deployment Components](#deployment-components)
- [Deployment Order](#deployment-order)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedures](#rollback-procedures)

## Overview

This guide provides a comprehensive, step-by-step deployment strategy for the **PromptLens** application Phase 1 (Phase B) production release. PromptLens is a browser extension with a web dashboard that helps users manage their AI prompts across ChatGPT and Google Gemini platforms.

**Phase 1 Goals:**
- Deploy production-ready backend API to Railway or Render
- Set up MongoDB Atlas production database cluster
- Deploy web dashboard to Vercel
- Configure Stripe for live payment processing ($9.99/mo Pro subscription)
- Publish browser extension to Chrome Web Store
- Enable Google OAuth for production authentication

## Architecture

### High-Level System Architecture

```
┌─────────────────┐
│  Chrome Web     │◄──────────┐
│  Store          │           │
└────────┬────────┘           │
         │                    │
         │ Extension          │
         ▼                    │
┌─────────────────┐           │
│  Browser        │           │
│  Extension      │           │
│  (React/Vite)   │           │
└────────┬────────┘           │
         │                    │
         │ API Calls          │
         │                    │
         ▼                    │
┌─────────────────┐     ┌─────┴──────────┐
│  Backend API    │     │  Web Dashboard │
│  (Node/Express) │◄────┤  (Next.js)     │
│  Railway/Render │     │  Vercel        │
└────────┬────────┘     └────────────────┘
         │                     │
         │                     │
         ▼                     ▼
┌─────────────────┐     ┌──────────────────┐
│  MongoDB Atlas  │     │  Google OAuth    │
│  Production     │     │  Consent Screen  │
└─────────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Stripe         │
│  Live Mode      │
└─────────────────┘
```

### Component Dependencies

1. **Database (MongoDB Atlas)** - Must be deployed first
2. **Google OAuth** - Must be configured before backend/dashboard
3. **Backend API** - Depends on Database and OAuth
4. **Stripe** - Configured after backend deployment
5. **Web Dashboard** - Depends on Backend API, OAuth, and Stripe
6. **Browser Extension** - Depends on Backend API

## Deployment Timeline

### Pre-Deployment Phase (Days 1-2)
- [ ] Complete infrastructure provisioning (Railway/Render, Vercel, MongoDB Atlas accounts)
- [ ] Generate all production secrets and environment variables
- [ ] Set up secret management strategy
- [ ] Review and test all deployment scripts

### Deployment Phase (Day 3)
- [ ] **Morning (9am-12pm)**: Deploy database, configure OAuth, deploy backend
- [ ] **Afternoon (1pm-3pm)**: Configure Stripe, deploy web dashboard
- [ ] **Afternoon (3pm-5pm)**: Deploy extension, run smoke tests
- [ ] **Evening (5pm-7pm)**: Monitor logs, handle issues

### Post-Deployment Phase (Days 4-5)
- [ ] Monitor metrics and logs for 48 hours
- [ ] Verify payment processing with test accounts
- [ ] Conduct user acceptance testing
- [ ] Update documentation with production URLs

## Responsible Parties

| Role | Responsibilities | Contact |
|------|------------------|---------|
| **Technical Lead** | Overall deployment coordination, architecture decisions, rollback authority | [Name/Email] |
| **Backend Engineer** | Backend/database deployment, API health monitoring, webhook configuration | [Name/Email] |
| **Frontend Engineer** | Dashboard/extension deployment, OAuth configuration, UI testing | [Name/Email] |
| **DevOps Engineer** | Infrastructure provisioning, CI/CD setup, monitoring alerts | [Name/Email] |
| **Product Manager** | Deployment sign-off, user communications, rollback decisions | [Name/Email] |

## Prerequisites

### Required Accounts & Access

- [ ] **Railway** or **Render** account with credit card for backend hosting
- [ ] **Vercel** account (free tier or Pro) for dashboard hosting
- [ ] **MongoDB Atlas** account with M10+ cluster provisioned
- [ ] **Stripe** account with business verification completed
- [ ] **Google Cloud Console** project with OAuth consent screen approved
- [ ] **Chrome Web Store Developer** account ($5 one-time fee)
- [ ] **GitHub** repository access with deployment branch permissions

### Required Tooling

Install the following CLI tools before beginning deployment:

```bash
# Railway CLI (if using Railway)
npm install -g @railway/cli
railway login

# Render CLI (if using Render)
# Visit https://render.com/docs/cli for installation

# Vercel CLI
npm install -g vercel
vercel login

# MongoDB Atlas CLI (optional, for database management)
brew install mongodb-atlas-cli
atlas auth login

# Stripe CLI (for webhook testing)
brew install stripe/stripe-cli/stripe
stripe login

# Google Cloud SDK (for OAuth management)
# Visit https://cloud.google.com/sdk/docs/install

# Node.js version manager
nvm install 20
nvm use 20
```

### Local Setup Verification

Before deploying, verify your local environment is properly configured:

```bash
# Clone repository
git clone <repository-url>
cd <repository-name>

# Install dependencies
npm install

# Run all tests
npm run test

# Verify builds succeed
npm run build:all

# Check linting and type checking
npm run lint
npm run typecheck
```

All commands should complete successfully before proceeding with production deployment.

## Environment Variables Matrix

### Variable Reference Table

| Variable | Component | Purpose | Secret Manager Location | Production Value Owner | Example Value |
|----------|-----------|---------|-------------------------|----------------------|---------------|
| `NODE_ENV` | Backend | Environment mode | Railway/Render | DevOps | `production` |
| `PORT` | Backend | Server port | Railway/Render | DevOps | `3000` |
| `MONGODB_URI` | Backend | Database connection | Railway/Render + Vault | Backend Engineer | `mongodb+srv://user:pass@cluster.mongodb.net/promptlens?retryWrites=true&w=majority` |
| `GEMINI_API_KEY` | Backend | AI service key | Railway/Render | Backend Engineer | `AIzaSy...` |
| `STRIPE_SECRET_KEY` | Backend | Stripe API key | Railway/Render | Backend Engineer | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Backend, Web | Stripe public key | Railway/Render, Vercel | Backend Engineer | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Backend | Webhook verification | Railway/Render | Backend Engineer | `whsec_...` |
| `STRIPE_PRICE_ID` | Backend | Pro plan price ID | Railway/Render | Backend Engineer | `price_...` |
| `NEXTAUTH_URL` | Backend, Web | Dashboard URL | Railway/Render, Vercel | Frontend Engineer | `https://dashboard.promptlens.app` |
| `NEXTAUTH_SECRET` | Backend, Web | NextAuth encryption | Railway/Render, Vercel | DevOps | `[32-byte base64]` |
| `JWT_SECRET` | Backend | Token signing | Railway/Render | DevOps | `[32-byte base64]` |
| `JWT_EXPIRES_IN` | Backend | Token expiration | Railway/Render | Backend Engineer | `7d` |
| `ALLOWED_ORIGINS` | Backend | CORS origins | Railway/Render | Backend Engineer | `https://dashboard.promptlens.app,chrome-extension://[ID]` |
| `RATE_LIMIT_WINDOW_MS` | Backend | Rate limit window | Railway/Render | Backend Engineer | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Backend | Max requests/window | Railway/Render | Backend Engineer | `100` |
| `GOOGLE_CLIENT_ID` | Web | OAuth client ID | Vercel | Frontend Engineer | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Web | OAuth client secret | Vercel | Frontend Engineer | `GOCSPX-...` |
| `NEXT_PUBLIC_API_BASE_URL` | Web | Backend API URL | Vercel | Frontend Engineer | `https://api.promptlens.app` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Web | Razorpay public key | Vercel | Frontend Engineer | `rzp_live_...` |
| `VITE_API_BASE_URL` | Extension | Backend API URL | Build-time | Frontend Engineer | `https://api.promptlens.app` |
| `VITE_EXTENSION_ID` | Extension | Chrome extension ID | Build-time | Frontend Engineer | `abcdefghijklmnop` |

### Secret Generation Commands

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate random API key (if needed)
openssl rand -hex 32
```

### Secret Storage Strategy

1. **Primary Storage**: Store all secrets in a password manager or secret vault (1Password, AWS Secrets Manager, etc.)
2. **Deployment**: Copy secrets to respective platforms (Railway/Render, Vercel)
3. **Backup**: Maintain encrypted backup of all secrets in team-accessible location
4. **Rotation**: Plan to rotate secrets every 90 days or immediately upon suspected compromise

## Deployment Components

The complete deployment consists of six interconnected components. Detailed guides are available in the `deployment/` directory:

### 1. Database (MongoDB Atlas)
**Guide**: [`deployment/database.md`](../deployment/database.md)

- Create production cluster (M10+ recommended)
- Configure network access and authentication
- Set up indexes and backup policies
- Generate and store connection string

### 2. Google OAuth Configuration
**Guide**: [`deployment/google-oauth.md`](../deployment/google-oauth.md)

- Publish OAuth consent screen for production
- Configure authorized redirect URIs
- Generate production credentials
- Test authentication flow

### 3. Backend API (Railway/Render)
**Guide**: [`deployment/backend.md`](../deployment/backend.md)

- Deploy Node.js/Express application
- Configure environment variables
- Set up health check endpoint
- Configure custom domain and CORS
- Register Stripe webhook URL

### 4. Stripe Configuration
**Guide**: [`deployment/stripe.md`](../deployment/stripe.md)

- Switch to live mode
- Create $9.99/mo Product and Price
- Enable customer portal
- Configure production webhook
- Test payment flow

### 5. Web Dashboard (Vercel)
**Guide**: [`deployment/dashboard.md`](../deployment/dashboard.md)

- Deploy Next.js application
- Configure environment variables
- Set up custom domain
- Configure NextAuth callbacks
- Run smoke tests

### 6. Browser Extension (Chrome Web Store)
**Guide**: [`deployment/extension.md`](../deployment/extension.md)

- Build production extension package
- Update manifest with production URLs
- Create Chrome Web Store listing
- Submit for review
- Publish to users

## Deployment Order

Follow this order to ensure dependencies are met:

```mermaid
graph TD
    A[1. MongoDB Atlas] --> B[2. Google OAuth]
    B --> C[3. Backend API]
    C --> D[4. Stripe Configuration]
    C --> E[5. Web Dashboard]
    D --> E
    C --> F[6. Browser Extension]
```

### Step-by-Step Deployment Sequence

#### Step 1: Deploy MongoDB Atlas (30 minutes)
```bash
# Follow deployment/database.md
# Key actions:
# - Create M10 cluster in preferred region
# - Create database user with strong password
# - Configure IP whitelist (0.0.0.0/0 for cloud services)
# - Test connection string locally
```

**Verification**: Connection string successfully connects from local machine

#### Step 2: Configure Google OAuth (45 minutes)
```bash
# Follow deployment/google-oauth.md
# Key actions:
# - Publish OAuth consent screen
# - Add production redirect URIs
# - Generate client ID and secret
# - Test OAuth flow in staging
```

**Verification**: Can authenticate with Google in test environment

#### Step 3: Deploy Backend API (60 minutes)
```bash
# Follow deployment/backend.md
cd backend

# Build production bundle
npm run build

# Deploy to Railway/Render via CLI or Git push
# Configure all environment variables
# Set up health check endpoint: /health

# Verify deployment
curl https://api.promptlens.app/health
```

**Verification**: API health check returns 200, logs show successful MongoDB connection

#### Step 4: Configure Stripe (45 minutes)
```bash
# Follow deployment/stripe.md
# Key actions:
# - Switch Stripe account to live mode
# - Create Pro subscription product ($9.99/mo)
# - Copy price_id to backend environment
# - Register webhook endpoint: https://api.promptlens.app/api/upgrade
# - Enable customer portal
```

**Verification**: Webhook endpoint receives test events successfully

#### Step 5: Deploy Web Dashboard (45 minutes)
```bash
# Follow deployment/dashboard.md
cd web

# Deploy via Vercel CLI or Git integration
vercel --prod

# Configure all environment variables in Vercel dashboard
# Set up custom domain
# Verify NextAuth callback URLs
```

**Verification**: Dashboard loads, Google login works, can navigate all pages

#### Step 6: Deploy Browser Extension (90 minutes)
```bash
# Follow deployment/extension.md
cd extension

# Update production API URL in .env
VITE_API_BASE_URL=https://api.promptlens.app

# Build production package
npm run build

# Create ZIP file
cd dist
zip -r promptlens-extension-v1.0.0.zip .

# Upload to Chrome Web Store Developer Dashboard
# Fill in listing details, upload screenshots
# Submit for review (typically 1-3 days)
```

**Verification**: Extension installs correctly, connects to production API, login works

## Post-Deployment Verification

### Automated Health Checks

Create a health check script to verify all services:

```bash
#!/bin/bash
# Save as deployment/verify-health.sh

echo "🔍 Verifying Phase 1 Deployment Health..."

# Backend API
echo "Checking Backend API..."
curl -f https://api.promptlens.app/health || echo "❌ Backend health check failed"

# Web Dashboard
echo "Checking Web Dashboard..."
curl -f https://dashboard.promptlens.app || echo "❌ Dashboard health check failed"

# Database connection (via API)
echo "Checking Database connectivity..."
curl -f https://api.promptlens.app/api/health/db || echo "❌ Database check failed"

# Stripe webhook
echo "Checking Stripe webhook endpoint..."
curl -X POST https://api.promptlens.app/api/upgrade || echo "⚠️  Webhook endpoint accessible (signature validation expected)"

echo "✅ Health checks complete!"
```

### Manual Verification Checklist

#### Backend Verification
- [ ] Health check endpoint returns 200 OK
- [ ] API logs show no errors or warnings
- [ ] MongoDB connection successful in logs
- [ ] CORS headers present in responses
- [ ] Rate limiting active (test with rapid requests)
- [ ] Authentication middleware protecting endpoints

#### Database Verification
- [ ] Connection string works from backend
- [ ] All indexes created successfully
- [ ] Backup policy active (check Atlas dashboard)
- [ ] Database user has correct permissions
- [ ] Network access configured correctly

#### Dashboard Verification
- [ ] Homepage loads without errors
- [ ] Google OAuth login flow completes
- [ ] Dashboard displays user profile after login
- [ ] All pages navigate correctly
- [ ] Stripe checkout button creates session
- [ ] Custom domain SSL certificate active

#### Stripe Verification
- [ ] Test payment with live card completes
- [ ] Webhook receives checkout.session.completed event
- [ ] User upgrades to Pro plan in database
- [ ] Subscription visible in Stripe dashboard
- [ ] Customer portal accessible from dashboard
- [ ] Cancellation webhook received and processed

#### Extension Verification
- [ ] Extension loads in Chrome
- [ ] Connects to production backend
- [ ] Login flow redirects to production dashboard
- [ ] Prompt capture works on ChatGPT
- [ ] Prompt capture works on Google Gemini
- [ ] API calls use production authentication

#### OAuth Verification
- [ ] Consent screen shows correct app name and logo
- [ ] OAuth redirect works for dashboard
- [ ] OAuth redirect works for extension (if applicable)
- [ ] Token refresh works after 1 hour
- [ ] Logout clears session correctly

### Monitoring Setup

Configure monitoring and alerting for production services:

#### Railway/Render Monitoring
- Enable built-in metrics dashboard
- Set up alerts for:
  - CPU usage > 80%
  - Memory usage > 90%
  - Response time > 2s
  - Error rate > 1%

#### Vercel Monitoring
- Enable Web Vitals monitoring
- Set up alerts for:
  - Build failures
  - Deployment errors
  - High response times

#### MongoDB Atlas Monitoring
- Enable alerts for:
  - Connection spikes
  - Slow queries (> 100ms)
  - High CPU usage
  - Low disk space

#### Stripe Dashboard
- Enable email notifications for:
  - Failed payments
  - Webhook errors
  - Dispute notifications

### Log Aggregation

Set up centralized logging:

```bash
# Backend logs (Railway example)
railway logs --tail

# Vercel logs
vercel logs <project-name> --follow

# MongoDB Atlas logs
# Access via Atlas UI: Clusters > [cluster] > Metrics
```

## Rollback Procedures

### When to Rollback

Execute rollback if any of the following occur within 24 hours of deployment:

- **Critical**: Database corruption or data loss
- **Critical**: Payment processing failures (> 10% failure rate)
- **Critical**: Complete service outage (> 5 minutes)
- **High**: Security vulnerability discovered
- **High**: Authentication failures preventing user access
- **Medium**: Major feature broken for > 50% of users

### Component Rollback Steps

#### Backend API Rollback
```bash
# Railway
railway rollback

# Render
# Via dashboard: Services > [service] > Events > Rollback

# Verify rollback
curl https://api.promptlens.app/health
```

#### Web Dashboard Rollback
```bash
# Vercel
vercel rollback <deployment-url>

# Or via dashboard: Deployments > [previous version] > Promote to Production
```

#### Database Rollback
```bash
# MongoDB Atlas
# 1. Go to Clusters > [cluster] > Backup
# 2. Select snapshot before deployment
# 3. Restore to new cluster
# 4. Update MONGODB_URI in backend
# 5. Redeploy backend with new connection string
```

⚠️ **Warning**: Database rollback results in data loss for any data created after snapshot.

#### Stripe Rollback
```bash
# 1. Switch back to test mode keys in backend environment
# 2. Update webhook endpoint to test URL
# 3. Communicate to users that payments are temporarily disabled
```

#### Extension Rollback
```bash
# 1. Access Chrome Web Store Developer Dashboard
# 2. Go to package listing
# 3. Select "Revert to previous version"
# 4. Submit for review (expedited for critical bugs)
```

Note: Extension rollback can take 1-3 days due to Chrome review process.

### Emergency Contacts

Maintain a contact list for emergency situations:

| Service | Emergency Contact | Support Channel |
|---------|------------------|-----------------|
| Railway/Render | support@railway.app / support@render.com | Priority support ticket |
| Vercel | support@vercel.com | Priority support ticket |
| MongoDB Atlas | support@mongodb.com | Critical incident phone |
| Stripe | https://support.stripe.com | Live chat + phone |
| Google Cloud | Google Cloud Support | Console support |
| Chrome Web Store | chrome-webstore-support@google.com | Email only |

### Post-Rollback Actions

After executing a rollback:

1. **Document the incident**: Record what went wrong, timeline, and impact
2. **Communicate to stakeholders**: Notify team and users of the issue and resolution
3. **Root cause analysis**: Identify what caused the need for rollback
4. **Create action items**: Define fixes and prevention measures
5. **Schedule re-deployment**: Plan corrected deployment after fixes are validated
6. **Update runbook**: Document lessons learned and improve procedures

## Additional Resources

- [Deployment Component Guides](../deployment/README.md)
- [Phase 1 Validation Runbook](./phase1-validation-runbook.md)
- [Backend API Documentation](../backend/API.md)
- [Backend README](../backend/README.md)
- [Web Dashboard README](../web/README.md)
- [Extension README](../extension/README.md)

## Questions or Issues?

If you encounter issues during deployment:

1. **Check the component-specific guide** in `deployment/` directory
2. **Review logs** for the specific component
3. **Consult the troubleshooting section** in the validation runbook
4. **Contact the responsible party** from the team matrix above
5. **Document the issue** for future reference

---

**Last Updated**: [Date]  
**Version**: 1.0.0  
**Maintained By**: [Team Name]
