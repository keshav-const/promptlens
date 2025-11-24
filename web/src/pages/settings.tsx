import { GetServerSideProps } from 'next';
import { useSession, signOut } from 'next-auth/react';
import { requireAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { fetchUsageData, createBillingPortalSession, handleApiError } from '@/services/api';
import { UsageData } from '@/types/api';
import Link from 'next/link';

export default function Settings() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const usageData = await fetchUsageData();
        setUsage(usageData);
        setError(null);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadUsage();
  }, []);

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    setError(null);

    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(handleApiError(err));
      setIsManagingBilling(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                value={session?.user?.name || ''}
                disabled
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
            {session?.user?.id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
                <input
                  type="text"
                  value={session.user.id}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Subscription & Plan</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading plan information...</p>
          ) : usage ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Current Plan: <span className="uppercase">{usage.plan}</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {usage.plan === 'free'
                      ? `${usage.dailyLimit} prompts per day`
                      : 'Unlimited prompts'}
                  </p>
                </div>
                {usage.plan === 'free' ? (
                  <Link
                    href="/pricing"
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Upgrade to Pro
                  </Link>
                ) : (
                  <button
                    onClick={handleManageBilling}
                    disabled={isManagingBilling}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {isManagingBilling ? 'Loading...' : 'Manage Subscription'}
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Usage Statistics</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Daily Usage</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {usage.dailyCount} / {usage.dailyLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Usage</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {usage.monthlyCount} / {usage.monthlyLimit}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Usage resets on {new Date(usage.resetAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">Failed to load plan information</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">API Token Access</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your authentication tokens are available at{' '}
            <code className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs">/ api/token</code> for extension
            integration.
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tokens are automatically synced to browser storage when you sign in.
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-red-900">Account Actions</h2>
          <p className="mt-2 text-sm text-red-800">
            Sign out of your account. You can sign back in anytime.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context);
};
