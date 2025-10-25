# Contributing Guidelines

Thank you for considering contributing to this project! This document provides guidelines for contributing to the monorepo.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Installing Dependencies

```bash
# Install all dependencies across all workspaces
pnpm install
```

### Running Development Servers

```bash
# Run individual services
pnpm dev:extension
pnpm dev:backend
pnpm dev:web
```

### Building

```bash
# Build individual packages
pnpm build:extension
pnpm build:backend
pnpm build:web

# Or build all at once
pnpm build:all
```

### Code Quality

Before submitting a pull request, ensure:

1. Your code passes linting: `pnpm lint`
2. Your code is properly formatted: `pnpm format`
3. All tests pass: `pnpm test`
4. Type checking passes: `pnpm typecheck`

## Project Structure

This is a monorepo managed with pnpm workspaces:

- `extension/` - Browser extension package
- `backend/` - Backend API service
- `web/` - Web dashboard application

Each package is independent but can share dependencies and code through workspace linking.

## Commit Messages

Please follow these guidelines for commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

Example:
```
Add user authentication to backend

- Implement JWT token generation
- Add middleware for protected routes
- Update user model with password hashing

Fixes #123
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the relevant package documentation
3. Ensure all tests pass and code quality checks succeed
4. Request review from maintainers
5. Once approved, your PR will be merged

## Code Style

- Follow the existing code style in each package
- Use TypeScript for all new code
- Add comments for complex logic
- Keep functions small and focused
- Write meaningful variable and function names

## Adding Dependencies

To add a dependency to a specific workspace:

```bash
# Add to extension
pnpm --filter extension add <package-name>

# Add to backend
pnpm --filter backend add <package-name>

# Add to web
pnpm --filter web add <package-name>
```

For development dependencies, use the `-D` flag:

```bash
pnpm --filter backend add -D <package-name>
```

## Questions?

If you have questions, please open an issue for discussion.

Thank you for contributing! 🎉
