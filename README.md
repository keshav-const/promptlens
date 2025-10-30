# Monorepo Project

[![CI Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/phase1-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/phase1-ci.yml)

A monorepo containing a browser extension, backend API, and web dashboard application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Workspaces](#workspaces)
- [Scripts](#scripts)
- [Documentation](#documentation)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.0.0 (we recommend using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- **npm**: >= 9.0.0 (comes with Node.js)

### Check Your Versions

```bash
node --version  # Should be >= 20.0.0
npm --version   # Should be >= 9.0.0
```

## 📁 Project Structure

```
.
├── extension/          # Browser extension package
│   ├── src/           # Extension source code
│   ├── public/        # Static assets and manifest
│   ├── package.json
│   └── .env.example
├── backend/           # Backend API service
│   ├── src/          # API source code
│   ├── package.json
│   └── .env.example
├── web/              # Web dashboard application
│   ├── src/         # Dashboard source code
│   ├── public/      # Static assets
│   ├── package.json
│   └── .env.example
├── package.json      # Root package.json with workspace scripts
├── .gitignore
├── .editorconfig
├── .env.example
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

This monorepo uses npm workspaces. Install all dependencies across all packages with a single command:

```bash
npm install
```

This will install dependencies for the root and all workspace packages (extension, backend, web).

### 3. Set Up Environment Variables

Each package requires its own environment variables. Copy the example files and fill in your values:

```bash
# Root environment variables
cp .env.example .env

# Extension environment variables
cp extension/.env.example extension/.env

# Backend environment variables
cp backend/.env.example backend/.env

# Web dashboard environment variables
cp web/.env.example web/.env.local
```

See the [Environment Variables](#environment-variables) section for detailed information about each variable.

## 🌍 Environment Variables

### Root (`.env`)

- `NODE_ENV` - Environment (development, production)
- `API_BASE_URL` - Base URL for the API

### Extension (`extension/.env`)

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_EXTENSION_ID` - Browser extension ID

### Backend (`backend/.env`)

**Server Configuration:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode

**Database:**
- `MONGODB_URI` - MongoDB connection string

**API Keys:**
- `GEMINI_API_KEY` - Google Gemini API key for AI features

**Stripe (Payment Processing):**
- `STRIPE_SECRET_KEY` - Stripe secret key (get from Stripe Dashboard)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (get from webhook configuration)
- `STRIPE_PRICE_ID` - Stripe price ID for Pro subscription (e.g., price_1234)

**Authentication:**
- `NEXTAUTH_URL` - NextAuth URL (web dashboard URL)
- `NEXTAUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `JWT_SECRET` - JWT secret for token signing
- `JWT_EXPIRES_IN` - JWT expiration time

**Security:**
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

**Rate Limiting:**
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

### Web Dashboard (`web/.env.local`)

- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXTAUTH_URL` - NextAuth URL (should match deployment URL)
- `NEXTAUTH_SECRET` - NextAuth secret (same as backend)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (if using)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (if using)
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID (if using)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret (if using)

## 💳 Stripe Setup

The application uses Stripe for subscription billing. Follow these steps to set up Stripe for development:

### 1. Create Stripe Account
1. Sign up at https://stripe.com
2. Get your test API keys from Developers > API keys
3. Add keys to `backend/.env` and `web/.env.local`

### 2. Create Subscription Product
1. Go to Stripe Dashboard > Products
2. Create a new product (e.g., "Pro Plan")
3. Add a recurring price (e.g., $9.99/month)
4. Copy the Price ID (starts with `price_`) to `STRIPE_PRICE_ID` in `backend/.env`

### 3. Setup Webhook (Local Development)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# Or download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local backend
stripe listen --forward-to http://localhost:3000/api/upgrade
```

Copy the webhook signing secret (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET` in `backend/.env`.

### 4. Test the Integration
- Use test card: `4242 4242 4242 4242`
- Any future expiry date, CVC, and postal code
- See full test cards list: https://stripe.com/docs/testing

For detailed setup instructions, see [backend/README.md](./backend/README.md).

## 💻 Development

### Run All Services

Each service can be run independently in development mode:

```bash
# Run extension in development mode
npm run dev:extension

# Run backend API in development mode
npm run dev:backend

# Run web dashboard in development mode
npm run dev:web
```

**Note:** Currently, the dev scripts are placeholders. They will be implemented in future phases.

### Typical Development Workflow

1. Start the backend API (usually runs on `http://localhost:3000`)
2. Start the web dashboard (usually runs on `http://localhost:3001`)
3. Load the extension in your browser in development mode
4. (Optional) Start Stripe webhook forwarding with `stripe listen --forward-to http://localhost:3000/api/upgrade`

## 🏗️ Building

### Build Individual Packages

```bash
# Build extension
npm run build:extension

# Build backend
npm run build:backend

# Build web dashboard
npm run build:web
```

### Build All Packages

```bash
npm run build:all
```

## 🧪 Testing

Each package includes comprehensive test suites to ensure code quality and functionality.

For a complete testing strategy covering automated and manual testing, see the **[Phase 1 Testing Plan](./docs/phase1-testing-plan.md)**.

### Run Tests for All Packages

```bash
npm run test
```

### Run Tests for Individual Packages

```bash
# Backend unit tests (with MongoDB memory server)
npm run test --workspace=backend

# Extension unit tests
npm run test --workspace=extension

# Web unit tests
npm run test --workspace=web

# Web E2E tests with Playwright
npm run test:e2e --workspace=web
```

### Test Coverage

- **Backend**: Jest unit tests with MongoDB Memory Server for database operations
- **Extension**: Jest unit tests with jsdom for React components and utilities
- **Web**: Jest unit tests for components and services, Playwright for E2E testing

### Running Tests in Watch Mode

```bash
# Backend
npm run test:watch --workspace=backend

# Web
npm run test:watch --workspace=web
```

### API Testing with Postman

Test API endpoints using the provided Postman collection:

```bash
# Install Newman (Postman CLI)
npm install -g newman

# Run API tests
newman run tests/postman/promptlens-phase1.postman_collection.json \
  -e tests/postman/promptlens-phase1.postman_environment.json
```

See **[tests/postman/README.md](./tests/postman/README.md)** for detailed instructions.

### Manual Testing

For comprehensive manual testing checklists:
- **Extension**: [extension/TESTING.md](./extension/TESTING.md)
- **Dashboard**: [web/MANUAL_QA.md](./web/MANUAL_QA.md)

## 🔄 CI/CD Pipeline

This repository uses GitHub Actions to automate testing and quality checks on every pull request.

### CI Workflow Overview

The Phase 1 CI pipeline (`.github/workflows/phase1-ci.yml`) runs automatically on:
- Pull requests to the `main` branch
- Manual workflow dispatch via GitHub Actions UI

### Pipeline Jobs

The CI pipeline consists of separate jobs for each package to isolate failures:

1. **Backend Job**
   - Linting with ESLint
   - Type checking with TypeScript
   - Unit tests with Jest and MongoDB Memory Server
   - Environment: `MONGODB_MEMORY_SERVER_VERSION=7.0.0`

2. **Extension Job**
   - Linting with ESLint
   - Type checking with TypeScript
   - Unit tests with Jest

3. **Web Job**
   - Linting with Next.js ESLint config
   - Type checking with TypeScript
   - Unit tests with Jest

4. **Playwright E2E Job**
   - End-to-end tests for the web dashboard
   - Automated browser testing with Chromium
   - Uploads test reports as artifacts

5. **Postman/Newman Job** (optional)
   - Validates API request definitions from Postman collection
   - Runs only non-Stripe requests to avoid live API calls
   - Uploads Newman HTML reports as artifacts

6. **CI Summary Job**
   - Aggregates all job results
   - Provides actionable feedback for failures
   - Blocks merging if any required checks fail

### Viewing CI Results

- **Status Checks**: View PR checks in the "Checks" tab of your pull request
- **Artifacts**: Download test reports from the Actions tab (Playwright reports, Newman reports)
- **Summaries**: Check the job summary for quick debugging tips on failures

### Required Status Checks

Before merging a pull request, the following checks must pass:
- ✅ Backend lint, typecheck, and tests
- ✅ Extension lint, typecheck, and tests
- ✅ Web lint, typecheck, and tests
- ✅ Playwright E2E tests

### Local CI Validation

Before pushing, run these commands to catch issues early:

```bash
# Run all linting
npm run lint

# Run all type checks
npm run typecheck

# Run all tests
npm run test

# Run E2E tests
npm run test:e2e --workspace=web
```

## 📦 Workspaces

This monorepo uses npm workspaces to manage multiple packages. The workspace configuration is defined in the root `package.json`.

### Adding Dependencies

To add a dependency to a specific workspace:

```bash
# Add dependency to extension
npm install <package-name> --workspace=extension

# Add dev dependency to backend
npm install <package-name> -D --workspace=backend

# Add dependency to web
npm install <package-name> --workspace=web
```

### Workspace Linking

Workspaces can depend on each other. To link a workspace as a dependency:

```json
{
  "dependencies": {
    "extension": "*"
  }
}
```

## 📜 Scripts

### Root Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install all dependencies |
| `npm run clean` | Remove all node_modules and build artifacts |
| `npm run dev:extension` | Run extension in development mode |
| `npm run dev:backend` | Run backend in development mode |
| `npm run dev:web` | Run web dashboard in development mode |
| `npm run build:extension` | Build extension for production |
| `npm run build:backend` | Build backend for production |
| `npm run build:web` | Build web dashboard for production |
| `npm run build:all` | Build all packages |
| `npm run lint` | Run linting across all packages |
| `npm run format` | Run formatting across all packages |
| `npm run test` | Run tests across all packages |
| `npm run typecheck` | Run type checking across all packages |

## 🛠️ Technology Stack (Planned)

### Extension
- TypeScript
- Vite (build tool)
- Browser APIs

### Backend
- Node.js
- Express.js
- MongoDB
- TypeScript

### Web Dashboard
- Next.js
- React
- TypeScript
- NextAuth.js (authentication)
- Stripe (payments)

## 📝 Additional Notes

- This monorepo uses npm workspaces for efficient dependency management and workspace linking
- All packages are private and not intended for publication to npm
- The `.editorconfig` file ensures consistent coding styles across different editors
- Git hooks can be added using husky for pre-commit linting and formatting

## 📚 Documentation

Comprehensive documentation is available to guide development, testing, and deployment:

### Core Documentation

- **[README.md](./README.md)** - Main repository documentation (this file)
- **[STRUCTURE.md](./STRUCTURE.md)** - Detailed project structure and architecture
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines and workflow
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide for new developers

### Package Documentation

- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[extension/README.md](./extension/README.md)** - Browser extension documentation
- **[web/README.md](./web/README.md)** - Web dashboard documentation

### Operational Documentation

When available, refer to these Phase 1 operational guides:

- **[docs/phase1-testing-plan.md](./docs/phase1-testing-plan.md)** - Comprehensive testing strategy and test coverage
- **docs/phase1-deployment-guide.md** - Step-by-step deployment instructions for production
- **[docs/phase1-validation-runbook.md](./docs/phase1-validation-runbook.md)** - Validation procedures and troubleshooting

### Testing Resources

- **[tests/README.md](./tests/README.md)** - Test resources overview and automated suite documentation
- **[tests/postman/README.md](./tests/postman/README.md)** - Postman collection guide and API testing instructions
- **[extension/TESTING.md](./extension/TESTING.md)** - Extension manual testing checklist
- **[web/MANUAL_QA.md](./web/MANUAL_QA.md)** - Dashboard manual QA test plan

### API Documentation

- **[backend/API.md](./backend/API.md)** - REST API endpoints and request/response formats
- **tests/postman/promptlens-phase1.postman_collection.json** - Importable Postman collection for API validation

## 🤝 Contributing

Contributors should follow these steps to ensure their changes meet quality standards:

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow existing code conventions and patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Validate Locally**
   ```bash
   # Run all quality checks
   npm run lint
   npm run typecheck
   npm run test
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Provide a clear description of changes
   - Link to related issues
   - Ensure all CI checks pass before requesting review
   - Address review feedback promptly

### CI Pipeline Expectations

All pull requests must pass the automated CI pipeline before merging:
- ✅ Linting checks for all packages
- ✅ TypeScript type checking for all packages
- ✅ Unit tests for backend, extension, and web
- ✅ E2E tests with Playwright
- ✅ API validation with Postman/Newman (when applicable)

If CI checks fail, review the job logs and summary for debugging guidance. The pipeline provides specific feedback for common issues in each package.

## 📄 License

MIT
