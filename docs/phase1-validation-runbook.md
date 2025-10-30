# PromptLens Phase 1 - Production Validation Runbook

> **Version**: 1.0.0  
> **Last Updated**: 2024  
> **Target Audience**: Operations team, DevOps engineers, On-call engineers

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Post-Deployment Smoke Tests](#post-deployment-smoke-tests)
- [Monitoring Strategy](#monitoring-strategy)
- [Logging Standards](#logging-standards)
- [Alerting Configuration](#alerting-configuration)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Operational Cadences](#operational-cadences)
- [Incident Management](#incident-management)
- [Communication Templates](#communication-templates)

---

## Overview

This runbook provides operational procedures for validating, monitoring, and maintaining PromptLens Phase 1 in production. It covers three main services:

- **Backend API** (Railway/Render): Express.js API with MongoDB
- **Web Dashboard** (Vercel): Next.js application with NextAuth
- **Chrome Extension** (Chrome Web Store): Manifest v3 extension

### System Dependencies

- **Database**: MongoDB Atlas
- **Payment Processing**: Stripe
- **Authentication**: Google OAuth 2.0
- **AI Service**: Google Gemini API
- **CDN/Hosting**: Vercel (dashboard), Railway/Render (backend)

---

## Quick Reference Cheat Sheet

### 🚨 Emergency Contacts & Escalation

```
Level 1: On-call engineer (check PagerDuty/OpsGenie)
Level 2: Backend team lead
Level 3: Engineering manager
Level 4: CTO/VP Engineering

Escalation threshold: 15 minutes without resolution progress
```

### 📊 Key Service URLs

```bash
# Production URLs
Backend API:       https://api.promptlens.app
Web Dashboard:     https://dashboard.promptlens.app
Health Check:      https://api.promptlens.app/api/health

# Monitoring Dashboards
Sentry:           https://sentry.io/organizations/promptlens
Railway:          https://railway.app/project/YOUR_PROJECT
Vercel:           https://vercel.com/YOUR_TEAM/promptlens-dashboard
MongoDB Atlas:    https://cloud.mongodb.com
Stripe:           https://dashboard.stripe.com

# Chrome Extension
Store Listing:    chrome://extensions
Console Logs:     Open extension → Inspect views → service worker
```

### 🔑 Critical Metrics Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| API Response Time (P95) | >500ms | >1000ms | Scale backend |
| Error Rate | >2% | >5% | Page on-call |
| Database Connection Pool | >80% | >95% | Increase pool size |
| Stripe Webhook Failures | >5% | >10% | Check webhook config |
| Extension Install Errors | >3% | >10% | Check Chrome Store status |

### ⚡ Quick Commands

```bash
# Check backend health
curl https://api.promptlens.app/api/health

# Check database connectivity
mongosh "mongodb+srv://YOUR_CLUSTER" --eval "db.adminCommand('ping')"

# View Railway logs
railway logs --service backend

# View Vercel logs
vercel logs https://dashboard.promptlens.app

# Test Stripe webhook
stripe trigger checkout.session.completed
```

---

## Pre-Deployment Checklist

Complete this checklist before deploying to production:

### Environment Configuration

- [ ] All environment variables are set in production
  - [ ] Backend: `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`
  - [ ] Web: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_API_BASE_URL`
  - [ ] Extension: Build with production `VITE_API_BASE_URL`

- [ ] Secrets rotation schedule is documented
- [ ] API keys have appropriate scopes and rate limits
- [ ] CORS origins are properly configured

### Database

- [ ] MongoDB Atlas cluster is in production tier (M10+)
- [ ] Automatic backups are enabled (daily snapshots)
- [ ] Database indexes are created:
  - [ ] Users: `email` (unique), `stripeCustomerId`
  - [ ] WebhookEvents: `eventId` (unique), `createdAt` (TTL index)
- [ ] Connection pooling is configured (min: 10, max: 100)
- [ ] Network access whitelist includes production IPs
- [ ] Monitoring alerts are enabled

### Stripe Configuration

- [ ] Stripe is in live mode (not test mode)
- [ ] Product and pricing are configured
- [ ] Webhook endpoint is registered: `https://api.promptlens.app/api/upgrade`
- [ ] Webhook events are enabled:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_failed`
- [ ] Webhook signing secret is configured in backend
- [ ] Test payment processed successfully in test mode

### Google OAuth

- [ ] OAuth consent screen is approved (not in testing)
- [ ] Production redirect URIs are registered:
  - [ ] `https://dashboard.promptlens.app/api/auth/callback/google`
- [ ] API quotas are sufficient for expected traffic
- [ ] Client ID and secret are configured in web dashboard

### Chrome Extension

- [ ] Extension manifest has correct version number
- [ ] API base URL points to production
- [ ] Extension ID is consistent (not regenerated)
- [ ] Content Security Policy allows production domains
- [ ] Extension is submitted and approved in Chrome Web Store

### Infrastructure

- [ ] Railway/Render backend service has:
  - [ ] Autoscaling enabled (min: 2, max: 10 instances)
  - [ ] Health checks configured (`/api/health`)
  - [ ] Resource limits set (CPU: 1 core, RAM: 1GB)
- [ ] Vercel dashboard deployment has:
  - [ ] Production domain configured
  - [ ] Environment variables set
  - [ ] Function timeout: 10s

### Testing

- [ ] All CI/CD tests pass
- [ ] Staging environment smoke tests pass
- [ ] Load testing completed (target: 100 RPS)
- [ ] Security scan completed (no critical vulnerabilities)

---

## Post-Deployment Smoke Tests

Execute these tests immediately after deployment. All tests must pass before marking deployment as successful.

### Test Execution Order

Run tests in this sequence. Stop and rollback if any test fails.

#### 1. Health Check (Pass/Fail: API responds with 200)

```bash
# Expected: HTTP 200 with {"success": true, "data": {"status": "ok", "database": "connected"}}
curl -i https://api.promptlens.app/api/health

# PASS if:
# - Status code: 200
# - Response includes "status": "ok"
# - Response includes "database": "connected"

# FAIL if:
# - Status code: 500 or 503
# - Database status is "disconnected"
# - Request times out (>5 seconds)
```

**Action on Failure**: Check Railway logs, verify MongoDB Atlas status, rollback if database is unreachable.

---

#### 2. User Signup (Pass/Fail: New user can register via Google OAuth)

**Steps**:
1. Navigate to `https://dashboard.promptlens.app` in incognito mode
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify landing on dashboard home page
5. Verify user shows "Free Plan" in UI
6. Check database for new user record

**Verification**:
```bash
# Check user was created in MongoDB
mongosh "mongodb+srv://YOUR_CLUSTER" --eval "db.users.findOne({email: 'test@example.com'})"
```

**PASS if**:
- User is redirected to dashboard after OAuth
- User record exists in database
- User has `plan: "free"` and `usageCount: 0`
- Session is established (can navigate dashboard)

**FAIL if**:
- OAuth consent screen shows errors
- User is not redirected after sign-in
- Database record is not created
- Error appears on dashboard

**Action on Failure**: Check Vercel logs, verify Google OAuth credentials, verify `NEXTAUTH_URL` matches production domain.

---

#### 3. Extension Optimize/Save (Pass/Fail: Extension can optimize and save prompts)

**Steps**:
1. Install extension from Chrome Web Store
2. Navigate to `https://chat.openai.com` or `https://gemini.google.com`
3. Sign in to extension with test account
4. Click "Optimize" button on a prompt
5. Verify optimized prompt appears
6. Click "Save" button
7. Verify success message appears

**Verification**:
```bash
# Check API logs for optimize request
railway logs --service backend | grep "POST /api/optimize"

# Check database for saved prompt
mongosh "mongodb+srv://YOUR_CLUSTER" --eval "db.prompts.findOne({userId: 'USER_ID'})"
```

**PASS if**:
- Optimize button is visible and clickable
- API request completes within 3 seconds
- Optimized prompt is returned
- Save operation succeeds
- Usage count increments

**FAIL if**:
- Extension fails to load on target pages
- API returns 401 (auth failure) or 500 (server error)
- Optimize request times out
- Save operation fails
- Usage count does not increment

**Action on Failure**: Check extension console errors, verify API CORS settings, verify Gemini API key is valid.

---

#### 4. Dashboard History Display (Pass/Fail: Saved prompts appear in dashboard)

**Steps**:
1. Log in to dashboard with same test account
2. Navigate to "History" or "Saved Prompts" page
3. Verify saved prompt from previous test appears
4. Click on prompt to view details
5. Verify prompt metadata (timestamp, optimization status)

**Verification**:
```bash
# Query user's saved prompts
mongosh "mongodb+srv://YOUR_CLUSTER" --eval "db.prompts.find({userId: 'USER_ID'}).count()"
```

**PASS if**:
- History page loads within 2 seconds
- Saved prompt appears in list
- Prompt details are correct
- Timestamp is accurate
- Pagination works (if applicable)

**FAIL if**:
- History page returns 500 error
- No prompts appear (despite save success)
- Prompt details are corrupted or missing
- Infinite loading state

**Action on Failure**: Check Vercel function logs, verify database query is working, check API `/api/prompts` endpoint.

---

#### 5. Quota Reset (Pass/Fail: Free tier quota resets correctly)

**Prerequisites**: Set test user's `lastResetAt` to 30 days ago.

**Steps**:
1. Make API request with test user (should trigger quota reset)
2. Verify usage count is reset to 0
3. Verify `lastResetAt` is updated to current date
4. Verify `nextResetAt` is set to 30 days from now

**Verification**:
```bash
# Check user quota status
curl -H "Authorization: Bearer TEST_USER_TOKEN" \
  https://api.promptlens.app/api/usage

# Expected response:
# {
#   "plan": "free",
#   "usageCount": 0,
#   "limit": 50,
#   "remaining": 50,
#   "lastResetAt": "2024-XX-XX",
#   "nextResetAt": "2024-YY-YY"
# }
```

**PASS if**:
- Usage count is reset to 0
- `lastResetAt` is updated
- `nextResetAt` is 30 days in future
- API response is correct

**FAIL if**:
- Usage count is not reset
- Dates are incorrect or missing
- Quota reset logic does not trigger

**Action on Failure**: Check backend quota middleware, verify cron job is running, check database `lastResetAt` values.

---

#### 6. Stripe Webhook Receipt (Pass/Fail: Checkout completion upgrades user to Pro)

**Steps**:
1. Create checkout session for test user:
   ```bash
   curl -X POST https://api.promptlens.app/api/billing/checkout \
     -H "Authorization: Bearer TEST_USER_TOKEN" \
     -H "Content-Type: application/json"
   ```
2. Complete checkout with test card `4242 4242 4242 4242`
3. Wait for webhook event (should arrive within 5 seconds)
4. Verify user plan is upgraded to "pro"
5. Verify usage count is reset
6. Verify subscription ID is stored

**Verification**:
```bash
# Check webhook events received
railway logs --service backend | grep "checkout.session.completed"

# Check user plan was upgraded
mongosh "mongodb+srv://YOUR_CLUSTER" --eval "db.users.findOne({email: 'test@example.com'})"

# Expected: {plan: 'pro', stripeSubscriptionId: 'sub_...'}
```

**PASS if**:
- Checkout session is created (returns `sessionId` and `url`)
- User completes payment
- Webhook is received within 10 seconds
- User plan is upgraded to "pro"
- Subscription ID is stored
- Usage count is reset

**FAIL if**:
- Checkout session creation fails
- Webhook is not received
- User plan is not upgraded
- Subscription ID is missing
- Webhook signature validation fails

**Action on Failure**: Check Stripe webhook logs, verify `STRIPE_WEBHOOK_SECRET` is correct, verify webhook endpoint URL is correct in Stripe dashboard.

---

### Smoke Test Summary

| Test | Expected Duration | Pass Criteria |
|------|-------------------|---------------|
| Health Check | <5 seconds | HTTP 200, database connected |
| User Signup | <30 seconds | User created, session established |
| Extension Optimize/Save | <10 seconds | Prompt optimized and saved |
| Dashboard History | <5 seconds | Saved prompts displayed |
| Quota Reset | <5 seconds | Usage count reset, dates updated |
| Stripe Webhook | <20 seconds | Plan upgraded, subscription stored |

**Overall Pass/Fail**: All 6 tests must pass. If any test fails, initiate rollback procedure.

---

## Monitoring Strategy

### Recommended Monitoring Stack

| Service | Tool | Purpose |
|---------|------|---------|
| Frontend Errors | Sentry | Track React errors in dashboard and extension |
| Backend Errors | Sentry | Track Express.js errors and exceptions |
| Application Logs | Logtail or Datadog | Centralized log aggregation |
| Infrastructure | Railway/Vercel built-in | Resource usage, deployment status |
| Database | MongoDB Atlas Monitoring | Connection pool, slow queries, disk usage |
| Payments | Stripe Dashboard | Webhook status, payment failures |
| Uptime | Pingdom or UptimeRobot | External availability monitoring |
| Performance | Vercel Analytics | Page load times, Core Web Vitals |

---

### Monitoring Setup Instructions

#### 1. Sentry Setup (Error Tracking)

**Backend Integration**:
```bash
npm install @sentry/node --workspace=backend
```

Add to `backend/src/server.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**Web Dashboard Integration**:
```bash
npm install @sentry/nextjs --workspace=web
```

Run setup wizard:
```bash
npx @sentry/wizard -i nextjs
```

**Chrome Extension Integration**:
```bash
npm install @sentry/browser --workspace=extension
```

Add to `extension/src/background/index.ts`:
```typescript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: 'production',
});
```

**Configuration**:
- Set up alerts for error rate > 1%
- Configure Slack/email notifications
- Set up error grouping and fingerprinting

---

#### 2. Logtail Setup (Log Aggregation)

**Backend Integration**:
```bash
npm install @logtail/node @logtail/winston --workspace=backend
```

Add to `backend/src/config/logger.ts`:
```typescript
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

winston.add(new LogtailTransport(logtail));
```

**Configuration**:
- Create separate sources for backend, web, extension
- Set up log retention (30 days recommended)
- Configure search indexes for common queries

---

#### 3. MongoDB Atlas Monitoring

**Enable Alerts** (in Atlas console):
1. Navigate to Project → Alerts
2. Enable the following:
   - Connection count > 80% of max
   - Disk space > 80% capacity
   - Slow queries > 100ms (P95)
   - Replica set election occurred
   - Backup failure

**Set Up Alert Recipients**:
- Email: ops-team@yourcompany.com
- Slack webhook: #production-alerts
- PagerDuty integration for critical alerts

---

#### 4. Stripe Webhook Monitoring

**Enable Webhook Logs** (in Stripe dashboard):
1. Navigate to Developers → Webhooks
2. Click on production webhook endpoint
3. Enable "Log all events"
4. Set up email alerts for:
   - Webhook disabled due to failures
   - 50+ consecutive failures

**Recommended Alerts**:
- Webhook response time > 3 seconds
- Webhook failure rate > 5%
- Unhandled event types

---

#### 5. Uptime Monitoring

**Pingdom Configuration**:
```
Check Type: HTTP
URL: https://api.promptlens.app/api/health
Interval: 1 minute
Alert After: 2 failures
Expected Status: 200
Expected Content: "status":"ok"
```

**Alert Contacts**:
- SMS: On-call phone number
- Email: ops-team@yourcompany.com
- Webhook: PagerDuty integration

---

### Key Metrics to Track

#### Backend API Metrics

| Metric | Description | Target | Collection Method |
|--------|-------------|--------|-------------------|
| Request Rate | Requests per second | Monitor baseline | Railway/Render metrics |
| Response Time (P50) | Median response time | <200ms | APM tool (Sentry) |
| Response Time (P95) | 95th percentile | <500ms | APM tool |
| Response Time (P99) | 99th percentile | <1000ms | APM tool |
| Error Rate | % of requests with 5xx errors | <1% | Log aggregation |
| Database Query Time | Average query duration | <50ms | MongoDB Atlas profiler |
| Connection Pool Usage | % of connections in use | <80% | MongoDB Atlas monitoring |
| Memory Usage | Process memory consumption | <80% of limit | Railway/Render metrics |
| CPU Usage | Process CPU utilization | <70% average | Railway/Render metrics |

#### Web Dashboard Metrics

| Metric | Description | Target | Collection Method |
|--------|-------------|--------|-------------------|
| First Contentful Paint | Time to first content | <1.8s | Vercel Analytics |
| Largest Contentful Paint | Time to main content | <2.5s | Vercel Analytics |
| Time to Interactive | Time until interactive | <3.8s | Vercel Analytics |
| Cumulative Layout Shift | Visual stability | <0.1 | Vercel Analytics |
| Function Duration | Serverless function runtime | <3s | Vercel function logs |
| Function Errors | Serverless function error rate | <1% | Vercel logs |

#### Chrome Extension Metrics

| Metric | Description | Target | Collection Method |
|--------|-------------|--------|-------------------|
| Install Success Rate | % successful installs | >95% | Chrome Web Store stats |
| Crash Rate | Extension crash frequency | <0.1% | Chrome Web Store stats |
| Uninstall Rate | % users who uninstall | <5% weekly | Chrome Web Store stats |
| Content Script Errors | Errors in injected scripts | <1% | Sentry |
| API Request Success | % successful API calls | >98% | Backend logs |

#### Payment Processing Metrics

| Metric | Description | Target | Collection Method |
|--------|-------------|--------|-------------------|
| Checkout Completion Rate | % completed checkouts | >70% | Stripe dashboard |
| Payment Success Rate | % successful payments | >95% | Stripe dashboard |
| Webhook Delivery Success | % webhooks delivered | >99% | Stripe dashboard |
| Webhook Processing Time | Time to process webhook | <1s | Backend logs |
| Subscription Churn Rate | % canceled subscriptions | <5% monthly | Stripe dashboard |

---

### Custom Dashboards

#### Backend Health Dashboard

**Metrics to Include**:
- Active connections
- Request rate (by endpoint)
- Error rate (by status code)
- P95 response time
- Database query performance
- Memory and CPU usage

**Tools**: Grafana + Prometheus, or Railway built-in dashboard

---

#### Payment Health Dashboard

**Metrics to Include**:
- Checkout sessions created
- Checkout completion rate
- Successful payments
- Failed payments (with reasons)
- Webhook delivery status
- Active subscriptions

**Tools**: Stripe Dashboard + custom queries

---

## Logging Standards

### Log Levels

Use consistent log levels across all services:

| Level | When to Use | Examples |
|-------|-------------|----------|
| `ERROR` | Unrecoverable errors requiring immediate attention | Database connection failure, Stripe webhook signature invalid |
| `WARN` | Recoverable errors or concerning events | Rate limit exceeded, slow query detected, retry attempt |
| `INFO` | Important business events | User signup, subscription created, prompt optimized |
| `DEBUG` | Detailed technical information | Request/response payloads, database queries |

### Log Format

**Structured JSON Format**:
```json
{
  "timestamp": "2024-01-15T14:30:22.123Z",
  "level": "INFO",
  "service": "backend-api",
  "message": "User subscription upgraded",
  "context": {
    "userId": "user_123",
    "subscriptionId": "sub_abc",
    "plan": "pro"
  },
  "requestId": "req_xyz",
  "duration": 142
}
```

### Log Retention

- **Production**: 30 days
- **Staging**: 7 days
- **Development**: 3 days

### Service-Specific Logging

#### Backend API (Railway/Render)

**Where to View**:
```bash
# Railway CLI
railway logs --service backend --tail

# Railway Web UI
https://railway.app/project/YOUR_PROJECT/service/backend

# Render Dashboard
https://dashboard.render.com/web/YOUR_SERVICE/logs
```

**Key Log Patterns to Search**:
```bash
# Authentication failures
railway logs | grep "Authentication failed"

# Stripe webhook errors
railway logs | grep "Stripe webhook"

# Database errors
railway logs | grep "MongoDB"

# Slow API requests (>1s)
railway logs | grep "duration" | grep -E "[0-9]{4,}"
```

**Log Exporting**:
```bash
# Export last 24 hours to file
railway logs --service backend --since 24h > backend-logs-$(date +%Y%m%d).log
```

---

#### Web Dashboard (Vercel)

**Where to View**:
```bash
# Vercel CLI
vercel logs https://dashboard.promptlens.app --since 1h

# Vercel Dashboard
https://vercel.com/YOUR_TEAM/promptlens-dashboard/logs
```

**Function Logs**:
- Navigate to Deployment → Functions tab
- Click on specific function to view invocations
- Filter by status code (400, 500, etc.)

**Key Log Patterns**:
```bash
# NextAuth errors
vercel logs | grep "NextAuth"

# API route errors
vercel logs | grep "Error"

# Slow page renders
vercel logs | grep "render" | grep -E "[0-9]{4,}"
```

**Log Exporting**:
```bash
# Export logs via CLI
vercel logs https://dashboard.promptlens.app --since 7d --output logs.json
```

---

#### Chrome Extension

**Where to View**:
1. Open `chrome://extensions`
2. Find PromptLens extension
3. Click "Inspect views: service worker" (for background logs)
4. For content script logs: Open DevTools on target page → Console tab

**Log Levels in Extension**:
```typescript
// Use console methods with structured data
console.error('[PromptLens] API request failed', { endpoint, error });
console.warn('[PromptLens] Rate limit approaching', { remaining });
console.info('[PromptLens] Prompt optimized', { promptId });
console.debug('[PromptLens] Cache hit', { key });
```

**Remote Logging** (via Sentry):
- Errors and warnings are automatically sent to Sentry
- Use breadcrumbs for debugging context

**User Log Collection**:
- Provide "Export Logs" button in extension settings
- Generate JSON file with recent logs for support tickets

---

#### Stripe Events

**Where to View**:
1. Navigate to Stripe Dashboard → Developers → Events
2. Filter by event type: `checkout.session.completed`, `customer.subscription.deleted`
3. Click event to view payload and webhook delivery attempts

**Webhook Logs**:
1. Developers → Webhooks
2. Click on endpoint URL
3. View "Attempted webhooks" tab
4. Check for failed deliveries and retry attempts

**Log Patterns to Monitor**:
- Response code: Should always be 200
- Response time: Should be <3s
- Failures: Any 4xx or 5xx responses require investigation

**Exporting**:
- Use Stripe CLI: `stripe events list --limit 100`
- Or via API: `GET /v1/events`

---

## Alerting Configuration

### Alert Categories

#### Critical Alerts (Immediate Response Required)

| Alert | Condition | Notification Channel | Response Time |
|-------|-----------|---------------------|---------------|
| API Service Down | Health check fails 3 consecutive times | PagerDuty + SMS | 5 minutes |
| Database Connection Lost | No successful DB queries for 2 minutes | PagerDuty + SMS | 5 minutes |
| Error Rate Spike | Error rate >5% for 5 minutes | PagerDuty + SMS | 5 minutes |
| Stripe Webhook Disabled | Stripe disables webhook due to failures | PagerDuty + Email | 15 minutes |
| Payment Processing Failure | >10% payment failures for 10 minutes | PagerDuty + Email | 15 minutes |

#### Warning Alerts (Investigation Required)

| Alert | Condition | Notification Channel | Response Time |
|-------|-----------|---------------------|---------------|
| High Response Time | P95 latency >1s for 10 minutes | Slack #alerts | 1 hour |
| Error Rate Elevated | Error rate >2% for 10 minutes | Slack #alerts | 1 hour |
| Database Connection Pool High | >80% connections for 15 minutes | Slack #alerts | 1 hour |
| Memory Usage High | >85% memory for 15 minutes | Slack #alerts | 2 hours |
| Slow Database Queries | >5 queries/min exceed 1s | Email ops-team | 2 hours |

#### Informational Alerts (Monitoring Only)

| Alert | Condition | Notification Channel | Response Time |
|-------|-----------|---------------------|---------------|
| Traffic Spike | Request rate >200% of baseline | Slack #monitoring | Next business day |
| New User Signups | >100 signups in 1 hour | Slack #growth | N/A (celebration) |
| Deployment Completed | New version deployed | Slack #deployments | N/A |
| Backup Completed | Daily backup successful | Email (daily digest) | N/A |

---

### Alert Thresholds

#### Backend API

```yaml
# Example configuration (e.g., for Prometheus Alertmanager)
groups:
  - name: backend_api
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High P95 latency detected"
          description: "P95 latency is {{ $value }}s"

      - alert: DatabaseConnectionPoolHigh
        expr: mongodb_connections_current / mongodb_connections_available > 0.8
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool usage high"
```

#### Web Dashboard

```yaml
groups:
  - name: web_dashboard
    interval: 60s
    rules:
      - alert: HighFunctionErrorRate
        expr: rate(vercel_function_errors_total[10m]) > 0.02
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High function error rate"

      - alert: SlowPageLoad
        expr: vercel_page_load_p95 > 5000
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Slow page load times"
```

---

### Escalation Policy

**Level 1: On-Call Engineer (0-15 minutes)**
- Acknowledge alert within 5 minutes
- Begin initial investigation
- Follow runbook procedures
- Update incident ticket

**Level 2: Team Lead (15-30 minutes)**
- If no progress after 15 minutes, escalate to team lead
- Team lead takes over or provides guidance
- Continue incident updates

**Level 3: Engineering Manager (30-60 minutes)**
- If critical issue not resolved after 30 minutes
- Coordinate additional resources
- Authorize emergency procedures (e.g., rollback)

**Level 4: Executive Leadership (60+ minutes)**
- For prolonged outages or customer-impacting issues
- Authorize customer communications
- Coordinate PR response if needed

---

## Common Issues & Troubleshooting

### 1. Authentication Token Failures

**Symptoms**:
- Extension shows "Authentication failed" error
- Dashboard returns 401 errors
- Users unable to log in or stay logged in

**Detection**:
- Monitor for increased 401 errors in backend logs
- User complaints about login issues
- Extension error reports in Sentry

**Triage Steps**:

1. **Check JWT Secret Consistency**:
   ```bash
   # Verify JWT_SECRET is set and consistent across deployments
   railway variables --service backend | grep JWT_SECRET
   vercel env ls production | grep NEXTAUTH_SECRET
   ```

2. **Verify Token Expiration**:
   ```bash
   # Check token expiration settings
   railway logs | grep "JWT_EXPIRES_IN"
   # Expected: 7d or similar
   ```

3. **Test Token Generation**:
   ```bash
   # Generate test token
   curl -X POST https://dashboard.promptlens.app/api/auth/signin/google
   # Check response for valid session
   ```

4. **Check OAuth Configuration**:
   - Verify Google OAuth credentials in Vercel
   - Confirm redirect URIs match production URLs
   - Check OAuth consent screen status

**Resolution**:

- **If JWT secret mismatch**: Sync secrets across services and restart
- **If tokens expired**: Increase `JWT_EXPIRES_IN` to 30d
- **If OAuth misconfigured**: Update Google Cloud Console settings
- **If persistent**: Invalidate all sessions and force re-login

**Rollback Not Required** (unless caused by recent deployment)

---

### 2. Quota Desynchronization

**Symptoms**:
- Users report incorrect usage counts
- Free users shown as Pro (or vice versa)
- Usage count doesn't reset after 30 days
- Users exceed quota but aren't blocked

**Detection**:
- User support tickets
- Database audit reveals inconsistencies
- Monitor for `usageCount > limit` edge cases

**Triage Steps**:

1. **Check User Record**:
   ```bash
   mongosh "mongodb+srv://YOUR_CLUSTER" --eval "
     db.users.findOne({email: 'affected-user@example.com'})
   "
   # Check: plan, usageCount, limit, lastResetAt, nextResetAt
   ```

2. **Verify Quota Middleware**:
   ```bash
   railway logs | grep "Quota exceeded"
   railway logs | grep "Quota reset"
   ```

3. **Check for Race Conditions**:
   - Multiple concurrent API requests incrementing usage
   - Webhook events processed out of order

4. **Audit Stripe Subscription Status**:
   ```bash
   # Check Stripe subscription status
   stripe subscriptions retrieve sub_XXXXX
   ```

**Resolution**:

- **Manual Fix** (immediate):
  ```javascript
  // Connect to MongoDB and fix user record
  db.users.updateOne(
    { email: 'user@example.com' },
    {
      $set: {
        plan: 'pro', // or 'free'
        usageCount: 0,
        lastResetAt: new Date(),
        nextResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  );
  ```

- **Automated Fix** (for multiple users):
  ```bash
  # Run quota reconciliation script
  node scripts/reconcile-quotas.js
  ```

- **Preventive Measures**:
  - Implement database transactions for quota updates
  - Add webhook idempotency verification
  - Create daily quota audit job

**Rollback Not Required** (data issue, not code issue)

---

### 3. Stripe Payment Failures

**Symptoms**:
- Users report payment declined
- Checkout sessions created but not completed
- Webhook events not received
- Subscriptions not activated after payment

**Detection**:
- Stripe Dashboard shows failed payments
- Backend logs show webhook signature validation failures
- Users contact support about payment issues

**Triage Steps**:

1. **Check Stripe Dashboard**:
   - Navigate to Payments → Search for customer
   - Check payment status and decline reason
   - Review webhook delivery attempts

2. **Verify Webhook Configuration**:
   ```bash
   # Check webhook secret matches
   railway variables | grep STRIPE_WEBHOOK_SECRET
   
   # Check webhook endpoint status in Stripe Dashboard
   # Developers → Webhooks → Status (should be "Enabled")
   ```

3. **Test Webhook Delivery**:
   ```bash
   # Trigger test webhook
   stripe trigger checkout.session.completed
   
   # Check backend received it
   railway logs | grep "checkout.session.completed"
   ```

4. **Review Payment Decline Reason**:
   - Insufficient funds: User issue
   - Card declined: User issue
   - Authentication required: User needs to complete 3D Secure
   - Fraud detection: Review Stripe Radar rules

**Resolution**:

- **If webhook signature invalid**:
  ```bash
  # Get correct webhook secret from Stripe
  stripe webhooks list
  # Update in Railway
  railway variables set STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET
  railway restart --service backend
  ```

- **If webhook endpoint unreachable**:
  - Check Railway service is running
  - Verify firewall/network configuration
  - Confirm endpoint URL in Stripe matches production

- **If payment declined** (user issue):
  - Contact user with decline reason
  - Suggest alternative payment method
  - Offer support for resolving payment

- **If Stripe API error**:
  - Check Stripe status page: https://status.stripe.com
  - Verify API keys are for correct account (test vs live)
  - Contact Stripe support if persists

**Rollback Required If**: Recent deployment broke webhook endpoint

---

### 4. MongoDB Connectivity Issues

**Symptoms**:
- API returns 503 errors
- Health check shows "database": "disconnected"
- Slow API responses
- Connection pool exhausted errors

**Detection**:
- Backend health check fails
- MongoDB Atlas alerts
- Backend logs show connection errors

**Triage Steps**:

1. **Check MongoDB Atlas Status**:
   - Navigate to Atlas console
   - Check cluster status (should be "Active")
   - Review network access whitelist
   - Check current connections

2. **Verify Connection String**:
   ```bash
   # Check MONGODB_URI is set correctly
   railway variables | grep MONGODB_URI
   # Should be: mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```

3. **Test Connection**:
   ```bash
   # Test connection from local machine
   mongosh "YOUR_MONGODB_URI" --eval "db.adminCommand('ping')"
   ```

4. **Check Connection Pool**:
   ```bash
   # Review backend logs for pool exhaustion
   railway logs | grep "pool"
   railway logs | grep "MongoError"
   ```

5. **Check Network Access**:
   - Atlas → Network Access
   - Verify Railway IP ranges are whitelisted
   - Consider allowing 0.0.0.0/0 for Railway (they use dynamic IPs)

**Resolution**:

- **If cluster is down**:
  - Check Atlas status page
  - Contact MongoDB support
  - Consider enabling cluster failover

- **If connection string incorrect**:
  ```bash
  # Update connection string
  railway variables set MONGODB_URI="mongodb+srv://..."
  railway restart --service backend
  ```

- **If network access blocked**:
  - Add Railway IP ranges to Atlas whitelist
  - Or allow all IPs: 0.0.0.0/0 (less secure)

- **If connection pool exhausted**:
  - Increase pool size in backend config
  - Investigate connection leaks
  - Scale backend instances

- **If cluster overloaded**:
  - Upgrade Atlas cluster tier (M10 → M20)
  - Add read replicas
  - Optimize slow queries

**Rollback Not Required** (infrastructure issue)

---

### 5. Google OAuth Consent Rejection

**Symptoms**:
- Users see "This app is blocked" during sign-in
- OAuth consent screen shows "App not verified"
- Sign-in redirects to error page
- New users cannot create accounts

**Detection**:
- User complaints about sign-in issues
- Vercel logs show OAuth errors
- Google Cloud Console shows consent warnings

**Triage Steps**:

1. **Check OAuth Consent Screen Status**:
   - Navigate to Google Cloud Console
   - APIs & Services → OAuth consent screen
   - Check verification status

2. **Review Scopes Requested**:
   - Verify only necessary scopes are requested
   - Avoid sensitive scopes if possible
   - Check if scopes changed recently

3. **Check Redirect URIs**:
   ```bash
   # Verify redirect URI is registered
   # Should be: https://dashboard.promptlens.app/api/auth/callback/google
   ```

4. **Review User Complaints**:
   - Is error consistent across all users?
   - Does it affect only new users or existing users?
   - Check for pattern (e.g., specific domains blocked)

**Resolution**:

- **If app not verified**:
  - Submit app for verification (may take 4-6 weeks)
  - Add test users in the meantime (up to 100)
  - Set publishing status to "Testing" (allows test users)

- **If scopes too broad**:
  - Reduce scopes to minimum required
  - Update OAuth configuration
  - Redeploy web dashboard

- **If redirect URI mismatch**:
  - Add correct redirect URI in Google Cloud Console
  - Update `NEXTAUTH_URL` in Vercel
  - Restart web dashboard

- **If temporary Google outage**:
  - Check Google status: https://www.google.com/appsstatus
  - Wait for resolution
  - Monitor user impact

- **Emergency Workaround**:
  - Temporarily enable "Testing" mode (allows up to 100 test users)
  - Add affected users as test users
  - Expedite verification submission

**Rollback Not Required** (OAuth configuration issue)

---

### 6. Extension Not Loading on Target Pages

**Symptoms**:
- Extension icon is grayed out
- Optimize/Save buttons don't appear
- Console shows "Content script failed to inject"
- Extension works on some sites but not others

**Detection**:
- User reports via Chrome Web Store reviews
- Extension error logs in Sentry
- Support tickets

**Triage Steps**:

1. **Check Content Script Injection**:
   ```javascript
   // Open DevTools on target page (e.g., ChatGPT)
   // Console should show:
   console.log('PromptLens content script loaded');
   ```

2. **Verify Manifest Permissions**:
   ```json
   // Check manifest.json includes target URLs
   "content_scripts": [
     {
       "matches": [
         "https://chat.openai.com/*",
         "https://gemini.google.com/*"
       ]
     }
   ]
   ```

3. **Check for CSP Violations**:
   ```javascript
   // Open DevTools → Console
   // Look for "Content Security Policy" errors
   ```

4. **Test on Different Pages**:
   - Does it work on ChatGPT but not Gemini?
   - Does it work in incognito mode?
   - Does it work for some users but not others?

**Resolution**:

- **If manifest permissions incorrect**:
  - Update `manifest.json` with correct URLs
  - Rebuild and republish extension
  - Notify users to update

- **If CSP violations**:
  - Update extension CSP in manifest
  - Use `web_accessible_resources` for assets
  - Rebuild and republish

- **If site changed structure**:
  - Update content script selectors
  - Test on latest version of target site
  - Consider using more robust selectors

- **If Chrome Store version mismatch**:
  - Verify published version matches code
  - Check if update is pending review
  - Consider expedited review if critical

**Rollback Required If**: Recent extension update caused issue

---

### 7. High API Latency

**Symptoms**:
- API responses take >1 second
- Dashboard feels slow/unresponsive
- Extension timeout errors
- Users report "loading" states

**Detection**:
- APM tools show high P95 latency
- Backend logs show slow requests
- User complaints

**Triage Steps**:

1. **Identify Slow Endpoints**:
   ```bash
   # Find slowest requests
   railway logs | grep "duration" | sort -t= -k2 -n | tail -20
   ```

2. **Check Database Query Performance**:
   - MongoDB Atlas → Performance tab
   - Review slow query logs
   - Check for missing indexes

3. **Check External API Latency**:
   ```bash
   # Test Gemini API response time
   time curl -X POST https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"test"}]}]}'
   ```

4. **Check Resource Utilization**:
   - Railway: Check CPU and memory usage
   - Look for resource throttling

**Resolution**:

- **If database queries slow**:
  ```javascript
  // Add missing indexes
  db.prompts.createIndex({ userId: 1, createdAt: -1 });
  db.users.createIndex({ stripeCustomerId: 1 });
  ```

- **If external API slow** (Gemini):
  - Implement caching for repeated requests
  - Add timeout limits (5 seconds)
  - Consider fallback/retry logic

- **If backend overloaded**:
  - Scale up Railway instances (increase min/max)
  - Increase memory/CPU allocation
  - Implement request queuing

- **If connection pool exhausted**:
  - Increase MongoDB connection pool size
  - Fix connection leaks in code
  - Implement connection retry logic

- **If traffic spike**:
  - Enable autoscaling
  - Add rate limiting
  - Implement CDN caching

**Rollback Required If**: Recent deployment introduced slow code

---

## Rollback Procedures

### When to Rollback

Initiate rollback if:
- Any smoke test fails
- Error rate >5% for 10+ minutes
- Critical functionality broken
- Database migration fails
- Security vulnerability introduced

### Pre-Rollback Checklist

- [ ] Confirm issue is caused by recent deployment (check timing)
- [ ] Document error messages and symptoms
- [ ] Capture logs from affected services
- [ ] Create incident ticket
- [ ] Notify team in Slack #incidents

---

### Backend API Rollback (Railway)

**Automated Rollback** (via Railway dashboard):

1. Navigate to Railway project
2. Click on "backend" service
3. Go to "Deployments" tab
4. Find previous successful deployment
5. Click "Redeploy" on that deployment
6. Monitor logs for successful startup

**Estimated Time**: 2-3 minutes

**CLI Rollback**:
```bash
# List recent deployments
railway deployments --service backend

# Rollback to previous deployment
railway rollback --service backend --deployment DEPLOYMENT_ID
```

**Verification**:
```bash
# Check health endpoint
curl https://api.promptlens.app/api/health

# Check service is responding
railway logs --service backend --tail
```

---

### Backend API Rollback (Render)

**Automated Rollback** (via Render dashboard):

1. Navigate to Render dashboard
2. Select backend service
3. Go to "Deploys" section
4. Click "Rollback" on previous deploy
5. Wait for deployment to complete

**Manual Rollback** (via Git):
```bash
# In backend directory
git checkout backend
git log --oneline -10
git revert COMMIT_HASH
git push origin main

# Render will auto-deploy
```

**Verification**:
```bash
curl https://api.promptlens.app/api/health
```

---

### Web Dashboard Rollback (Vercel)

**Instant Rollback** (via Vercel dashboard):

1. Navigate to Vercel project
2. Go to "Deployments" tab
3. Find previous production deployment
4. Click "⋯" menu → "Promote to Production"
5. Confirm promotion

**Estimated Time**: <1 minute (instant)

**CLI Rollback**:
```bash
# List deployments
vercel ls promptlens-dashboard

# Promote previous deployment to production
vercel promote DEPLOYMENT_URL --scope YOUR_TEAM
```

**Verification**:
```bash
# Check dashboard loads
curl -I https://dashboard.promptlens.app

# Test authentication flow
curl https://dashboard.promptlens.app/api/auth/providers
```

---

### Chrome Extension Rollback

**Note**: Chrome Web Store does not support instant rollbacks. You must republish a previous version.

**Emergency Procedure**:

1. **Unpublish Current Version** (if critical issue):
   - Go to Chrome Web Store Developer Dashboard
   - Select PromptLens extension
   - Click "Distribution" → "Unpublish"
   - Note: This removes extension from store for new installs

2. **Republish Previous Version**:
   ```bash
   # Checkout previous version from Git
   cd extension
   git log --oneline -10
   git checkout PREVIOUS_COMMIT

   # Rebuild
   npm run build

   # Create zip
   npm run zip

   # Upload to Chrome Web Store
   # Manual upload via Developer Dashboard
   ```

3. **Submit for Expedited Review**:
   - Mark as "Urgent" if available
   - Explain rollback reason in review notes
   - Expected review time: 1-3 days

**Alternative** (if issue is minor):
- Leave current version published
- Release hotfix as new version
- Update version number (e.g., 1.0.2 → 1.0.3)
- Submit for regular review

**Estimated Time**: 1-3 days (Chrome review process)

**Temporary Mitigation**:
- Publish warning in extension description
- Add notice in popup UI
- Provide workaround instructions

---

### Database Rollback (MongoDB)

**Warning**: Database rollbacks are risky. Prefer fixing forward when possible.

**Restore from Backup** (if recent migration failed):

1. **Access MongoDB Atlas Backups**:
   - Navigate to Cluster → Backup tab
   - Find backup from before migration
   - Click "Restore"

2. **Choose Restore Method**:
   - **Automated Restore** (creates new cluster): Safest option
   - **Point-in-Time Restore**: Restore to specific timestamp
   - **Download Backup**: For manual restore

3. **Update Connection String**:
   ```bash
   # Update backend to point to restored cluster
   railway variables set MONGODB_URI="mongodb+srv://NEW_CLUSTER"
   railway restart --service backend
   ```

4. **Verify Data Integrity**:
   ```bash
   # Check critical collections
   mongosh "NEW_CLUSTER_URI" --eval "
     db.users.countDocuments();
     db.prompts.countDocuments();
   "
   ```

**Estimated Time**: 15-30 minutes

---

### Rollback Verification Checklist

After rollback, verify:

- [ ] Health check returns 200
- [ ] Users can log in
- [ ] Extension can connect to API
- [ ] Dashboard loads correctly
- [ ] Stripe webhooks are received
- [ ] Database queries succeed
- [ ] Error rate is back to normal (<1%)
- [ ] All smoke tests pass

---

## Operational Cadences

### Daily Operations

**Morning Checklist** (15 minutes):
- [ ] Check overnight alerts (Slack, PagerDuty)
- [ ] Review error rate dashboard (Sentry)
- [ ] Check API health endpoint
- [ ] Verify database backup completed
- [ ] Review Stripe webhook delivery success rate
- [ ] Check for user-reported issues (support tickets)

**Evening Checklist** (10 minutes):
- [ ] Review daily metrics summary
- [ ] Check for pending security updates
- [ ] Verify on-call rotation is correct
- [ ] Archive resolved incidents

---

### Weekly Operations

**Monday** (30 minutes):
- [ ] Review previous week's incidents
- [ ] Check API performance trends (response time, error rate)
- [ ] Review database slow query logs
- [ ] Update incident runbook with new learnings
- [ ] Plan any infrastructure updates

**Wednesday** (20 minutes):
- [ ] Review user growth metrics
- [ ] Check Chrome Extension Store ratings/reviews
- [ ] Verify backup restore test succeeded
- [ ] Review security scan results

**Friday** (30 minutes):
- [ ] Review week's deployment history
- [ ] Check for pending dependency updates
- [ ] Verify all monitoring alerts are functioning
- [ ] Update on-call schedule for next week
- [ ] Document any known issues for weekend on-call

---

### Monthly Operations

**First Monday of Month** (2 hours):
- [ ] **Billing Reconciliation**:
  - Compare Stripe payouts to expected revenue
  - Verify all subscriptions are accounted for
  - Check for failed payments and follow up
  - Generate monthly revenue report

- [ ] **Infrastructure Review**:
  - Review Railway/Vercel usage and costs
  - Check for overprovisioned resources
  - Evaluate autoscaling performance
  - Plan capacity for next month

- [ ] **Security Audit**:
  - Review access logs for anomalies
  - Rotate API keys/secrets (quarterly)
  - Check for pending security patches
  - Review OAuth app permissions

- [ ] **Performance Review**:
  - Analyze P95/P99 latency trends
  - Identify top 10 slowest endpoints
  - Review database query performance
  - Update performance baselines

**Second Monday of Month** (1 hour):
- [ ] **Monitoring Health Check**:
  - Verify all alerts are functioning (trigger test alerts)
  - Review alert thresholds for accuracy
  - Check for alert fatigue (too many false positives)
  - Update escalation contacts

**Third Monday of Month** (1 hour):
- [ ] **Backup & Disaster Recovery Test**:
  - Perform database restore from backup
  - Verify restored data integrity
  - Document restore time
  - Update disaster recovery plan

**Fourth Monday of Month** (2 hours):
- [ ] **Documentation Review**:
  - Update this runbook with new procedures
  - Review and update API documentation
  - Check for outdated screenshots/examples
  - Incorporate incident learnings

---

### Quarterly Operations

**First Week of Quarter** (4 hours):
- [ ] **Major Infrastructure Review**:
  - Evaluate current hosting plan (Railway/Vercel tier)
  - Consider cost optimizations
  - Plan for anticipated growth
  - Review and update SLA targets

- [ ] **Security Deep Dive**:
  - Full penetration testing (consider hiring external firm)
  - Review OWASP Top 10 vulnerabilities
  - Update OAuth scopes and permissions
  - Rotate all production secrets

- [ ] **Tech Debt Review**:
  - Prioritize tech debt backlog
  - Plan refactoring initiatives
  - Update dependencies (major versions)
  - Address deprecation warnings

---

### Annual Operations

**January** (full week):
- [ ] **Year-End Audit**:
  - Review full year incident history
  - Calculate uptime percentage
  - Generate annual reliability report
  - Set SLA targets for new year

- [ ] **Compliance Review**:
  - Review GDPR/privacy compliance
  - Update Terms of Service / Privacy Policy
  - Review data retention policies
  - Audit user data handling

- [ ] **Team Training**:
  - Train new team members on runbook
  - Conduct disaster recovery simulation
  - Review and update on-call procedures
  - Schedule emergency response drills

---

## Incident Management

### Incident Severity Matrix

| Severity | Definition | Examples | Response Time | Notification |
|----------|------------|----------|---------------|--------------|
| **SEV-1 (Critical)** | Complete service outage affecting all users | API down, database unreachable, authentication broken | 5 minutes | PagerDuty + SMS + Slack |
| **SEV-2 (High)** | Major functionality broken for most users | Payment processing down, extension not working | 15 minutes | PagerDuty + Slack |
| **SEV-3 (Medium)** | Partial functionality degraded | High latency, intermittent errors, feature broken | 1 hour | Slack notification |
| **SEV-4 (Low)** | Minor issue with workaround | UI bug, cosmetic issue, edge case error | Next business day | Slack notification |

---

### Incident Response Workflow

#### 1. Detection & Acknowledgment (0-5 minutes)

**Alert Received** → **On-call engineer acknowledges**

Actions:
- Acknowledge alert in PagerDuty
- Post in Slack #incidents: "Investigating alert: [description]"
- Open incident ticket in tracking system
- Assign severity level (initial assessment)

---

#### 2. Investigation (5-15 minutes)

**Gather information** → **Identify root cause**

Actions:
- Check health endpoints
- Review recent deployments (last 24 hours)
- Check logs for errors
- Verify external service status (Stripe, MongoDB, Google)
- Update incident ticket with findings

Key Questions:
- When did issue start?
- Which users are affected (all, subset, specific plan)?
- Did we recently deploy?
- Are external services healthy?

---

#### 3. Communication (Ongoing)

**Notify stakeholders** → **Provide status updates**

Initial Notification (within 10 minutes):
```
🚨 Incident Detected
Severity: SEV-2
Status: Investigating
Impact: Users experiencing [description]
ETA for update: 15 minutes
Incident Commander: @engineer-name
```

Update Frequency:
- SEV-1: Every 15 minutes
- SEV-2: Every 30 minutes
- SEV-3: Every 1 hour

Update Template:
```
📊 Incident Update
Time: HH:MM UTC
Status: [Investigating / Identified / Fixing / Monitoring]
Root Cause: [Brief description]
Action Taken: [What we did]
Next Steps: [What we're doing next]
ETA for resolution: [Estimate]
```

---

#### 4. Mitigation (15-60 minutes)

**Apply fix** → **Verify resolution**

Common Mitigation Strategies:
1. **Rollback**: Revert to previous deployment
2. **Hotfix**: Deploy targeted fix
3. **Scale**: Increase resources (CPU, memory, instances)
4. **Circuit Breaker**: Disable problematic feature
5. **Failover**: Switch to backup system

Verification:
- [ ] Error rate returns to normal
- [ ] Smoke tests pass
- [ ] User reports confirm resolution
- [ ] Monitoring shows healthy metrics

---

#### 5. Monitoring (1-4 hours)

**Watch for recurrence** → **Confirm stability**

Actions:
- Monitor error rate for next 2 hours
- Check for any related issues
- Stay on call (don't hand off yet)
- Continue status updates every 30 minutes

When to Declare Resolved:
- Error rate <1% for 1 hour
- No new user reports for 1 hour
- All smoke tests passing
- Metrics back to baseline

---

#### 6. Resolution & Postmortem (1-3 days)

**Declare resolved** → **Conduct postmortem**

Resolution Message:
```
✅ Incident Resolved
Severity: SEV-2
Duration: 45 minutes
Root Cause: [Brief description]
Resolution: [What fixed it]
Postmortem: [Link to document]
```

**Postmortem Template**:

```markdown
# Incident Postmortem: [Brief Title]

**Date**: YYYY-MM-DD
**Duration**: X hours Y minutes
**Severity**: SEV-X
**Incident Commander**: [Name]

## Summary
[2-3 sentence summary of what happened]

## Timeline
- **HH:MM UTC**: Incident detected (alert fired)
- **HH:MM UTC**: On-call engineer acknowledged
- **HH:MM UTC**: Root cause identified
- **HH:MM UTC**: Fix deployed
- **HH:MM UTC**: Incident resolved

## Root Cause
[Detailed explanation of what caused the issue]

## Impact
- **Users Affected**: X users / X%
- **Revenue Impact**: $X estimated loss
- **Duration**: X hours

## What Went Well
- Quick detection via monitoring
- Fast rollback procedure
- Clear communication

## What Went Poorly
- Monitoring didn't catch issue earlier
- Rollback process was manual
- Missing runbook for this scenario

## Action Items
- [ ] Add monitoring alert for [metric] (@owner, due date)
- [ ] Automate rollback process (@owner, due date)
- [ ] Update runbook with new procedure (@owner, due date)
- [ ] Add test coverage for [scenario] (@owner, due date)

## Lessons Learned
[Key takeaways for future incidents]
```

---

### Incident Evidence Storage

**Where to Store Evidence**:
- **Logs**: Export and save to `incidents/[date]/logs/`
- **Screenshots**: Save to `incidents/[date]/screenshots/`
- **Database Snapshots**: Save to secure cloud storage
- **Postmortem**: Save to `incidents/[date]/postmortem.md`

**Git Repository Structure**:
```
incidents/
├── 2024-01-15-database-outage/
│   ├── logs/
│   │   ├── backend-logs.txt
│   │   ├── vercel-logs.json
│   │   └── mongodb-atlas.log
│   ├── screenshots/
│   │   ├── error-dashboard.png
│   │   └── user-report.png
│   └── postmortem.md
└── 2024-01-20-stripe-webhook-failure/
    ├── logs/
    ├── screenshots/
    └── postmortem.md
```

---

## Communication Templates

### Customer Notification (Scheduled Maintenance)

**Subject**: Scheduled Maintenance - [Date/Time]

```
Hi [Customer Name],

We will be performing scheduled maintenance on PromptLens to improve 
performance and reliability.

Scheduled Time: [Day], [Date] at [Time] UTC
Expected Duration: 30 minutes
Impact: Brief service interruption (2-3 minutes), then full service

During this window:
- The dashboard may be briefly unavailable
- The browser extension will continue to work offline
- No data will be lost

We'll send an update when maintenance is complete.

Thank you for your patience!

The PromptLens Team
```

---

### Customer Notification (Unplanned Outage)

**Subject**: Service Issue Resolved - Update

```
Hi,

We experienced a service disruption earlier today that may have affected 
your use of PromptLens.

Issue: [Brief description]
Duration: [Start time] to [End time] UTC
Status: Fully resolved

What happened:
[2-3 sentence explanation in plain language]

What we did:
[Brief explanation of fix]

We apologize for any inconvenience this may have caused. If you continue 
to experience issues, please contact support@promptlens.app.

The PromptLens Team
```

---

### Status Update (During Incident)

**Platform**: Status page / Twitter / In-app banner

```
⚠️ We're investigating reports of [issue description]. 

Our team is working on a fix. We'll provide an update in 15 minutes.

Last updated: [HH:MM UTC]
```

```
🔧 We've identified the issue and are deploying a fix. 

Expected resolution: [HH:MM UTC]

Last updated: [HH:MM UTC]
```

```
✅ Issue resolved. All services are operating normally.

If you continue to experience issues, please contact support.

Last updated: [HH:MM UTC]
```

---

### Internal Status Update (Slack)

**#incidents channel**

```
🚨 SEV-2 INCIDENT DETECTED

Time: 14:30 UTC
Service: Backend API
Symptoms: High error rate (8%), slow response times
Affected Users: ~30% of active users
Incident Commander: @john

Status: Investigating
Next Update: 14:45 UTC

Dashboard: https://sentry.io/...
Logs: https://railway.app/...
```

---

### Stakeholder Update (Email)

**To**: Leadership team, Product managers

**Subject**: Incident Summary - [Date]

```
Hi team,

We experienced a [SEV-X] incident today. Here's a summary:

Incident: [Title]
Duration: [X hours Y minutes]
Resolved: [Time]

Impact:
- X% of users affected
- Average downtime: Y minutes per user
- Estimated revenue impact: $Z

Root Cause:
[2-3 sentence explanation]

Resolution:
[What we did to fix it]

Prevention:
[What we're doing to prevent recurrence]

Postmortem: [Link]

Let me know if you have questions.

[Your Name]
```

---

## Additional Resources

### Related Documentation

- [README.md](../README.md) - Main repository documentation
- [STRUCTURE.md](../STRUCTURE.md) - Project structure overview
- [backend/README.md](../backend/README.md) - Backend API documentation
- [extension/README.md](../extension/README.md) - Extension documentation
- [web/README.md](../web/README.md) - Web dashboard documentation

### Deployment Documentation

When available, refer to:
- `docs/phase1-testing-plan.md` - Testing strategy and procedures
- `docs/phase1-deployment-guide.md` - Deployment procedures

### External Resources

- **Stripe Documentation**: https://stripe.com/docs
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Railway Documentation**: https://docs.railway.app/
- **Vercel Documentation**: https://vercel.com/docs
- **Chrome Extension**: https://developer.chrome.com/docs/extensions/

### Support Contacts

- **Railway Support**: support@railway.app
- **Vercel Support**: support@vercel.com
- **MongoDB Support**: https://support.mongodb.com/
- **Stripe Support**: https://support.stripe.com/
- **Google Cloud Support**: https://cloud.google.com/support

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Operations Team | Initial release |

---

**End of Runbook**

For questions or suggestions, contact the operations team or update this document via pull request.
