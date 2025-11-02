import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export async function requireAuth(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/?error=auth_required',
        permanent: false,
      },
    };
  }

  const cleanSession = JSON.parse(
    JSON.stringify(session, (key, value) => (value === undefined ? null : value))
  );

  return {
    props: {
      session: cleanSession,
    },
  };
}
