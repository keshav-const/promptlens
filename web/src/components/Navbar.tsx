import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { fetchUsageData } from '@/services/api';
import { UsageData } from '@/types/api';

interface NavbarProps {
  onUpgradeClick?: () => void;
}

export default function Navbar({ onUpgradeClick }: NavbarProps) {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    if (session) {
      fetchUsageData()
        .then(setUsage)
        .catch(() => {
          // Silently fail - usage display is optional
        });
    }
  }, [session]);

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary-600">
              PromptOptimizer
            </Link>
            {session && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Pricing
                </Link>
                <Link
                  href="/settings"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Settings
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                {usage && (
                  <div className="hidden items-center gap-2 text-sm md:flex">
                    <span className="text-gray-600">
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
                  <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/api/auth/signin"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
