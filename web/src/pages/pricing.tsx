import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { createSubscription, verifySubscription, handleApiError } from '@/services/api';
import { loadRazorpayScript, openRazorpayCheckout, getRazorpayKeyId } from '@/lib/razorpay';

export default function Pricing() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [planLoading, setPlanLoading] = useState(true);

  // Fetch current user plan from backend
  useEffect(() => {
    const fetchPlan = async () => {
      if (!session) {
        setPlanLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/token');
        if (response.ok) {
          const tokenData = await response.json();
          // The backend creates a user and returns their plan in the usage data
          // We need to fetch usage to get the plan
          const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api'}/usage`, {
            headers: {
              'Authorization': `Bearer ${tokenData.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setCurrentPlan(usageData.data?.plan || 'free');
          }
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err);
        // Keep default 'free' on error
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlan();
  }, [session]);

  useEffect(() => {
    setIsScriptLoading(true);
    loadRazorpayScript()
      .catch((err) => {
        console.error('Failed to load Razorpay script:', err);
        setError('Payment system is currently unavailable. Please try again later.');
      })
      .finally(() => {
        setIsScriptLoading(false);
      });
  }, []);

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (isLoading || isScriptLoading) return;

    setIsLoading(true);
    setProcessingPlan(plan);
    setError(null);

    try {
      const checkoutData = await createSubscription(plan);

      openRazorpayCheckout({
        key: checkoutData.razorpayKeyId || getRazorpayKeyId(),
        subscription_id: checkoutData.subscriptionId,
        name: 'PromptLens Pro',
        description: `${checkoutData.planName} subscription`,
        image: '/logo.png',
        handler: async (response) => {
          try {
            await verifySubscription({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id || '', // Subscriptions don't have order IDs
              signature: response.razorpay_signature,
              subscriptionId: response.razorpay_subscription_id,
            });

            // Redirect to dashboard with success message
            router.push('/dashboard?upgraded=true');
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setIsLoading(false);
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setProcessingPlan(null);
          },
          escape: true,
          backdropclose: true,
          animate: true,
        },
        theme: {
          color: '#4F46E5',
        },
      });
    } catch (err) {
      setError(handleApiError(err));
      setIsLoading(false);
      setProcessingPlan(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Pricing Plans</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Choose the plan that's right for you. Upgrade or downgrade anytime.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${billingCycle === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${billingCycle === 'yearly'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
              Yearly
              <span className="ml-1 rounded bg-green-100 dark:bg-green-900/20 px-2 py-0.5 text-xs text-green-800 dark:text-green-400">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-8 max-w-2xl rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Free</h2>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">$0</span>
              <span className="ml-2 text-xl text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Perfect for getting started</p>
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
                <span className="font-medium text-gray-900 dark:text-gray-100">4 prompts per day</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">120 prompts per month</p>
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
              <span className="text-gray-900 dark:text-gray-100">Basic prompt optimization</span>
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
              <span className="text-gray-900 dark:text-gray-100">Save prompt history</span>
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
              <span className="text-gray-900 dark:text-gray-100">Basic tags and organization</span>
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
              <span className="text-gray-900 dark:text-gray-100">Community support</span>
            </li>
          </ul>

          <button
            disabled={currentPlan === 'free'}
            className={`w-full rounded-md px-6 py-3 text-base font-medium ${currentPlan === 'free'
              ? 'border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              }`}
          >
            {currentPlan === 'free' ? 'Current Plan' : 'Free Plan'}
          </button>
        </div>

        <div className="relative rounded-lg border-2 border-primary-600 bg-white dark:bg-gray-800 p-8 shadow-lg">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
            <span className="inline-block rounded-full bg-primary-600 px-4 py-1 text-sm font-semibold text-white">
              MOST POPULAR
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pro</h2>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                {billingCycle === 'monthly' ? '$9.99' : '$7.99'}
              </span>
              <span className="ml-2 text-xl text-gray-600 dark:text-gray-400">
                /{billingCycle === 'monthly' ? 'month' : 'month (billed yearly)'}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">For power users and professionals</p>
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
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {billingCycle === 'monthly' ? '50 prompts per day' : 'Unlimited prompts'}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {billingCycle === 'monthly'
                    ? '~1,500 prompts per month'
                    : 'No daily or monthly limits'}
                </p>
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
              <span className="text-gray-900 dark:text-gray-100">Advanced AI optimization</span>
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
              <span className="text-gray-900 dark:text-gray-100">Priority processing</span>
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
              <span className="text-gray-900 dark:text-gray-100">Advanced tags, folders, and search</span>
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
              <span className="text-gray-900 dark:text-gray-100">Export prompt history</span>
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
              <span className="text-gray-900 dark:text-gray-100">API access</span>
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
              <span className="text-gray-900 dark:text-gray-100">Priority email support</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade(billingCycle)}
            disabled={
              isLoading ||
              isScriptLoading ||
              processingPlan !== null ||
              currentPlan === 'pro_monthly' ||
              currentPlan === 'pro_yearly'
            }
            className={`w-full rounded-md px-6 py-3 text-base font-medium ${currentPlan === 'pro_monthly' || currentPlan === 'pro_yearly'
              ? 'border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
              }`}
          >
            {currentPlan === 'pro_monthly' || currentPlan === 'pro_yearly'
              ? 'Current Plan'
              : isScriptLoading
                ? 'Loading Payment...'
                : processingPlan === billingCycle
                  ? 'Processing...'
                  : `Upgrade to Pro (${billingCycle})`}
          </button>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Can I cancel anytime?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Yes! You can cancel your Pro subscription at any time. You'll continue to have access
              until the end of your billing period, and then you'll be automatically moved to the
              Free plan.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
              What happens to my saved prompts if I downgrade?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All your saved prompts remain accessible even if you downgrade to the Free plan. The
              only difference is the daily usage limit for new optimizations.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Do you offer refunds?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We offer a 7-day money-back guarantee. If you're not satisfied with Pro within the
              first 7 days, contact us for a full refund.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">How do I manage my billing?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can manage your subscription, update payment methods, and view billing history
              from your Settings page. We use Razorpay for secure payment processing.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Have more questions?{' '}
          <a
            href="mailto:support@example.com"
            className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
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

  const cleanSession = JSON.parse(
    JSON.stringify(session, (_, value) => (value === undefined ? null : value))
  );

  return {
    props: {
      session: cleanSession,
    },
  };
};
