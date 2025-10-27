import { UsageData } from '@/types/api';

interface UsageTrackerProps {
  usage: UsageData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function UsageTracker({ usage, onRefresh, isRefreshing }: UsageTrackerProps) {
  const percentage = Math.min((usage.dailyCount / usage.dailyLimit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Daily Usage</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      <div className="mb-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-gray-900">{usage.dailyCount}</span>
          <span className="text-sm text-gray-600">of {usage.dailyLimit} prompts</span>
        </div>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isAtLimit && (
        <p className="text-sm text-red-600">
          Daily limit reached. Upgrade to Pro for unlimited prompts!
        </p>
      )}

      {isNearLimit && !isAtLimit && (
        <p className="text-sm text-yellow-600">You're approaching your daily limit.</p>
      )}

      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Monthly usage:</span>
          <span className="font-medium text-gray-900">
            {usage.monthlyCount} / {usage.monthlyLimit}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Plan:</span>
          <span className="font-medium uppercase">{usage.plan}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Resets:</span>
          <span>{new Date(usage.resetAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
