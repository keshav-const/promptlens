# PromptLens Phase 1 - Postman Collection

This directory contains the Postman collection and environment for testing the PromptLens API.

## Contents

- **promptlens-phase1.postman_collection.json** - Complete API test collection
- **promptlens-phase1.postman_environment.json** - Environment variables (local development)

## Quick Start

### 1. Import Collection and Environment

**Using Postman Desktop:**
1. Open Postman application
2. Click **Import** button (top-left)
3. Drag and drop both JSON files or click **Choose Files**
4. Select `promptlens-phase1.postman_collection.json`
5. Select `promptlens-phase1.postman_environment.json`
6. Click **Import**

**Using Newman CLI:**
```bash
# Install Newman globally
npm install -g newman

# Run collection
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json
```

### 2. Configure Environment Variables

Select the imported environment in Postman (top-right dropdown: **PromptLens Phase 1 - Local**).

Update the following variables:

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `baseUrl` | Backend API URL | Default: `http://localhost:3000` |
| `authToken` | Valid JWT token | See [Obtaining Auth Token](#obtaining-auth-token) |
| `freeUserToken` | Token for free plan user | Optional - for multi-user testing |
| `proUserToken` | Token for pro plan user | Optional - for multi-user testing |
| `stripeSecretKey` | Stripe test secret key | From Stripe Dashboard (Developers > API keys) |
| `stripeWebhookSecret` | Webhook signing secret | From Stripe CLI: `stripe listen` |
| `stripePriceId` | Stripe price ID for Pro | From Stripe Dashboard (Products) |

### 3. Start Backend Services

Ensure the backend API is running:

```bash
# From repository root
npm run dev --workspace=backend

# Verify it's running
curl http://localhost:3000/api/health
```

### 4. Run Collection

**In Postman:**
1. Select the **PromptLens Phase 1 API** collection
2. Click **Run collection** button
3. Select environment: **PromptLens Phase 1 - Local**
4. Click **Run PromptLens Phase 1 API**
5. View test results in the runner window

**With Newman:**
```bash
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export postman-report.html
```

---

## Obtaining Auth Token

The collection requires a valid JWT authentication token to test protected endpoints.

### Option 1: Sign In via Dashboard (Recommended)

1. **Start the web dashboard:**
   ```bash
   npm run dev --workspace=web
   ```

2. **Sign in:**
   - Navigate to http://localhost:3001
   - Click "Sign in with Google"
   - Complete OAuth flow

3. **Extract token from browser:**
   - Open browser DevTools (F12)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Navigate to **Local Storage** > `http://localhost:3001`
   - Find key: `promptlens_auth_token`
   - Copy the value (JWT token)

4. **Set in Postman:**
   - Open environment: **PromptLens Phase 1 - Local**
   - Set `authToken` variable to the copied value
   - Save environment

### Option 2: Generate Token via Script

Create a test user and generate a token programmatically:

```bash
# Using Node.js script (backend/scripts/generate-token.js)
cd backend
node scripts/generate-token.js --email="test@example.com"

# Output: JWT token printed to console
```

**Script example (create if doesn't exist):**

```javascript
// backend/scripts/generate-token.js
const jwt = require('jsonwebtoken');

const payload = {
  userId: '507f1f77bcf86cd799439011', // Example user ID
  email: process.argv[2] || 'test@example.com',
  plan: 'free'
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
  expiresIn: '7d'
});

console.log('Token:', token);
```

### Option 3: Direct API Request (if auth endpoint exists)

If the backend has a test authentication endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Copy the `token` from the response.

### Option 4: Use Existing Token from Tests

Check backend test files for generated tokens:

```bash
# Search for JWT tokens in test files
grep -r "Bearer" backend/src/__tests__/
```

---

## Collection Structure

### Folders

1. **Health Check** - API availability verification
2. **Authentication** - Auth middleware testing (valid, missing, malformed tokens)
3. **Optimize API** - Prompt optimization endpoint
   - Valid prompts
   - Empty prompts
   - Missing fields
   - Special characters
   - Quota exhaustion scenarios
4. **Usage API** - Usage statistics and quota tracking
5. **History API** - Prompt history retrieval
6. **Billing API** - Stripe checkout session creation
7. **Stripe Webhooks** - Webhook signature validation
8. **Rate Limiting** - Rate limit enforcement

### Test Scripts

Each request includes test assertions:
- HTTP status code validation
- Response structure verification
- Data type checks
- Business logic validation
- Performance checks (response time)

### Example Test Output

```
┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│                requests │               18 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│            test-scripts │               36 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│      prerequest-scripts │                2 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│              assertions │               65 │                0 │
└─────────────────────────┴──────────────────┴──────────────────┘
```

---

## Running Specific Tests

### Run Single Folder

**Postman:**
1. Expand the collection
2. Right-click on a folder (e.g., "Optimize API")
3. Select **Run folder**

**Newman:**
```bash
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json \
  --folder "Optimize API"
```

### Run Single Request

**Postman:**
1. Click on the request
2. Click **Send** button
3. View response and test results in the bottom panel

**Newman:**
```bash
# Newman doesn't support single requests - use Postman UI
```

---

## Testing Scenarios

### Happy Path Testing

Run the collection with default settings to test successful scenarios:
- Valid authentication
- Successful optimizations
- Usage tracking
- History retrieval
- Checkout flow

### Error Scenarios

The collection includes comprehensive error testing:
- **401 Unauthorized**: Missing or invalid tokens
- **400 Bad Request**: Empty/missing prompt fields, malformed payloads
- **429 Too Many Requests**: Rate limiting and quota exhaustion

### Quota Testing

To test quota exhaustion (free users limited to 10 requests/day):

1. **Set up free user token:**
   - Sign in with a new/test user
   - Copy token to `freeUserToken` variable

2. **Make 10 optimization requests:**
   ```bash
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/optimize \
       -H "Authorization: Bearer $FREE_USER_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"prompt": "Test '$i'"}'
   done
   ```

3. **11th request should return 429:**
   ```bash
   curl -X POST http://localhost:3000/api/optimize \
     -H "Authorization: Bearer $FREE_USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Over limit"}'
   
   # Expected: {"success": false, "error": {"message": "Daily quota exceeded"}}
   ```

### Stripe Webhook Testing

**Important:** Stripe webhooks require proper signature verification and cannot be tested directly via Postman. Use Stripe CLI instead.

**Test with Stripe CLI:**

1. **Start webhook forwarding:**
   ```bash
   stripe listen --forward-to http://localhost:3000/api/upgrade
   ```

2. **Trigger test events:**
   ```bash
   # Successful checkout
   stripe trigger checkout.session.completed
   
   # Subscription canceled
   stripe trigger customer.subscription.deleted
   
   # Payment failed
   stripe trigger invoice.payment_failed
   ```

3. **Verify in backend logs:**
   - Check console output for webhook event processing
   - Verify user plan updated in database

**Postman webhook requests** (included in collection) will fail signature validation - this is expected and correct behavior.

---

## Rate Limiting Test

To test rate limiting (default: 100 requests per 15 minutes):

### Option 1: Newman with Iterations

```bash
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json \
  --folder "Rate Limiting" \
  -n 101
```

Expected: First 100 requests succeed (200), 101st fails (429).

### Option 2: Bash Loop

```bash
for i in {1..101}; do
  echo "Request $i:"
  curl -X GET http://localhost:3000/api/health
  echo ""
done
```

### Option 3: Postman Collection Runner

1. Select "Rate Limiting" folder
2. Click **Run**
3. Set **Iterations** to `101`
4. Run and observe when 429 errors start

---

## Environment Management

### Multiple Environments

Create additional environments for different deployment stages:

**Production Environment:**
```json
{
  "name": "PromptLens Phase 1 - Production",
  "values": [
    {
      "key": "baseUrl",
      "value": "https://api.promptlens.com"
    },
    {
      "key": "authToken",
      "value": ""
    }
  ]
}
```

**Staging Environment:**
```json
{
  "name": "PromptLens Phase 1 - Staging",
  "values": [
    {
      "key": "baseUrl",
      "value": "https://staging-api.promptlens.com"
    }
  ]
}
```

### Switching Environments

In Postman:
1. Click environment dropdown (top-right)
2. Select desired environment
3. All requests will use that environment's variables

In Newman:
```bash
newman run collection.json -e production-environment.json
newman run collection.json -e staging-environment.json
```

---

## CI/CD Integration

### GitHub Actions

Add a Newman step to your CI pipeline:

```yaml
# .github/workflows/api-tests.yml
- name: Run API Tests
  run: |
    npm install -g newman
    newman run tests/postman/promptlens-phase1.postman_collection.json \
      -e tests/postman/promptlens-phase1.postman_environment.json \
      --reporters cli,junit \
      --reporter-junit-export test-results.xml
  env:
    AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
```

### Environment Variables from CI

Override environment variables via CLI:

```bash
newman run collection.json -e environment.json \
  --env-var "baseUrl=$API_URL" \
  --env-var "authToken=$AUTH_TOKEN"
```

---

## Troubleshooting

### Error: "Could not get any response"

**Cause:** Backend API is not running or unreachable.

**Solution:**
```bash
# Start backend
npm run dev --workspace=backend

# Verify health endpoint
curl http://localhost:3000/api/health
```

### Error: "401 Unauthorized" on all protected endpoints

**Cause:** `authToken` variable is empty or invalid.

**Solution:**
1. Obtain a valid token (see [Obtaining Auth Token](#obtaining-auth-token))
2. Set `authToken` in environment
3. Ensure token hasn't expired (default: 7 days)

### Error: "ECONNREFUSED"

**Cause:** Wrong `baseUrl` or backend not listening on expected port.

**Solution:**
1. Check backend logs for actual port
2. Update `baseUrl` in environment (e.g., `http://localhost:3000`)
3. Verify no firewall blocking

### Error: "stripe-signature validation failed"

**Cause:** Expected behavior - webhooks require valid Stripe signatures.

**Solution:** Use Stripe CLI to trigger webhook events (see [Stripe Webhook Testing](#stripe-webhook-testing)).

### Error: Newman not found

**Cause:** Newman CLI not installed.

**Solution:**
```bash
npm install -g newman
newman --version
```

### Error: "Too many requests" (429)

**Cause:** Rate limit reached during rapid testing.

**Solution:**
- Wait 15 minutes for rate limit window to reset
- Adjust rate limit config in backend `.env`:
  ```
  RATE_LIMIT_WINDOW_MS=900000
  RATE_LIMIT_MAX_REQUESTS=100
  ```
- Restart backend after config change

---

## Best Practices

### Before Testing

- ✅ Ensure all services are running (backend, database)
- ✅ Verify environment variables are set correctly
- ✅ Have fresh auth tokens (not expired)
- ✅ Clear previous test data if needed

### During Testing

- ✅ Run health check first to verify connectivity
- ✅ Test authentication scenarios before complex flows
- ✅ Review response bodies, not just status codes
- ✅ Check backend logs for error details
- ✅ Monitor database for data changes

### After Testing

- ✅ Review all test results (look for warnings, not just failures)
- ✅ Document any failing tests or unexpected behavior
- ✅ Clean up test data if testing against shared database
- ✅ Save updated collection if you added new requests

---

## Extending the Collection

### Adding New Requests

1. **In Postman:**
   - Right-click on a folder
   - Select **Add Request**
   - Configure method, URL, headers, body
   - Add test assertions in **Tests** tab

2. **Export updated collection:**
   - Right-click collection
   - Select **Export**
   - Choose **Collection v2.1**
   - Replace `promptlens-phase1.postman_collection.json`

### Adding Test Assertions

In the **Tests** tab of any request:

```javascript
// Status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Response structure
pm.test("Response has required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('data');
});

// Data validation
pm.test("Data is correct type", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.count).to.be.a('number');
    pm.expect(jsonData.data.items).to.be.an('array');
});

// Performance
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

### Adding Environment Variables

1. Click **Environments** (left sidebar)
2. Select **PromptLens Phase 1 - Local**
3. Click **Add**
4. Enter variable name and initial value
5. Click **Save**

Use in requests: `{{variableName}}`

---

## Additional Resources

- [Postman Learning Center](https://learning.postman.com/)
- [Newman CLI Documentation](https://github.com/postmanlabs/newman)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Backend API Documentation](../../backend/README.md)
- [Phase 1 Testing Plan](../../docs/phase1-testing-plan.md)

---

## Support

For issues with the collection:
1. Verify prerequisites are met
2. Check troubleshooting section
3. Review backend logs for detailed errors
4. Consult [Phase 1 Testing Plan](../../docs/phase1-testing-plan.md)
5. Open an issue with reproduction steps

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial Phase 1 collection with all core endpoints |
