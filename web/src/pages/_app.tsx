import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import '@/styles/globals.css';
import { TokenStorage } from '@/lib/token';

function AuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      TokenStorage.fetchAndStoreToken();
    } else if (status === 'unauthenticated') {
      TokenStorage.clearToken();
    }
  }, [session, status]);

  return null;
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <AuthSync />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}
