# Backend API Deployment Guide

## Overview

This guide covers deploying the PromptLens backend API (Node.js/Express) to production using either Railway or Render. The backend handles authentication, prompt management, usage tracking, and Razorpay integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Preparation](#pre-deployment-preparation)
- [Option A: Deploy to Railway](#option-a-deploy-to-railway)
- [Option B: Deploy to Render](#option-b-deploy-to-render)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Health Check Verification](#health-check-verification)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling Configuration](#scaling-configuration)
- [Custom Domain Setup](#custom-domain-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services
- [ ] MongoDB Atlas production cluster running (see [database.md](./database.md))
- [ ] Google OAuth credentials configured (see [google-oauth.md](./google-oauth.md))
- [ ] Railway or Render account with payment method added
- [ ] Domain name for custom API URL (optional but recommended)

### Required Secrets
Gather the following secrets before beginning:

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/promptlens?retryWrites=true&w=majority

# AI Service
GEMINI_API_KEY=AIzaSy...

# Authentication
NEXTAUTH_URL=https://dashboard.promptlens.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
JWT_SECRET=[generate with: openssl rand -base64 32]
JWT_EXPIRES_IN=7d

# Razorpay (get from Razorpay Dashboard in live mode)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_...
RAZORPAY_PRO_YEARLY_PLAN_ID=plan_...
RAZORPAY_WEBHOOK_SECRET=...

# Security
ALLOWED_ORIGINS=https://dashboard.promptlens.app,chrome-extension://[EXTENSION_ID]
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### CLI Tools

Install the appropriate CLI tool:

```bash
# For Railway
npm install -g @railway/cli
railway login

# For Render
# Download from https://render.com/docs/cli
```

## Pre-Deployment Preparation

### 1. Verify Local Build

```bash
cd backend

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

# Verify dist/ folder created
ls -la dist/
```

### 2. Test Production Build Locally

```bash
# Set environment variables
cp .env.example .env.production
# Edit .env.production with production values

# Test production build
NODE_ENV=production node dist/index.js

# Should output:
# ✅ Server running on port 3000
# ✅ Connected to MongoDB
```

### 3. Prepare Dockerfile (Optional for Railway/Render)

Both platforms can build directly from package.json, but a Dockerfile provides more control:

```dockerfile
# Save as backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy built files
COPY dist ./dist

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
```

## Option A: Deploy to Railway

### Step 1: Create New Project

```bash
# Initialize Railway in backend directory
cd backend
railway init

# Or create via dashboard: https://railway.app/new
```

### Step 2: Configure Environment Variables

```bash
# Set variables via CLI
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set GEMINI_API_KEY="AIzaSy..."
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."
railway variables set STRIPE_PRICE_ID="price_..."
railway variables set NEXTAUTH_URL="https://dashboard.promptlens.app"
railway variables set NEXTAUTH_SECRET="..."
railway variables set JWT_SECRET="..."
railway variables set JWT_EXPIRES_IN="7d"
railway variables set ALLOWED_ORIGINS="https://dashboard.promptlens.app"
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Or set via dashboard: Project Settings > Variables
```

Note: `STRIPE_WEBHOOK_SECRET` will be set later after registering the webhook endpoint.

### Step 3: Configure Build Settings

Railway should auto-detect Node.js. Verify or set:

```bash
# Via railway.json (optional)
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
```

### Step 4: Deploy

```bash
# Deploy to Railway
railway up

# Monitor deployment
railway logs

# Get deployment URL
railway status
```

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://[your-railway-url].railway.app/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

## Option B: Deploy to Render

### Step 1: Create New Web Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Select the repository and branch

### Step 2: Configure Service Settings

Fill in the following settings:

```yaml
Name: promptlens-backend
Environment: Node
Region: [Choose closest to your users]
Branch: main
Root Directory: backend
Build Command: npm install && npm run build
Start Command: node dist/index.js
Instance Type: Starter ($7/month) or higher
```

### Step 3: Configure Environment Variables

In the "Environment Variables" section, add:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=AIzaSy...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID=price_...
NEXTAUTH_URL=https://dashboard.promptlens.app
NEXTAUTH_SECRET=[your-secret]
JWT_SECRET=[your-secret]
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://dashboard.promptlens.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Configure Health Check

```
Health Check Path: /health
```

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for build and deployment (5-10 minutes)
3. Monitor logs in Render dashboard

### Step 6: Verify Deployment

```bash
# Test health endpoint
curl https://[your-app].onrender.com/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### Step 7: Create render.yaml (Optional)

For infrastructure-as-code, create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: promptlens-backend
    env: node
    region: oregon
    plan: starter
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && node dist/index.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: MONGODB_URI
        sync: false  # Set in dashboard
      - key: GEMINI_API_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: STRIPE_PRICE_ID
        sync: false
      - key: NEXTAUTH_URL
        value: https://dashboard.promptlens.app
      - key: NEXTAUTH_SECRET
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: ALLOWED_ORIGINS
        value: https://dashboard.promptlens.app
      - key: RATE_LIMIT_WINDOW_MS
        value: 900000
      - key: RATE_LIMIT_MAX_REQUESTS
        value: 100
```

## Post-Deployment Configuration

### 1. Update CORS Configuration

Update `ALLOWED_ORIGINS` to include the extension once deployed:

```bash
# Railway
railway variables set ALLOWED_ORIGINS="https://dashboard.promptlens.app,chrome-extension://[EXTENSION_ID]"

# Render
# Update via dashboard: Environment > ALLOWED_ORIGINS
```

### 2. Register Stripe Webhook Endpoint

See [stripe.md](./stripe.md) for detailed instructions.

Quick steps:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://[your-backend-url]/api/upgrade`
4. Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy webhook signing secret
6. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

```bash
# Railway
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."

# Render
# Add via dashboard
```

### 3. Test Stripe Webhook

```bash
# Send test event from Stripe dashboard
# Check backend logs for successful processing

# Railway
railway logs --tail

# Render
# View logs in dashboard
```

## Health Check Verification

### Available Health Endpoints

```bash
# Basic health check
curl https://[your-backend-url]/health
# Response: {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}

# Database health check
curl https://[your-backend-url]/api/health/db
# Response: {"status":"ok","database":"connected"}
```

### Automated Health Monitoring

Create a monitoring script:

```bash
#!/bin/bash
# Save as deployment/monitor-backend.sh

BACKEND_URL="https://[your-backend-url]"

echo "🔍 Monitoring Backend Health..."

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
  
  if [ $STATUS -eq 200 ]; then
    echo "✅ $(date): Backend healthy"
  else
    echo "❌ $(date): Backend unhealthy (HTTP $STATUS)"
    # Send alert (email, Slack, etc.)
  fi
  
  sleep 60  # Check every minute
done
```

## Monitoring and Logging

### Railway Monitoring

```bash
# View logs
railway logs --tail

# View metrics
railway metrics

# Set up alerts via dashboard:
# Project → Settings → Observability
```

### Render Monitoring

Access via dashboard:
- **Logs**: Service → Logs tab
- **Metrics**: Service → Metrics tab (CPU, Memory, Response time)
- **Alerts**: Service → Settings → Alerts

Configure alerts for:
- Service down
- High memory usage (>90%)
- High CPU usage (>80%)
- High error rate (>5%)

### Log Aggregation

For centralized logging, integrate with external services:

```javascript
// Example: Add Winston logging with external transport
// backend/src/config/logger.ts

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    // Add external transports as needed:
    // new winston.transports.Http({ host: 'logs.example.com' })
  ]
});

export default logger;
```

## Scaling Configuration

### Railway Scaling

```bash
# Scale via CLI
railway service scale replicas=3

# Or via dashboard:
# Project → Service → Settings → Scaling
```

### Render Scaling

Upgrade instance type:
1. Service → Settings → Instance Type
2. Choose higher tier (Starter → Standard → Pro)
3. Enable autoscaling (Standard plan and above)

### Horizontal Scaling Considerations

The backend is designed to be stateless and scale horizontally:

✅ **Safe to scale:**
- Multiple instances will share MongoDB connection pool
- JWT tokens work across instances (shared secret)
- No in-memory session storage

⚠️ **Considerations:**
- Rate limiting uses in-memory store (consider Redis for distributed rate limiting)
- Ensure sufficient MongoDB connections (max connections = instances × pool size)

## Custom Domain Setup

### Railway Custom Domain

```bash
# Add custom domain via CLI
railway domain api.promptlens.app

# Or via dashboard:
# Project → Settings → Domains → Add Custom Domain
```

Then add DNS records:
```
Type: CNAME
Name: api
Value: [provided by Railway]
TTL: 3600
```

### Render Custom Domain

1. Service → Settings → Custom Domains
2. Add `api.promptlens.app`
3. Add DNS records (provided by Render):
   ```
   Type: CNAME
   Name: api
   Value: [provided by Render]
   TTL: 3600
   ```
4. Wait for SSL certificate provisioning (automatic)

### Update Environment Variables

After custom domain is active, update references:

```bash
# Update webhook URL in Stripe Dashboard
# Old: https://[service-id].railway.app/api/upgrade
# New: https://api.promptlens.app/api/upgrade

# Update NEXTAUTH_URL if backend serves auth
# (In most cases, NEXTAUTH_URL points to dashboard, not backend)
```

## Troubleshooting

### Deployment Fails

**Problem**: Build fails with TypeScript errors
```bash
# Solution: Verify local build works
cd backend
npm run build

# Fix any TypeScript errors
npm run typecheck
```

**Problem**: Deployment succeeds but service crashes
```bash
# Check logs for errors
railway logs  # or Render dashboard logs

# Common issues:
# - Missing environment variable
# - MongoDB connection failure
# - Port binding issue (ensure PORT env var is set)
```

### Database Connection Issues

**Problem**: MongoDB connection timeout
```bash
# Solution:
# 1. Verify IP allowlist includes platform IPs:
#    Railway: Add 0.0.0.0/0 (or specific IPs from Railway docs)
#    Render: Add 0.0.0.0/0 (or specific IPs from Render docs)
#
# 2. Test connection string locally:
mongo "mongodb+srv://user:password@cluster.mongodb.net/promptlens?retryWrites=true&w=majority"
```

### CORS Errors

**Problem**: Dashboard or extension can't connect due to CORS
```bash
# Solution: Verify ALLOWED_ORIGINS includes all client origins
railway variables set ALLOWED_ORIGINS="https://dashboard.promptlens.app,chrome-extension://[ID]"

# Check backend logs for CORS rejection messages
railway logs --tail
```

### Stripe Webhook Failures

**Problem**: Webhook events not being received
```bash
# Test endpoint manually
curl -X POST https://api.promptlens.app/api/upgrade

# Should return 400 (signature required), not 404

# Verify webhook URL in Stripe Dashboard matches exactly
# Ensure STRIPE_WEBHOOK_SECRET is set correctly
```

### High Memory Usage

**Problem**: Service running out of memory
```bash
# Check memory usage
# Railway: railway metrics
# Render: Dashboard → Metrics

# Solutions:
# 1. Optimize MongoDB queries (add indexes)
# 2. Reduce connection pool size
# 3. Upgrade instance type
# 4. Fix memory leaks (check for unclosed connections)
```

## Deployment Checklist

Use this checklist to verify successful deployment:

### Pre-Deployment
- [ ] Local tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] All environment variables documented
- [ ] MongoDB production cluster ready
- [ ] Google OAuth credentials ready

### Deployment
- [ ] Service created on Railway/Render
- [ ] All environment variables configured
- [ ] Health check endpoint configured
- [ ] Deployment successful (no build errors)
- [ ] Service running (check logs)

### Post-Deployment
- [ ] Health endpoint returns 200 OK
- [ ] Database connection successful (check logs)
- [ ] API endpoints respond correctly
- [ ] CORS working for dashboard origin
- [ ] Stripe webhook endpoint registered
- [ ] Webhook receives test events successfully
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring and alerts configured
- [ ] Logs being captured

### Integration Testing
- [ ] Dashboard can authenticate users
- [ ] Extension can make API calls
- [ ] Prompts save to database
- [ ] Usage tracking increments
- [ ] Upgrade flow creates checkout session
- [ ] Webhook upgrades user to Pro plan
- [ ] Rate limiting protects endpoints

## Next Steps

After backend deployment:

1. **[Configure Stripe](./stripe.md)** - Set up live payments and webhooks
2. **[Deploy Dashboard](./dashboard.md)** - Deploy web interface
3. **[Deploy Extension](./extension.md)** - Publish browser extension

## Additional Resources

- [Backend API Documentation](../backend/API.md)
- [Backend README](../backend/README.md)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

---

**Need Help?**
- Backend issues: Contact Backend Engineer
- Platform issues: Railway/Render support
- Database issues: See [database.md](./database.md)
