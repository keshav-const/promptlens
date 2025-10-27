import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { createCheckoutSession, handleApiError } from '@/services/api';

export default function Pricing() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(handleApiError(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Pricing Plans</h1>
        <p className="mt-4 text-lg text-gray-600">
          Choose the plan that's right for you. Upgrade or downgrade anytime.
        </p>
      </div>

      {error && (
        <div className="mx-auto mt-8 max-w-2xl rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border-2 border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Free</h2>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">$0</span>
              <span className="ml-2 text-xl text-gray-600">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">Perfect for getting started</p>
          </div>

          <ul className="mb-8 space-y-4">
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="font-medium text-gray-900">10 prompts per day</span>
                <p className="text-sm text-gray-600">300 prompts per month</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Basic prompt optimization</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Save prompt history</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Basic tags and organization</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Community support</span>
            </li>
          </ul>

          <button
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-6 py-3 text-base font-medium text-gray-400"
          >
            Current Plan
          </button>
        </div>

        <div className="relative rounded-lg border-2 border-primary-600 bg-white p-8 shadow-lg">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
            <span className="inline-block rounded-full bg-primary-600 px-4 py-1 text-sm font-semibold text-white">
              MOST POPULAR
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Pro</h2>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">$9.99</span>
              <span className="ml-2 text-xl text-gray-600">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">For power users and professionals</p>
          </div>

          <ul className="mb-8 space-y-4">
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="font-medium text-gray-900">Unlimited prompts</span>
                <p className="text-sm text-gray-600">No daily or monthly limits</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Advanced AI optimization</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Priority processing</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Advanced tags, folders, and search</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Export prompt history</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">API access</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900">Priority email support</span>
            </li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full rounded-md bg-primary-600 px-6 py-3 text-base font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-gray-900">Can I cancel anytime?</h3>
            <p className="text-sm text-gray-600">
              Yes! You can cancel your Pro subscription at any time. You'll continue to have access
              until the end of your billing period, and then you'll be automatically moved to the
              Free plan.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-gray-900">
              What happens to my saved prompts if I downgrade?
            </h3>
            <p className="text-sm text-gray-600">
              All your saved prompts remain accessible even if you downgrade to the Free plan. The
              only difference is the daily usage limit for new optimizations.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-gray-900">Do you offer refunds?</h3>
            <p className="text-sm text-gray-600">
              We offer a 7-day money-back guarantee. If you're not satisfied with Pro within the
              first 7 days, contact us for a full refund.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-gray-900">How do I manage my billing?</h3>
            <p className="text-sm text-gray-600">
              You can manage your subscription, update payment methods, and view billing history
              from your Settings page. We use Stripe for secure payment processing.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-600">
          Have more questions?{' '}
          <a
            href="mailto:support@example.com"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/?error=auth_required',
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
};
