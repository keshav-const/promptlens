import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { fetchUsageData } from '@/services/api';
import { UsageData } from '@/types/api';
import ThemeSelector from './ThemeSelector';

interface NavbarProps {
  onUpgradeClick?: () => void;
}

export default function Navbar({ onUpgradeClick }: NavbarProps) {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    if (!session) {
      setUsage(null);
      return;
    }

    // Debounce usage data fetching to prevent rapid repeated calls
    // Increased to 1 second to handle rapid session changes
    const timeoutId = setTimeout(() => {
      fetchUsageData()
        .then(setUsage)
        .catch((err) => {
          console.warn('Failed to fetch usage data:', err);
          // Silently fail - usage display is optional
        });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [session]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white dark:bg-gray-800 dark:border-gray-700 uiux:bg-gray-900/80 uiux:backdrop-blur-xl uiux:border-white/10 shadow-sm transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 uiux:glass-card uiux:border-0">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              PromptOptimizer
            </Link>
            {session && (
              <div className="ml-10 flex items-baseline gap-1">
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 uiux:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 uiux:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white uiux:hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/templates"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Templates
                </Link>
                <Link
                  href="/ab-testing"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  A/B Testing
                </Link>
                <Link
                  href="/analytics"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Analytics
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/settings"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Settings
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <ThemeSelector />
            {session ? (
              <>
                {usage && (
                  <div className="hidden items-center gap-2 text-sm md:flex">
                    <span className="text-gray-600 dark:text-gray-400">
                      {usage.dailyCount}/{usage.dailyLimit}
                    </span>
                    {usage.plan === 'free' && onUpgradeClick && (
                      <button
                        onClick={onUpgradeClick}
                        className="rounded-md bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-1 text-sm font-medium text-white hover:from-primary-700 hover:to-primary-800"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:inline">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 whitespace-nowrap"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
