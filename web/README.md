# Web Dashboard

Next.js-based web dashboard with Google authentication via NextAuth.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 3
- **Authentication**: NextAuth.js 4 with Google OAuth
- **Testing**: Playwright
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Google OAuth credentials

### Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Configure the required environment variables in `.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API (for future integration)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

#### Generating NEXTAUTH_SECRET

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

#### Obtaining Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local`

### Installation

From the root of the monorepo:

```bash
npm install
```

Or from the web directory:

```bash
cd web
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

### Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run Playwright e2e tests
- `npm run test:ui` - Run Playwright tests with UI
- `npm run clean` - Clean build artifacts and dependencies

## Project Structure

```
web/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Layout.tsx   # Main layout wrapper
│   │   └── Navbar.tsx   # Navigation bar
│   ├── lib/             # Utility functions
│   │   ├── auth.ts      # Auth helpers (requireAuth)
│   │   └── token.ts     # Token storage for extension
│   ├── pages/           # Next.js pages
│   │   ├── api/         # API routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth].ts  # NextAuth configuration
│   │   │   └── token.ts               # Token retrieval endpoint
│   │   ├── _app.tsx     # Custom App component
│   │   ├── _document.tsx # Custom Document component
│   │   ├── index.tsx    # Landing/login page
│   │   ├── dashboard.tsx # Protected dashboard page
│   │   └── settings.tsx  # Protected settings page
│   └── styles/
│       └── globals.css  # Global styles with Tailwind
├── tests/
│   └── e2e/             # Playwright e2e tests
├── .eslintrc.json       # ESLint configuration
├── .prettierrc          # Prettier configuration
├── next.config.mjs      # Next.js configuration
├── playwright.config.ts # Playwright configuration
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## Authentication Flow

### User Login

1. User clicks "Sign in with Google" on landing page (`/`)
2. NextAuth redirects to Google OAuth consent screen
3. After consent, Google redirects back to `/api/auth/callback/google`
4. NextAuth creates a JWT session with user profile and tokens
5. User is redirected to `/dashboard`

### Session Management

- **Strategy**: JWT-based sessions (no database required)
- **Session Duration**: 30 days
- **Cookie**: HTTP-only cookie stored by NextAuth
- **Token Access**: Available via `/api/token` endpoint

### Protected Routes

Routes are protected using `getServerSideProps` with the `requireAuth` helper:

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context);
};
```

Unauthenticated users are redirected to the landing page.

## Extension Token Integration

The dashboard provides JWT tokens for the browser extension via multiple mechanisms:

### 1. Token Retrieval API

**Endpoint**: `GET /api/token`

**Response** (when authenticated):

```json
{
  "accessToken": "google-oauth-access-token",
  "refreshToken": "google-oauth-refresh-token",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "image": "profile-image-url"
  },
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
```

**Response** (when not authenticated):

```json
{
  "error": "Not authenticated"
}
```

### 2. Automatic Token Storage

When a user signs in, the application automatically:

1. Fetches the token from `/api/token`
2. Stores it in both `localStorage` and `sessionStorage`
3. Key: `auth_token_data`

### 3. Extension Access Pattern

Browser extensions can access the stored token:

```javascript
// From extension content script or popup
const tokenData = localStorage.getItem('auth_token_data');
if (tokenData) {
  const { accessToken, user } = JSON.parse(tokenData);
  // Use accessToken for API requests
}
```

Alternatively, extensions can fetch directly from the API:

```javascript
// From extension with cookies access
fetch('http://localhost:3001/api/token', {
  credentials: 'include',
})
  .then((res) => res.json())
  .then((data) => {
    // Use data.accessToken
  });
```

### 4. Token Lifecycle

- **Fetch**: Automatically on sign-in
- **Refresh**: Automatic via NextAuth (transparent to user)
- **Clear**: Automatically on sign-out
- **Expiry**: Follows Google OAuth token expiry

## Dark Theme Support

The application includes CSS variables for dark theme (Phase 2):

```css
:root {
  /* Light theme colors */
}

.dark {
  /* Dark theme colors */
}
```

To enable dark mode, add the `dark` class to the `<html>` element.

## Testing

### E2E Tests with Playwright

Run all tests:

```bash
npm run test
```

Run tests with UI:

```bash
npm run test:ui
```

Tests are located in `tests/e2e/` and configured in `playwright.config.ts`.

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test('should display landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome to Dashboard');
});
```

## Linting and Formatting

### ESLint

Configured with:

- `next/core-web-vitals`
- TypeScript ESLint rules
- Prettier integration

### Prettier

Configured with:

- Single quotes
- 2-space indentation
- 100 character line width
- Trailing commas (ES5)

## TypeScript Configuration

Strict mode enabled with additional checks:

- `noUnusedLocals`
- `noUnusedParameters`
- `noFallthroughCasesInSwitch`

Path aliases configured:

- `@/*` → `./src/*`

## Environment Variables Reference

| Variable                   | Required | Description                | Example                   |
| -------------------------- | -------- | -------------------------- | ------------------------- |
| `NEXTAUTH_URL`             | Yes      | Public URL of the app      | `http://localhost:3001`   |
| `NEXTAUTH_SECRET`          | Yes      | Secret for JWT encryption  | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`         | Yes      | Google OAuth Client ID     | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET`     | Yes      | Google OAuth Client Secret | From Google Cloud Console |
| `NEXT_PUBLIC_API_BASE_URL` | No       | Backend API URL (future)   | `http://localhost:3000`   |

## Troubleshooting

### Authentication Issues

**Problem**: "Error: invalid_client" during Google sign-in

**Solution**:

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure redirect URI `http://localhost:3001/api/auth/callback/google` is added in Google Cloud Console

**Problem**: "Error: [next-auth][error][JWT_SESSION_ERROR]"

**Solution**:

- Generate a new `NEXTAUTH_SECRET` using `openssl rand -base64 32`
- Clear browser cookies and try again

### Token Access Issues

**Problem**: Extension cannot access tokens

**Solution**:

- Ensure user is signed in to the dashboard
- Check browser console for CORS errors
- Verify extension has permission to access `localhost:3001`
- Check localStorage/sessionStorage for `auth_token_data` key

### Build Issues

**Problem**: TypeScript errors during build

**Solution**:

```bash
npm run typecheck  # Check for type errors
npm run lint       # Check for linting errors
```

## Production Deployment

### Build

```bash
npm run build
```

### Environment Variables

Set production environment variables:

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
```

Update Google OAuth redirect URIs:

- `https://your-domain.com/api/auth/callback/google`

### Start Production Server

```bash
npm start
```

## Future Enhancements (Phase 2+)

- [ ] Dark theme implementation
- [ ] User profile management
- [ ] Backend API integration
- [ ] Subscription management with Stripe
- [ ] Advanced settings and preferences
- [ ] Email notifications
- [ ] Activity logs
- [ ] Team collaboration features

## License

MIT
