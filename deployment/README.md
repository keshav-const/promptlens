# Deployment Guides

This directory contains detailed, component-specific deployment guides for the PromptLens application.

## 📚 Overview

Each guide provides actionable, step-by-step instructions for deploying a specific component of the PromptLens system to production. All guides include verification checklists to ensure successful deployment.

## 🗂️ Component Guides

### Core Infrastructure

1. **[Database Deployment](./database.md)** - MongoDB Atlas production cluster setup
   - Cluster creation and configuration
   - User roles and permissions
   - Network security and IP allowlisting
   - Index optimization
   - Backup and restore procedures

2. **[Backend API Deployment](./backend.md)** - Node.js/Express API on Railway or Render
   - Production build process
   - Platform-specific deployment (Railway/Render)
   - Environment variable configuration
   - Health checks and monitoring
   - Custom domain and CORS setup
   - Webhook endpoint registration

### Authentication & Payments

3. **[Google OAuth Configuration](./google-oauth.md)** - Production OAuth setup
   - OAuth consent screen publication
   - Redirect URI configuration
   - Credential generation and testing
   - Scope management

4. **[Razorpay Configuration](./razorpay.md)** - Live payment processing setup
   - Switch to live mode
   - Subscription plan creation (₹999/mo, ₹9,999/yr Pro plans)
   - Customer management setup
   - Webhook endpoint configuration
   - Payment verification testing

### User-Facing Applications

5. **[Web Dashboard Deployment](./dashboard.md)** - Next.js app on Vercel
   - Git integration setup
   - Environment variable management
   - Preview vs production branches
   - Custom domain configuration
   - NextAuth callback setup
   - Rate limiting considerations

6. **[Extension Deployment](./extension.md)** - Chrome Web Store publication
   - Production build configuration
   - Manifest updates
   - Chrome Web Store listing requirements
   - Asset preparation (icons, screenshots, privacy policy)
   - Submission and review process
   - Release channel management

## 🚀 Recommended Deployment Order

Follow this sequence to ensure all dependencies are met:

```
1. Database (MongoDB Atlas)           → Foundation
   ↓
2. Google OAuth                       → Authentication foundation
   ↓
3. Backend API (Railway/Render)       → Core services
   ↓
4. Stripe Configuration               → Payment processing
   ↓
5. Web Dashboard (Vercel)             → User interface
   ↓
6. Browser Extension (Chrome Store)   → End-user application
```

## 📋 Pre-Deployment Checklist

Before starting any deployment, ensure you have:

- [ ] All required accounts created (Railway/Render, Vercel, MongoDB Atlas, Stripe, Google Cloud, Chrome Web Store)
- [ ] CLI tools installed (Railway/Render CLI, Vercel CLI, Stripe CLI)
- [ ] Local development environment working
- [ ] All tests passing locally
- [ ] Build process succeeds for all components
- [ ] Environment variables documented and securely stored
- [ ] Team members assigned deployment responsibilities
- [ ] Rollback procedures reviewed and understood

## 🔒 Security Best Practices

### Secret Management
- Never commit secrets to version control
- Use secret management tools (Railway/Render secrets, Vercel environment variables)
- Rotate secrets every 90 days
- Maintain encrypted backup of all credentials

### Network Security
- Restrict database access to application IPs only
- Use HTTPS for all public endpoints
- Configure CORS appropriately (specific origins, not `*`)
- Enable rate limiting on all public APIs

### Authentication
- Use strong, randomly generated secrets
- Enable multi-factor authentication on all service accounts
- Limit API key permissions to minimum required scope
- Monitor authentication logs for suspicious activity

## 📊 Post-Deployment Verification

After completing all deployments, verify the entire system:

### Automated Checks
```bash
# Run health check script
./deployment/verify-health.sh

# Check all services are responding
curl https://api.promptlens.app/health
curl https://dashboard.promptlens.app
```

### Manual Testing
- [ ] User can sign up with Google OAuth
- [ ] User can capture prompts from ChatGPT
- [ ] User can capture prompts from Google Gemini
- [ ] User can view prompts in dashboard
- [ ] User can upgrade to Pro via Stripe
- [ ] Webhook properly upgrades user plan
- [ ] Pro user has increased limits
- [ ] User can cancel subscription
- [ ] Extension connects to production API

## 🔄 Updating Existing Deployments

### Backend Updates
```bash
# Update code
git pull origin main

# Run tests
npm run test --workspace=backend

# Deploy update
# Railway: git push or railway up
# Render: git push (auto-deploy) or manual trigger
```

### Dashboard Updates
```bash
# Update code
git pull origin main

# Run tests
npm run test --workspace=web

# Deploy update
vercel --prod
# Or push to main branch for auto-deploy
```

### Extension Updates
```bash
# Update code
git pull origin main

# Increment version in manifest.json
# Build new version
npm run build --workspace=extension

# Create ZIP and upload to Chrome Web Store
# Submit for review
```

## 📖 Additional Resources

- **[Phase 1 Deployment Guide](../docs/phase1-deployment-guide.md)** - Overall deployment strategy
- **[Phase 1 Validation Runbook](../docs/phase1-validation-runbook.md)** - Testing and troubleshooting
- **[Backend API Documentation](../backend/API.md)** - API reference
- **[Backend README](../backend/README.md)** - Backend development guide
- **[Web Dashboard README](../web/README.md)** - Dashboard development guide
- **[Extension README](../extension/README.md)** - Extension development guide

## 🆘 Getting Help

### Service-Specific Support

| Service | Documentation | Support |
|---------|--------------|---------|
| Railway | https://docs.railway.app | support@railway.app |
| Render | https://render.com/docs | support@render.com |
| Vercel | https://vercel.com/docs | support@vercel.com |
| MongoDB Atlas | https://docs.atlas.mongodb.com | support.mongodb.com |
| Stripe | https://stripe.com/docs | support.stripe.com |
| Google Cloud | https://cloud.google.com/docs | Console support |
| Chrome Web Store | https://developer.chrome.com/docs/webstore | chrome-webstore-support@google.com |

### Internal Support

- **Deployment Issues**: Contact DevOps team lead
- **Backend Issues**: Contact Backend Engineer
- **Frontend Issues**: Contact Frontend Engineer
- **Payment Issues**: Contact Backend Engineer + Product Manager

## 🔧 Troubleshooting

### Common Issues

**Deployment fails with environment variable error**
- Verify all required variables are set in platform settings
- Check for typos in variable names
- Ensure secrets are properly formatted (no extra spaces)

**Database connection timeout**
- Verify IP allowlist includes deployment platform IPs
- Check MongoDB Atlas cluster is running
- Confirm connection string format is correct

**OAuth redirect errors**
- Ensure all redirect URIs are registered in Google Cloud Console
- Verify NEXTAUTH_URL matches deployment URL exactly
- Check for HTTPS requirement in production

**Stripe webhook not receiving events**
- Confirm webhook endpoint URL is correct
- Verify webhook signing secret matches Stripe dashboard
- Check backend logs for signature validation errors

**Extension can't connect to API**
- Verify API URL in extension build matches backend URL
- Check CORS configuration allows extension origin
- Confirm API is accepting requests (test with curl)

For more troubleshooting guidance, see the [Phase 1 Validation Runbook](../docs/phase1-validation-runbook.md).

---

**Last Updated**: [Date]  
**Maintained By**: [Team Name]
