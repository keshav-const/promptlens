import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    if (router.query.success === 'true') {
      setTimeout(() => {
        router.replace('/dashboard?upgraded=true', undefined, { shallow: true });
      }, 2000);
    }
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Optimize Your Prompts with AI
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Transform your prompts into powerful, effective instructions.
            <br />
            Get better results from AI models with our optimization engine.
          </p>
          <button
            onClick={() => signIn('google')}
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-8 py-4 text-lg font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <svg className="mr-2 h-6 w-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Get Started Free
          </button>

          {router.query.success === 'true' && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Payment successful! Redirecting to dashboard...
              </p>
            </div>
          )}

          {router.query.canceled === 'true' && (
            <div className="mt-4 rounded-md bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Payment canceled. You can try upgrading again anytime.
              </p>
            </div>
          )}

          {router.query.error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {router.query.error === 'auth_required'
                  ? 'Please sign in to access that page'
                  : 'An error occurred during sign in'}
              </p>
            </div>
          )}
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-6 w-6 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Instant Optimization</h3>
            <p className="text-sm text-gray-600">
              Get optimized prompts in seconds using advanced AI technology.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-6 w-6 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Save & Organize</h3>
            <p className="text-sm text-gray-600">
              Keep all your optimized prompts organized with tags and favorites.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-6 w-6 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Track Usage</h3>
            <p className="text-sm text-gray-600">
              Monitor your daily and monthly usage with detailed analytics.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl text-center">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border-2 border-gray-200 bg-white p-8">
              <h3 className="mb-2 text-2xl font-bold text-gray-900">Free</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-left">
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">10 prompts per day</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Basic optimization</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Save prompt history</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border-2 border-primary-600 bg-white p-8 shadow-lg">
              <div className="mb-2 inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-600">
                POPULAR
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-left">
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Unlimited prompts</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Advanced optimization</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Export & API access</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-sm text-gray-600">
            View detailed pricing comparison on our{' '}
            <Link href="/pricing" className="font-medium text-primary-600 hover:text-primary-700">
              pricing page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
