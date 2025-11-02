import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    console.error('❌ No session found');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Get the NextAuth JWT token (the one that NextAuth itself manages)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  console.log('🎫 Token from NextAuth:', token ? 'exists' : 'null');
  console.log('🎫 Token sub:', token?.sub);
  console.log('🎫 Token email:', token?.email);

  // Try to get the session token from cookies
  // NextAuth stores the session token in a cookie
  const sessionToken =
    req.cookies['next-auth.session-token'] || // Development
    req.cookies['__Secure-next-auth.session-token']; // Production (HTTPS)

  console.log(
    '🍪 Session token from cookie:',
    sessionToken ? sessionToken.substring(0, 50) + '...' : 'null'
  );
  console.log('🍪 Session token length:', sessionToken?.length || 0);

  if (!sessionToken) {
    console.error('❌ No session token in cookies');
    console.error('❌ Available cookies:', Object.keys(req.cookies));
    return res.status(500).json({ error: 'Session token not found in cookies' });
  }

  // The session token IS the NextAuth JWT that the backend can verify
  return res.status(200).json({
    accessToken: sessionToken,
    user: session.user,
    expiresAt: session.expires,
  });
}
