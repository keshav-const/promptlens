# Database Deployment Guide

## Overview

This guide covers setting up a production MongoDB Atlas cluster for the PromptLens application. MongoDB Atlas provides managed MongoDB hosting with automated backups, monitoring, and scaling.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Cluster Creation](#cluster-creation)
- [Database User Configuration](#database-user-configuration)
- [Network Access Configuration](#network-access-configuration)
- [Database and Collections Setup](#database-and-collections-setup)
- [Index Optimization](#index-optimization)
- [Backup Configuration](#backup-configuration)
- [Connection String Generation](#connection-string-generation)
- [Security Best Practices](#security-best-practices)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Maintenance Tasks](#maintenance-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access
- [ ] MongoDB Atlas account (sign up at https://www.mongodb.com/cloud/atlas)
- [ ] Credit card for paid tier (M10+ recommended for production)
- [ ] Access to backend deployment platform (to get IP addresses)

### Planning Decisions
- **Cluster Tier**: M10 minimum for production (recommended: M20 for better performance)
- **Region**: Choose region closest to your backend deployment
- **Provider**: AWS, Google Cloud, or Azure (match your backend provider if possible)
- **Backup**: Continuous backup recommended for production

## Cluster Creation

### Step 1: Create Organization and Project

1. Log in to MongoDB Atlas: https://cloud.mongodb.com
2. Create a new organization (or use existing)
3. Create a new project: "PromptLens Production"

### Step 2: Build a Cluster

1. Click "Build a Database"
2. Choose "Shared" (M0) for testing or "Dedicated" for production

**Recommended Production Configuration:**
```
Cluster Tier: M10 (2GB RAM, 10GB storage)
              or M20 (4GB RAM, 20GB storage) for better performance

Cloud Provider & Region:
  - AWS: us-east-1 (N. Virginia) or region closest to backend
  - Google Cloud: us-central1 (Iowa)
  - Azure: East US

Cluster Name: promptlens-prod

MongoDB Version: 7.0 (latest stable)

Backup: Enable continuous backup (Dedicated clusters only)
```

3. Click "Create Cluster" (provisioning takes 7-10 minutes)

### Step 3: Configure Cluster Settings

While cluster is provisioning, configure these settings:

#### Connection Settings
```
Cluster → Connect → Connection Method: Drivers
Driver: Node.js
Version: 5.5 or later
```

#### Auto-Scaling (Optional for M10+)
```
Cluster → Configuration → Auto-Scaling
- Enable cluster tier auto-scaling: M10 → M20 (optional)
- Enable storage auto-scaling: Recommended
```

## Database User Configuration

### Step 1: Create Production Database User

1. Go to Security → Database Access
2. Click "Add New Database User"

**User Configuration:**
```
Authentication Method: Password

Username: promptlens_prod
Password: [Generate strong password with: openssl rand -base64 32]
          Example: X8n2kP9mQ3vL5tY1wR6dF4hJ7sA0cB8e

Database User Privileges:
  - Built-in Role: Read and write to any database
  - Or custom role: readWrite on 'promptlens' database

Restrict Access to Specific Clusters:
  - Select: promptlens-prod

Temporary User: No (leave unchecked)
```

3. Click "Add User"
4. **IMPORTANT**: Save credentials securely (password manager, secret vault)

### Step 2: Create Read-Only User (Optional, for analytics)

Repeat above steps with:
```
Username: promptlens_readonly
Database User Privileges: Read any database
```

## Network Access Configuration

### Step 1: Configure IP Allowlist

1. Go to Security → Network Access
2. Click "Add IP Address"

**For Cloud Deployments (Railway, Render, Vercel):**
```
Option 1: Allow Access from Anywhere (easiest)
  IP Address: 0.0.0.0/0
  Comment: Cloud platform access
  
⚠️ Warning: This allows connections from any IP. 
           Ensure strong password and auth.

Option 2: Specific IPs (more secure)
  Railway: Add Railway's IP ranges (check Railway docs)
  Render: Add Render's IP ranges (check Render docs)
  Comment: Railway/Render production servers
```

**For Static IP Deployments:**
```
IP Address: [Your backend server IP]
Comment: Production backend server
```

3. Click "Confirm"

### Step 2: Add Developer IPs (Optional)

For emergency database access:
```
IP Address: [Your office/VPN IP]
Comment: Developer emergency access
Temporary: Yes (expire after 7 days)
```

## Database and Collections Setup

### Step 1: Connect to Database

Using MongoDB Compass (GUI):
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Get connection string from Atlas (Security → Database Access → Connect)
3. Open Compass and paste connection string
4. Connect

Using MongoDB Shell:
```bash
# Install mongosh
brew install mongosh

# Connect
mongosh "mongodb+srv://promptlens_prod:PASSWORD@cluster.mongodb.net/"
```

### Step 2: Create Database

```javascript
// In mongosh or Compass
use promptlens

// Verify database created
show dbs
```

### Step 3: Create Collections

The backend will auto-create collections on first use, but you can pre-create them:

```javascript
// Users collection
db.createCollection("users")

// Prompts collection
db.createCollection("prompts")

// Webhook events collection (with TTL index)
db.createCollection("webhookevents")
```

## Index Optimization

### Create Production Indexes

These indexes optimize query performance:

```javascript
// Connect to database
use promptlens

// Users collection indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ googleId: 1 }, { unique: true, sparse: true })
db.users.createIndex({ stripeCustomerId: 1 }, { sparse: true })
db.users.createIndex({ stripeSubscriptionId: 1 }, { sparse: true })
db.users.createIndex({ createdAt: -1 })

// Prompts collection indexes
db.prompts.createIndex({ userId: 1 })
db.prompts.createIndex({ userId: 1, createdAt: -1 })
db.prompts.createIndex({ source: 1 })
db.prompts.createIndex({ createdAt: -1 })

// WebhookEvents collection indexes
db.webhookevents.createIndex({ eventId: 1 }, { unique: true })
db.webhookevents.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })  // 30 days TTL

// Verify indexes created
db.users.getIndexes()
db.prompts.getIndexes()
db.webhookevents.getIndexes()
```

### Index Creation Script

Save this script for automated index creation:

```javascript
// Save as deployment/scripts/create-indexes.js
const indexes = {
  users: [
    { key: { email: 1 }, options: { unique: true } },
    { key: { googleId: 1 }, options: { unique: true, sparse: true } },
    { key: { stripeCustomerId: 1 }, options: { sparse: true } },
    { key: { stripeSubscriptionId: 1 }, options: { sparse: true } },
    { key: { createdAt: -1 } }
  ],
  prompts: [
    { key: { userId: 1 } },
    { key: { userId: 1, createdAt: -1 } },
    { key: { source: 1 } },
    { key: { createdAt: -1 } }
  ],
  webhookevents: [
    { key: { eventId: 1 }, options: { unique: true } },
    { key: { createdAt: 1 }, options: { expireAfterSeconds: 2592000 } }
  ]
};

async function createIndexes(db) {
  for (const [collection, indexList] of Object.entries(indexes)) {
    console.log(`Creating indexes for ${collection}...`);
    for (const index of indexList) {
      await db.collection(collection).createIndex(index.key, index.options || {});
    }
  }
  console.log('All indexes created successfully!');
}

module.exports = { createIndexes };
```

## Backup Configuration

### Continuous Backup (Recommended for M10+)

1. Go to Cluster → Backup
2. Enable Continuous Backup
3. Configure retention policy:
   ```
   Snapshot Frequency: Every 6 hours
   Retention: 7 days (daily snapshots)
              30 days (weekly snapshots)
              3 months (monthly snapshots)
   ```

### Automated Backups (M2/M5 Clusters)

```
Snapshot Frequency: Daily
Retention Period: 7 days
```

### Manual Backup (For Testing)

```bash
# Using mongodump
mongodump --uri="mongodb+srv://promptlens_prod:PASSWORD@cluster.mongodb.net/promptlens" --out=./backup-$(date +%Y%m%d)

# Compress backup
tar -czf backup-$(date +%Y%m%d).tar.gz backup-$(date +%Y%m%d)/
```

### Backup Verification Schedule

Test restore process monthly:

1. Create test cluster
2. Restore latest backup to test cluster
3. Verify data integrity
4. Document restore time
5. Delete test cluster

## Connection String Generation

### Production Connection String Format

```
mongodb+srv://[username]:[password]@[cluster-address]/[database]?retryWrites=true&w=majority
```

### Generate Connection String

1. Go to Cluster → Connect → Connect your application
2. Select Driver: Node.js, Version: 5.5 or later
3. Copy connection string
4. Replace placeholders:

```bash
# Template
mongodb+srv://promptlens_prod:<password>@promptlens-prod.abc123.mongodb.net/?retryWrites=true&w=majority

# Final (add database name)
mongodb+srv://promptlens_prod:X8n2kP9mQ3vL5tY1wR6dF4hJ7sA0cB8e@promptlens-prod.abc123.mongodb.net/promptlens?retryWrites=true&w=majority
```

### Connection String Options

For production, consider these additional options:

```
# Full production connection string
mongodb+srv://promptlens_prod:PASSWORD@promptlens-prod.abc123.mongodb.net/promptlens?retryWrites=true&w=majority&maxPoolSize=50&minPoolSize=10&serverSelectionTimeoutMS=5000&socketTimeoutMS=30000
```

Options explained:
- `retryWrites=true` - Auto-retry failed writes
- `w=majority` - Write concern (wait for majority of replicas)
- `maxPoolSize=50` - Max connections in pool
- `minPoolSize=10` - Minimum connections maintained
- `serverSelectionTimeoutMS=5000` - Timeout for server selection
- `socketTimeoutMS=30000` - Socket timeout

### Test Connection

```bash
# Test with mongosh
mongosh "mongodb+srv://promptlens_prod:PASSWORD@promptlens-prod.abc123.mongodb.net/promptlens?retryWrites=true&w=majority"

# Test with Node.js
node -e "const {MongoClient} = require('mongodb'); const client = new MongoClient('mongodb+srv://promptlens_prod:PASSWORD@promptlens-prod.abc123.mongodb.net/promptlens?retryWrites=true&w=majority'); client.connect().then(() => console.log('Connected!')).catch(console.error).finally(() => client.close());"
```

## Security Best Practices

### Password Management
- ✅ Use strong, randomly generated passwords (32+ characters)
- ✅ Store in secure password manager or secret vault
- ✅ Never commit to version control
- ✅ Rotate every 90 days

### Access Control
- ✅ Use principle of least privilege (specific database permissions)
- ✅ Create separate users for different environments (prod, staging)
- ✅ Enable MFA on Atlas account
- ✅ Limit network access to known IPs when possible

### Encryption
- ✅ Enable encryption at rest (automatic on Atlas)
- ✅ Use TLS/SSL for connections (automatic with mongodb+srv://)
- ✅ Consider field-level encryption for sensitive data

### Audit Logging
```
Cluster → Advanced → Audit Log
- Enable audit log
- Configure log retention
- Review regularly for suspicious activity
```

## Monitoring and Alerts

### Configure Alerts

1. Go to Project → Alerts
2. Create alert configurations:

**Critical Alerts:**
```
Alert: Cluster has too many connections
Threshold: > 80% of max connections
Action: Email technical lead

Alert: Cluster is running out of disk space
Threshold: > 90% disk usage
Action: Email DevOps + Slack

Alert: Query performance degraded
Threshold: Average query execution time > 1000ms
Action: Email backend engineer
```

**Warning Alerts:**
```
Alert: High CPU usage
Threshold: > 75% for 5 minutes
Action: Email backend engineer

Alert: High memory usage
Threshold: > 80% for 5 minutes
Action: Email backend engineer

Alert: Replication lag
Threshold: > 10 seconds
Action: Email DevOps
```

### Enable Performance Advisor

```
Cluster → Performance Advisor
- Enable recommendations
- Review weekly for index suggestions
- Apply recommended indexes
```

### Monitoring Dashboard

Key metrics to monitor:
- Connections (current, available)
- CPU usage
- Memory usage
- Disk usage
- Query performance (slow queries > 100ms)
- Network traffic
- Replica set status

Access via: Cluster → Metrics

## Maintenance Tasks

### Daily Tasks
- [ ] Check alert notifications
- [ ] Review slow query log
- [ ] Monitor connection count

### Weekly Tasks
- [ ] Review Performance Advisor recommendations
- [ ] Check backup completion
- [ ] Review disk usage trends
- [ ] Audit access logs

### Monthly Tasks
- [ ] Test backup restore process
- [ ] Review and optimize indexes
- [ ] Analyze growth trends (plan for scaling)
- [ ] Review user access (remove inactive users)
- [ ] Update documentation

### Quarterly Tasks
- [ ] Rotate database passwords
- [ ] Review and update alert thresholds
- [ ] Capacity planning review
- [ ] Security audit

### Password Rotation Procedure

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update Atlas user password
# Atlas UI → Security → Database Access → Edit User

# 3. Update backend environment variable
# Railway: railway variables set MONGODB_URI="mongodb+srv://promptlens_prod:NEW_PASSWORD@..."
# Render: Update via dashboard

# 4. Restart backend services
# Railway: railway restart
# Render: Manual restart or auto-restart on env change

# 5. Verify connection
curl https://api.promptlens.app/health

# 6. Update password in secret vault
# Update password manager entry
```

## Troubleshooting

### Connection Timeout

**Problem**: Backend can't connect to MongoDB
```bash
Error: MongoServerSelectionError: connection timed out
```

**Solutions:**
1. Check IP allowlist includes backend IPs (or 0.0.0.0/0)
2. Verify cluster is running (not paused)
3. Test connection string format
4. Check username/password correct

```bash
# Test connection
mongosh "YOUR_CONNECTION_STRING"
```

### Authentication Failed

**Problem**: 
```bash
Error: MongoError: Authentication failed
```

**Solutions:**
1. Verify username/password correct
2. Check user has permission for specified database
3. Ensure password doesn't contain special characters that need URL encoding
4. Try encoding password:

```javascript
const password = 'p@ssw0rd!';
const encoded = encodeURIComponent(password);
console.log(encoded);  // p%40ssw0rd%21
```

### Slow Queries

**Problem**: Queries taking > 1000ms

**Solutions:**
1. Check Performance Advisor for index recommendations
2. Review slow query log:
   ```
   Cluster → Performance → Profiler
   ```
3. Analyze query patterns:
   ```javascript
   // Enable profiling
   db.setProfilingLevel(1, { slowms: 100 })
   
   // View slow queries
   db.system.profile.find().limit(10).sort({ ts: -1 })
   ```
4. Create missing indexes
5. Consider upgrading cluster tier

### Out of Connections

**Problem**: 
```bash
Error: Too many connections
```

**Solutions:**
1. Increase connection pool size in backend config
2. Fix connection leaks (ensure all connections are closed)
3. Upgrade cluster tier for more connections
4. Review connection count:
   ```
   Atlas UI → Cluster → Metrics → Connections
   ```

### Disk Space Full

**Problem**: Cluster running out of storage

**Solutions:**
1. Enable storage auto-scaling (Cluster → Configuration)
2. Clean up old data:
   ```javascript
   // Delete old webhook events (older than 30 days)
   db.webhookevents.deleteMany({
     createdAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) }
   })
   ```
3. Archive old prompts to separate collection
4. Upgrade cluster tier for more storage

## Deployment Checklist

### Pre-Deployment
- [ ] MongoDB Atlas account created
- [ ] Credit card added for paid tier
- [ ] Project created ("PromptLens Production")
- [ ] Cluster tier selected (M10+ for production)
- [ ] Region selected (close to backend)

### Cluster Configuration
- [ ] Cluster created and running
- [ ] Production database user created
- [ ] Strong password generated and stored securely
- [ ] IP allowlist configured (0.0.0.0/0 or specific IPs)
- [ ] Network access verified

### Database Setup
- [ ] Database created (`promptlens`)
- [ ] Collections created (users, prompts, webhookevents)
- [ ] All indexes created and verified
- [ ] Connection string tested locally

### Backup & Security
- [ ] Continuous backup enabled (or daily for M2/M5)
- [ ] Backup retention policy configured
- [ ] Test restore performed
- [ ] MFA enabled on Atlas account
- [ ] Audit logging enabled

### Monitoring
- [ ] Critical alerts configured
- [ ] Warning alerts configured
- [ ] Performance Advisor enabled
- [ ] Metrics dashboard bookmarked

### Documentation
- [ ] Connection string stored in secret vault
- [ ] Database user credentials documented
- [ ] Maintenance schedule documented
- [ ] Emergency access procedures documented

## Next Steps

After database deployment:

1. **[Configure Google OAuth](./google-oauth.md)** - Set up authentication
2. **[Deploy Backend](./backend.md)** - Deploy API with database connection
3. Update backend `MONGODB_URI` environment variable with production connection string

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Indexing Best Practices](https://docs.mongodb.com/manual/indexes/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

**Need Help?**
- Database issues: Contact Backend Engineer
- Atlas support: support.mongodb.com
- Emergency: MongoDB Atlas support phone (Premium tier)
