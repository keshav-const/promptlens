# Project Structure

This document provides a visual overview of the monorepo structure.

## Directory Tree

```
.
├── .editorconfig              # Editor configuration for consistent coding styles
├── .env.example               # Root environment variables template
├── .gitattributes            # Git attributes for line endings
├── .gitignore                # Git ignore patterns
├── .nvmrc                    # Node.js version specification
├── CONTRIBUTING.md           # Contribution guidelines
├── LICENSE                   # MIT License
├── README.md                 # Main documentation
├── STRUCTURE.md              # This file - project structure overview
├── package.json              # Root package.json with workspace scripts
├── package-lock.json         # npm lockfile
│
├── .github/                  # GitHub configuration
│   └── workflows/           # GitHub Actions CI/CD workflows
│       └── phase1-ci.yml    # Phase 1 CI pipeline
│
├── docs/                     # Operational documentation
│   ├── phase1-testing-plan.md      # Testing strategy
│   ├── phase1-deployment-guide.md   # Phase 1 deployment strategy
│   └── phase1-validation-runbook.md # Validation runbook
│
├── deployment/               # Deployment guides
│   ├── README.md            # Deployment overview
│   ├── database.md          # MongoDB Atlas setup
│   ├── google-oauth.md      # OAuth configuration
│   ├── backend.md           # Backend API deployment
│   ├── stripe.md            # Stripe configuration
│   ├── dashboard.md         # Web dashboard deployment
│   └── extension.md         # Extension publication
│
├── tests/                    # Shared test resources
│   └── postman/             # Postman collections for API testing
│       ├── promptlens-phase1.postman_collection.json
│       └── promptlens-phase1.postman_environment.json
│
├── extension/                # Browser Extension Package
│   ├── .env.example         # Extension environment variables
│   ├── README.md            # Extension documentation
│   ├── package.json         # Extension package configuration
│   ├── jest.config.cjs      # Jest test configuration
│   ├── public/              # Static assets and manifest files
│   └── src/                 # Extension source code
│       ├── __tests__/       # Unit tests
│       └── ...              # Source files
│
├── backend/                  # Backend API Package
│   ├── .env.example         # Backend environment variables
│   ├── README.md            # Backend documentation
│   ├── package.json         # Backend package configuration
│   ├── jest.config.js       # Jest test configuration
│   └── src/                 # Backend source code
│       ├── __tests__/       # Unit tests
│       └── ...              # Source files
│
└── web/                      # Web Dashboard Package
    ├── .env.example         # Web environment variables
    ├── README.md            # Web documentation
    ├── package.json         # Web package configuration
    ├── jest.config.js       # Jest test configuration
    ├── playwright.config.ts # Playwright E2E test configuration
    ├── public/              # Static assets
    ├── tests/               # E2E tests
    │   └── e2e/            # Playwright test files
    └── src/                 # Web source code
        ├── __tests__/       # Unit tests
        └── ...              # Source files
```

## Package Overview

### Extension (`extension/`)
Browser extension package for the client-side application.

**Key Files:**
- `src/index.ts` - Main entry point
- `public/` - Static assets and manifest
- `.env.example` - Configuration template

### Backend (`backend/`)
Backend API service handling business logic and data management.

**Key Files:**
- `src/index.ts` - Server entry point
- `.env.example` - Server and database configuration template

### Web (`web/`)
Web dashboard application for user interface.

**Key Files:**
- `src/index.ts` - Application entry point
- `public/` - Static assets
- `.env.example` - NextAuth and API configuration template

## Workspace Configuration

The monorepo uses npm workspaces defined in the root `package.json`:

```json
{
  "workspaces": [
    "extension",
    "backend",
    "web"
  ]
}
```

This allows:
- Shared dependency management
- Cross-package linking
- Efficient installation and caching
- Unified script execution

## CI/CD Infrastructure

### GitHub Actions Workflow

The repository includes a comprehensive CI pipeline at `.github/workflows/phase1-ci.yml`:

**Workflow Triggers:**
- Pull requests to `main` branch
- Manual workflow dispatch

**Jobs:**
- **Backend**: Lint, typecheck, and test with MongoDB Memory Server
- **Extension**: Lint, typecheck, and test with Jest
- **Web**: Lint, typecheck, and test with Jest
- **Playwright**: E2E tests with artifact uploads
- **Postman**: API collection validation with Newman (optional)
- **CI Summary**: Aggregated results with debugging tips

**Features:**
- Isolated job execution for each package
- Artifact uploads for test reports (Playwright, Newman)
- Actionable failure summaries with debugging guidance
- Required status checks before merge

## Testing Infrastructure

### Test Configuration

Each package includes comprehensive test setup:

**Backend (`backend/`):**
- Jest with TypeScript support
- MongoDB Memory Server for database tests
- Supertest for API endpoint testing

**Extension (`extension/`):**
- Jest with jsdom environment
- React Testing Library for component tests
- Mock Chrome APIs for extension functionality

**Web (`web/`):**
- Jest for unit/integration tests
- Playwright for E2E testing
- Next.js-specific test utilities

### Running Tests

```bash
# All packages
npm run test

# Individual packages
npm run test --workspace=backend
npm run test --workspace=extension
npm run test --workspace=web

# E2E tests
npm run test:e2e --workspace=web
```

## Development Workflow

### Pre-Commit Checklist

Before committing changes, developers should run:

```bash
npm run lint        # Check code style
npm run typecheck   # Verify TypeScript types
npm run test        # Run all tests
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and add tests
3. Validate locally with lint/typecheck/test
4. Push changes and create PR
5. Wait for CI pipeline to complete
6. Address any CI failures
7. Request code review after all checks pass

## Next Steps

This monorepo includes:
- ✅ Workspace configuration and dependency management
- ✅ TypeScript configuration for all packages
- ✅ Build tooling (Vite, tsc, Next.js)
- ✅ Testing frameworks (Jest, Playwright)
- ✅ Linting and formatting tools (ESLint, Prettier)
- ✅ CI/CD pipeline with GitHub Actions

Future enhancements:
- Pre-commit hooks with Husky
- Code coverage reporting
- Performance benchmarking
- Automated dependency updates
- Deployment automation
