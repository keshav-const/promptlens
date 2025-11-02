import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      console.error('❌ No session found');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid session found',
      });
    }

    // Create a backend-compatible JWT using JWT_SECRET
    const backendToken = jwt.sign(
      {
        sub: session.user.email,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.image,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
        issuer: 'promptlens-dashboard',
      }
    );

    console.log('✅ Created backend JWT for:', session.user.email);

    return res.status(200).json({
      accessToken: backendToken,
      user: session.user,
    });
  } catch (error) {
    console.error('❌ Token creation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create token',
    });
  }
}
