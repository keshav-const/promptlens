import { UsageData } from '@/types/api';

interface UsageTrackerProps {
  usage: UsageData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function UsageTracker({ usage, onRefresh, isRefreshing }: UsageTrackerProps) {
  const isUnlimited = usage.dailyLimit === null || usage.dailyLimit === 0;
  const percentage = isUnlimited ? 0 : Math.min((usage.dailyCount / usage.dailyLimit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;
  const monthlyLimit = usage.monthlyLimit || usage.dailyLimit;
  const monthlyCount = usage.monthlyLimit ? usage.monthlyCount : usage.dailyCount;
  const monthlyUsageText = monthlyLimit > 0 ? `${monthlyCount} / ${monthlyLimit}` : 'Unlimited';

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'pro_monthly':
        return 'Pro (Monthly)';
      case 'pro_yearly':
        return 'Pro (Yearly)';
      default:
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Usage</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      <div className="mb-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usage.dailyCount}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isUnlimited ? 'Unlimited prompts' : `of ${usage.dailyLimit} prompts`}
          </span>
        </div>
      </div>

      {!isUnlimited && (
        <>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all duration-300 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary-600'
                }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {isAtLimit && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Daily limit reached. Upgrade to Pro for unlimited prompts!
            </p>
          )}

          {isNearLimit && !isAtLimit && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">You're approaching your daily limit.</p>
          )}
        </>
      )}

      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Monthly usage:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{monthlyUsageText}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Plan:</span>
          <span className="font-medium">{getPlanDisplayName(usage.plan)}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Resets:</span>
          <span>{new Date(usage.resetAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
