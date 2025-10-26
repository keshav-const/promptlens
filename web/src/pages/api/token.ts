import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const accessToken = (session as any).accessToken;
  const refreshToken = (session as any).refreshToken;

  return res.status(200).json({
    accessToken,
    refreshToken,
    user: session.user,
    expiresAt: (session as any).expires,
  });
}
