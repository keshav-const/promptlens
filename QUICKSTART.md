# Quick Start Guide

Get up and running with this monorepo in just a few steps!

## Prerequisites

- Node.js >= 20.0.0 ([Download](https://nodejs.org/))
- npm >= 9.0.0 (comes with Node.js)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Install dependencies
npm install
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
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`

**Web** (`web/.env.local`):
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (default: http://localhost:5000)
- `NEXTAUTH_URL` - Web app URL (default: http://localhost:3000)
- `NEXTAUTH_SECRET` - Same as backend
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Razorpay key ID (for frontend)

**Extension** (`extension/.env`):
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:5000)

## Running the Project

### Development Mode

Run each service in a separate terminal:

```bash
# Terminal 1 - Backend API (runs on port 5000)
npm run dev:backend

# Terminal 2 - Web Dashboard (runs on port 3000)
npm run dev:web

# Terminal 3 - Browser Extension
npm run dev:extension
```

### Building for Production

```bash
# Build all packages
npm run build:all

# Or build individually
npm run build:backend
npm run build:web
npm run build:extension
```

## Common Tasks

### Adding a Dependency

```bash
# Add to specific package
npm install express --workspace=backend
npm install next --workspace=web
npm install vite -D --workspace=extension

# Add to root
npm install lodash
```

### Running Scripts

```bash
# Run across all packages
npm run lint
npm run test
npm run typecheck

# Run in specific package
npm run test --workspace=backend
npm run lint --workspace=web
```

### Cleaning

```bash
# Remove all node_modules and build artifacts
npm run clean

# Then reinstall
npm install
```

## Troubleshooting

### npm version too old
```bash
# Update npm
npm install -g npm@latest
```

### Port already in use
- Backend uses port 5000
- Web uses port 3000
- Check for processes using these ports and stop them

### MongoDB connection failed
- Ensure MongoDB is running locally, or
- Use MongoDB Atlas and update `MONGODB_URI` in backend/.env

### Module not found errors
```bash
# Try cleaning and reinstalling
npm run clean
npm install
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
