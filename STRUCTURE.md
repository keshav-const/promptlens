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
├── package.json              # Root package.json with workspace scripts
├── package-lock.json         # npm lockfile
│
├── extension/                # Browser Extension Package
│   ├── .env.example         # Extension environment variables
│   ├── README.md            # Extension documentation
│   ├── package.json         # Extension package configuration
│   ├── public/              # Static assets and manifest files
│   └── src/                 # Extension source code
│       └── index.ts         # Entry point (placeholder)
│
├── backend/                  # Backend API Package
│   ├── .env.example         # Backend environment variables
│   ├── README.md            # Backend documentation
│   ├── package.json         # Backend package configuration
│   └── src/                 # Backend source code
│       └── index.ts         # Entry point (placeholder)
│
└── web/                      # Web Dashboard Package
    ├── .env.example         # Web environment variables
    ├── README.md            # Web documentation
    ├── package.json         # Web package configuration
    ├── public/              # Static assets
    └── src/                 # Web source code
        └── index.ts         # Entry point (placeholder)
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

## Next Steps

Each package is currently a placeholder with:
- Basic `package.json` with scripts
- Stub source files
- Environment variable templates
- Individual README documentation

Future implementation phases will add:
- TypeScript configuration
- Build tooling (Vite, tsc, Next.js)
- Testing frameworks
- Linting and formatting tools
- Additional source code structure
