# Quick Start Guide

Get up and running with this monorepo in just a few steps!

## Prerequisites

- Node.js >= 20.0.0 ([Download](https://nodejs.org/))
- pnpm >= 8.0.0 (Install: `npm install -g pnpm`)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Install dependencies
pnpm install
```

## Environment Setup

```bash
# Copy environment variable templates
cp .env.example .env
cp extension/.env.example extension/.env
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local

# Edit each .env file with your actual values
```

### Required Environment Variables

**Backend** (`backend/.env`):
- `MONGODB_URI` - MongoDB connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`

**Web** (`web/.env.local`):
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (default: http://localhost:3000)
- `NEXTAUTH_URL` - Web app URL (default: http://localhost:3001)
- `NEXTAUTH_SECRET` - Same as backend
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

**Extension** (`extension/.env`):
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3000)

## Running the Project

### Development Mode

Run each service in a separate terminal:

```bash
# Terminal 1 - Backend API (runs on port 3000)
pnpm dev:backend

# Terminal 2 - Web Dashboard (runs on port 3001)
pnpm dev:web

# Terminal 3 - Browser Extension
pnpm dev:extension
```

### Building for Production

```bash
# Build all packages
pnpm build:all

# Or build individually
pnpm build:backend
pnpm build:web
pnpm build:extension
```

## Common Tasks

### Adding a Dependency

```bash
# Add to specific package
pnpm --filter backend add express
pnpm --filter web add next
pnpm --filter extension add -D vite

# Add to all packages
pnpm -r add lodash
```

### Running Scripts

```bash
# Run across all packages
pnpm lint
pnpm test
pnpm typecheck

# Run in specific package
pnpm --filter backend test
pnpm --filter web lint
```

### Cleaning

```bash
# Remove all node_modules and build artifacts
pnpm clean

# Then reinstall
pnpm install
```

## Troubleshooting

### pnpm command not found
```bash
npm install -g pnpm
```

### Port already in use
- Backend uses port 3000
- Web uses port 3001
- Check for processes using these ports and stop them

### MongoDB connection failed
- Ensure MongoDB is running locally, or
- Use MongoDB Atlas and update `MONGODB_URI` in backend/.env

### Module not found errors
```bash
# Try cleaning and reinstalling
pnpm clean
pnpm install
```

## Next Steps

1. Read the [README.md](./README.md) for detailed documentation
2. Check [STRUCTURE.md](./STRUCTURE.md) for project organization
3. Review [CONTRIBUTING.md](./CONTRIBUTING.md) before contributing
4. Explore individual package READMEs:
   - [extension/README.md](./extension/README.md)
   - [backend/README.md](./backend/README.md)
   - [web/README.md](./web/README.md)

## Need Help?

- Open an issue on GitHub
- Check existing documentation in the repository
- Review the `.env.example` files for configuration options

Happy coding! 🚀
