# Test Resources

This directory contains shared test resources and utilities for the PromptLens monorepo.

## Contents

- **postman/** - Postman collections and environments for API testing

## Automated Test Suites

The monorepo includes comprehensive automated testing across all workspaces:

### Backend Tests

**Location:** `backend/src/__tests__/`  
**Framework:** Jest with MongoDB Memory Server  
**Coverage:** API endpoints, controllers, services, middleware

**Run Command:**
```bash
npm run test --workspace=backend
```

**Watch Mode:**
```bash
npm run test:watch --workspace=backend
```

**With Coverage:**
```bash
npm run test:coverage --workspace=backend
```

**Environment Setup:**
- No MongoDB instance required (uses MongoDB Memory Server)
- Environment variables loaded from `backend/.env` or test defaults
- MongoDB Memory Server version: 7.0.0 (set in CI or locally)

**Test Output:**
- Console output with pass/fail status
- Coverage report in `backend/coverage/`
- JUnit XML report for CI integration

---

### Extension Tests

**Location:** `extension/src/__tests__/`  
**Framework:** Jest with jsdom  
**Coverage:** React components, utilities, Chrome API mocks

**Run Command:**
```bash
npm run test --workspace=extension
```

**Watch Mode:**
```bash
npm run test:watch --workspace=extension
```

**Environment Setup:**
- No special environment required
- Chrome APIs are mocked via Jest
- Environment variables from `extension/.env` (if needed)

**Test Output:**
- Console output with component test results
- Coverage report in `extension/coverage/`

---

### Web Dashboard Tests

**Location:** `web/src/__tests__/`  
**Framework:** Jest with React Testing Library  
**Coverage:** React components, hooks, pages, services

**Run Command:**
```bash
npm run test --workspace=web
```

**Watch Mode:**
```bash
npm run test:watch --workspace=web
```

**Environment Setup:**
- NextAuth mocked for authentication tests
- API calls mocked using MSW (Mock Service Worker)
- Environment variables from `web/.env.local` or test defaults

**Test Output:**
- Console output with test results
- Coverage report in `web/coverage/`

---

### Web Dashboard E2E Tests (Playwright)

**Location:** `web/tests/e2e/`  
**Framework:** Playwright  
**Coverage:** End-to-end user flows, multi-page interactions, Stripe integration

**Run Command:**
```bash
npm run test:e2e --workspace=web
```

**Run Specific Browser:**
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**Debug Mode:**
```bash
npx playwright test --debug
```

**UI Mode (Interactive):**
```bash
npx playwright test --ui
```

**Environment Setup:**
- Requires backend API running (or mocked)
- Environment variables from `web/.env.local`
- Test database should be separate from development

**Test Output:**
- Console output with test results
- Screenshots on failure: `web/test-results/`
- Trace files: `web/test-results/*.zip`
- HTML report: `playwright-report/index.html`

**View HTML Report:**
```bash
npx playwright show-report
```

---

### Postman/Newman API Tests

**Location:** `tests/postman/`  
**Framework:** Postman/Newman  
**Coverage:** API contract validation, happy paths, error scenarios

**Run Command (Newman CLI):**
```bash
# Install Newman globally
npm install -g newman

# Run collection with local environment
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json
```

**Run Specific Folder:**
```bash
newman run tests/postman/promptlens-phase1.postman_collection.json \
  --folder "Optimize API"
```

**Generate HTML Report:**
```bash
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json \
  -r html --reporter-html-export postman-report.html
```

**Environment Setup:**
- Backend API must be running on configured URL
- Update `baseUrl` in environment file to match your setup
- Set `authToken` variable after signing in (see Postman README)
- Stripe CLI should be listening for webhook tests

**Test Output:**
- Console output with request results
- HTML report (if `-r html` specified)
- JUnit XML report for CI (if `-r junit` specified)

---

## Running All Tests

Run all automated tests across all workspaces:

```bash
npm run test
```

This will execute:
- Backend Jest tests
- Extension Jest tests
- Web Jest tests
- (Optional) Playwright E2E tests via CI

---

## Test Artifacts

### Storage Locations

| Test Suite | Artifact Type | Location |
|------------|---------------|----------|
| Backend | Coverage reports | `backend/coverage/` |
| Extension | Coverage reports | `extension/coverage/` |
| Web | Coverage reports | `web/coverage/` |
| Playwright | Screenshots (failures) | `web/test-results/` |
| Playwright | Trace files | `web/test-results/*.zip` |
| Playwright | HTML report | `playwright-report/` |
| Postman | HTML report | `postman-report.html` (if generated) |

### Viewing Artifacts

**Coverage Reports:**
```bash
# Open coverage report in browser
open backend/coverage/lcov-report/index.html
open extension/coverage/lcov-report/index.html
open web/coverage/lcov-report/index.html
```

**Playwright Report:**
```bash
npx playwright show-report
```

**Playwright Traces (for debugging):**
```bash
npx playwright show-trace web/test-results/trace.zip
```

### CI Artifacts

In CI/CD pipelines, artifacts are automatically uploaded:
- Playwright test reports (HTML + screenshots)
- Newman HTML reports
- Test coverage reports (optional)

Access them via:
- GitHub Actions: **Actions** tab → Select workflow run → **Artifacts** section
- GitLab CI: **Pipelines** → Select job → **Artifacts** download

---

## Environment Configuration

### Required Environment Variables

Each workspace requires specific environment variables for testing:

#### Backend Tests
```env
# Typically uses test defaults, but can override:
NODE_ENV=test
MONGODB_URI=<memory-server-uri>  # Auto-generated
JWT_SECRET=test-secret
STRIPE_SECRET_KEY=sk_test_...
```

#### Extension Tests
```env
# Usually mocked, no API calls:
VITE_API_BASE_URL=http://localhost:3000
```

#### Web Tests
```env
# For E2E tests only:
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=test-secret
```

#### Postman Tests
Set in `tests/postman/promptlens-phase1.postman_environment.json`:
- `baseUrl` - Backend API URL (e.g., http://localhost:3000)
- `authToken` - Valid JWT token (obtain via sign-in)
- `stripeWebhookSecret` - Webhook secret from Stripe CLI
- `stripePriceId` - Test price ID from Stripe Dashboard

---

## Test Data Management

### Seeding Test Data

**For Unit/Integration Tests:**
- Backend: MongoDB Memory Server starts fresh for each test suite
- Extension: Chrome storage mocked, no persistence
- Web: MSW mocks API responses, no real data needed

**For E2E Tests:**
Create seed scripts or use API requests to populate test data:

```bash
# Example: Create test user via API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

**For Postman Tests:**
Use setup requests in the collection or pre-request scripts:

```javascript
// Pre-request script to create test data
pm.sendRequest({
  url: pm.environment.get("baseUrl") + "/api/prompts",
  method: "POST",
  header: {
    "Authorization": "Bearer " + pm.environment.get("authToken"),
    "Content-Type": "application/json"
  },
  body: {
    mode: "raw",
    raw: JSON.stringify({
      original: "Test prompt",
      optimized: "Optimized test prompt"
    })
  }
}, function (err, res) {
  console.log("Test data created");
});
```

### Cleaning Test Data

**After E2E Tests:**
```bash
# Drop test database
mongo promptlens_test --eval "db.dropDatabase()"

# Or use API endpoint (if implemented)
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## CI Integration

### GitHub Actions

The `.github/workflows/phase1-ci.yml` pipeline automatically runs tests on:
- Pull requests to `main` branch
- Manual workflow dispatch

**Test Jobs:**
1. **backend-tests** - Run backend Jest suite
2. **extension-tests** - Run extension Jest suite
3. **web-tests** - Run web Jest suite
4. **playwright-e2e** - Run Playwright E2E tests
5. **postman-newman** - Run Postman collection with Newman (optional)

**Artifacts Uploaded:**
- Playwright test reports and traces
- Newman HTML reports

### Running Locally Before Push

Validate all tests pass before pushing:

```bash
# Lint all code
npm run lint

# Type check all packages
npm run typecheck

# Run all unit tests
npm run test

# Run E2E tests (requires services running)
npm run test:e2e --workspace=web

# Optional: Run Postman collection
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json
```

---

## Troubleshooting

### Common Issues

**Jest tests fail to start:**
- Clear Jest cache: `npx jest --clearCache`
- Delete node_modules and reinstall: `npm clean-install`
- Check for conflicting Node versions

**MongoDB Memory Server timeout:**
- Increase timeout in jest.config.js: `testTimeout: 30000`
- Check system resources (memory, CPU)
- Set `MONGODB_MEMORY_SERVER_VERSION=7.0.0` environment variable

**Playwright tests fail to run:**
- Install browsers: `npx playwright install`
- Update Playwright: `npm install -D @playwright/test@latest --workspace=web`
- Check if ports 3000/3001 are available

**Postman tests fail:**
- Verify backend API is running: `curl http://localhost:3000/api/health`
- Check `authToken` in environment file is valid
- Ensure Stripe CLI is running for webhook tests

**Extension tests fail:**
- Check Chrome API mocks are defined in test setup
- Verify jsdom environment is configured in jest.config.cjs

**Test coverage too low:**
- Identify untested files: `npm run test:coverage --workspace=<pkg>`
- Add tests for edge cases and error paths
- Ensure all exported functions are tested

---

## Best Practices

### Writing Tests

1. **Descriptive Test Names:** Use clear descriptions of what is being tested
   ```javascript
   it("should return 401 when auth token is missing", async () => { ... });
   ```

2. **Arrange-Act-Assert Pattern:**
   ```javascript
   // Arrange
   const user = createTestUser();
   
   // Act
   const response = await api.getProfile(user.id);
   
   // Assert
   expect(response.status).toBe(200);
   expect(response.data.email).toBe(user.email);
   ```

3. **Test Isolation:** Each test should be independent and not rely on others
   ```javascript
   beforeEach(() => {
     // Reset state before each test
   });
   ```

4. **Mock External Dependencies:** Don't make real API calls in unit tests
   ```javascript
   jest.mock("../services/gemini", () => ({
     optimize: jest.fn().mockResolvedValue("optimized prompt")
   }));
   ```

5. **Test Edge Cases:** Cover error scenarios, empty inputs, boundary conditions

### Maintaining Tests

- Keep tests up-to-date with code changes
- Refactor tests alongside production code
- Remove obsolete tests for removed features
- Update mocks when APIs change
- Document test setup requirements

### Performance

- Use `test.skip()` for temporarily disabled tests (don't delete)
- Run relevant tests during development: `npm run test:watch`
- Use test timeouts appropriately (avoid very long tests)
- Parallelize independent tests when possible

---

## Additional Resources

- [Backend Testing Documentation](../backend/README.md#testing)
- [Extension Manual Testing Guide](../extension/TESTING.md)
- [Web Manual QA Plan](../web/MANUAL_QA.md)
- [Phase 1 Testing Plan](../docs/phase1-testing-plan.md)
- [Postman Collection Guide](./postman/README.md)

---

## Support

If you encounter issues with tests:

1. Check this README for troubleshooting tips
2. Review test logs and error messages
3. Consult package-specific documentation
4. Ask in team chat or open an issue

For CI/CD test failures:
- Review GitHub Actions logs
- Download and inspect artifacts (screenshots, traces)
- Reproduce locally using same environment
- Check for environment variable mismatches
