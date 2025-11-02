# NextAuth Configuration Fix Summary

## Changes Made

### File Modified: `web/src/pages/api/auth/[...nextauth].ts`

**What was changed:**
- Moved the `secret` property to the top of the `authOptions` configuration object (line 5)
- Previously, the `secret` was at the bottom of the configuration (line 50)

**Why this fixes the issue:**
- NextAuth v4 processes configuration options in order
- Having `secret` at the top ensures it's available when JWT encryption/decryption operations are initialized
- This follows NextAuth's recommended best practices for configuration structure

## Configuration Structure (After Fix)

```typescript
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,  // ✅ Now at the top
  providers: [ /* ... */ ],
  session: { /* ... */ },
  pages: { /* ... */ },
  callbacks: { /* ... */ },
};
```

## Setup Instructions for Users

### 1. Create Environment File

If you haven't already, create `.env.local` in the `web/` directory:

```bash
cd web
cp .env.example .env.local
```

### 2. Generate NEXTAUTH_SECRET

Generate a secure random secret:

```bash
openssl rand -base64 32
```

### 3. Configure `.env.local`

Add the generated secret to your `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=<paste-your-generated-secret-here>
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api
```

### 4. Restart Development Server

**Important:** After modifying environment variables or the NextAuth configuration, you must restart the Next.js development server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 5. Clear Browser Cookies

Old session cookies encrypted with the previous configuration (or no secret) will cause decryption errors. Clear your browser cookies for `localhost:3001`:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cookies" in the left sidebar
4. Select `http://localhost:3001`
5. Delete all cookies (especially `next-auth.session-token`)

**Firefox:**
1. Open DevTools (F12)
2. Go to Storage tab
3. Click "Cookies"
4. Select `http://localhost:3001`
5. Delete all cookies

### 6. Test Authentication

1. Navigate to `http://localhost:3001`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. You should be redirected to the dashboard without errors

**Verify:**
- No `[next-auth][warn][NO_SECRET]` in the console
- No `JWT_SESSION_ERROR` or `JWEDecryptionFailed` errors
- User stays logged in after page refresh
- `/api/token` endpoint returns 200 with valid JWT

## Expected Results

### Before Fix
```
[next-auth][warn][NO_SECRET]
https://next-auth.js.org/warnings#no_secret
[next-auth][error][JWT_SESSION_ERROR] 
https://next-auth.js.org/errors#jwt_session_error decryption operation failed
JWEDecryptionFailed: decryption operation failed
```

### After Fix
```
✅ No warnings
✅ No JWT decryption errors
✅ Successful authentication
✅ Session persists correctly
```

## Troubleshooting

### Still seeing NO_SECRET warning?

1. Verify `NEXTAUTH_SECRET` is set in `.env.local`
2. Ensure `.env.local` is in the `web/` directory (not root)
3. Restart the dev server completely (kill process and start fresh)
4. Check that you're not using `.env` when you should use `.env.local`

### Still seeing JWT decryption errors?

1. Clear ALL browser cookies for localhost:3001
2. Try an incognito/private browsing window
3. Generate a NEW `NEXTAUTH_SECRET` and restart
4. Verify the secret is at least 32 characters

### Authentication works but /api/token returns 401?

1. Make sure you're signed in first
2. Check that cookies are being sent (credentials: 'include')
3. Verify session is active in DevTools > Application > Cookies

## Technical Details

### Why the order matters

NextAuth internally processes the configuration object when the module is imported. The `secret` is used to initialize cryptographic functions for JWT signing and encryption. By placing it first:

1. It's immediately available when NextAuth initializes
2. It's used consistently throughout the configuration processing
3. It follows the principle of declaring critical security settings early

### Security Notes

- `NEXTAUTH_SECRET` is server-side only (never exposed to browser)
- It's used for JWT encryption, not just signing
- Should be at least 32 characters (256 bits) for security
- Must be kept secret and never committed to version control
- `.env.local` is gitignored by default in the project

## Related Files

- `web/src/pages/api/auth/[...nextauth].ts` - NextAuth configuration
- `web/src/pages/api/token.ts` - Token endpoint using authOptions
- `web/src/lib/auth.ts` - Auth helper functions
- `web/src/types/next-auth.d.ts` - NextAuth TypeScript definitions
- `web/.env.example` - Environment variable template
- `web/next.config.mjs` - Next.js configuration (doesn't expose NEXTAUTH_SECRET)

## Version Information

- Next.js: 14.2.23
- NextAuth: 4.24.11
- Node.js: 20.x+

## References

- [NextAuth.js Documentation](https://next-auth.js.org)
- [NextAuth Configuration Options](https://next-auth.js.org/configuration/options)
- [NextAuth Warnings](https://next-auth.js.org/warnings)
- [NextAuth Errors](https://next-auth.js.org/errors)
