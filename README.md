# Monorepo Project

A monorepo containing a browser extension, backend API, and web dashboard application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Building](#building)
- [Workspaces](#workspaces)
- [Scripts](#scripts)

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
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

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

## 🤝 Contributing

1. Create a new branch for your feature/fix
2. Make your changes
3. Run linting and tests: `npm run lint && npm run test`
4. Commit your changes
5. Push to your branch and create a pull request

## 📄 License

MIT
