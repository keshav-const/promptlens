import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import { requireAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  fetchPromptHistory,
  fetchUsageData,
  updatePromptFavorite,
  deletePrompt,
  handleApiError,
} from '@/services/api';
import { Prompt, UsageData } from '@/types/api';
import PromptCard from '@/components/PromptCard';
import UsageTracker from '@/components/UsageTracker';
import UpgradeModal from '@/components/UpgradeModal';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [promptsData, usageData] = await Promise.all([
        fetchPromptHistory({
          search: searchTerm || undefined,
          favorites: showFavoritesOnly || undefined,
        }),
        fetchUsageData(),
      ]);

      setPrompts(promptsData.prompts);
      setUsage(usageData);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, showFavoritesOnly]);

  useEffect(() => {
    if (router.query.upgraded === 'true') {
      setTimeout(() => {
        loadData();
      }, 1000);
    }
  }, [router.query.upgraded]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleFavoriteToggle = async (promptId: string, isFavorite: boolean) => {
    await updatePromptFavorite(promptId, isFavorite);
    setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, isFavorite } : p)));
  };

  const handleDelete = async (promptId: string) => {
    await deletePrompt(promptId);
    setPrompts((prev) => prev.filter((p) => p.id !== promptId));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {router.query.upgraded === 'true' && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Successfully upgraded to Pro! You now have unlimited prompts.
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {session?.user?.name}!</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Prompt History</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    showFavoritesOnly
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill={showFavoritesOnly ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {prompts.length === 0 ? (
              <div className="py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No prompts yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {showFavoritesOnly
                    ? 'No favorite prompts found. Star some prompts to see them here.'
                    : searchTerm
                      ? 'No prompts match your search.'
                      : 'Get started by optimizing your first prompt with the browser extension.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onFavoriteToggle={handleFavoriteToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {usage && (
            <UsageTracker usage={usage} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
          )}

          {usage?.plan === 'free' && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-primary-900">Upgrade to Pro</h3>
              <p className="mb-4 text-sm text-primary-800">
                Get unlimited prompts, advanced optimization, and priority support.
              </p>
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Upgrade Now
              </button>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total prompts:</span>
                <span className="font-medium text-gray-900">{prompts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Favorites:</span>
                <span className="font-medium text-gray-900">
                  {prompts.filter((p) => p.isFavorite).length}
                </span>
              </div>
              {usage && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium uppercase text-gray-900">{usage.plan}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context);
};
