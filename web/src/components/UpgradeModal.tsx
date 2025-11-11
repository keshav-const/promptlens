import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createSubscription, verifySubscription, handleApiError } from '@/services/api';
import { loadRazorpayScript, openRazorpayCheckout, getRazorpayKeyId } from '@/lib/razorpay';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isScriptLoading, setIsScriptLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !isScriptLoading) {
      setIsScriptLoading(true);
      loadRazorpayScript()
        .catch((err) => {
          console.error('Failed to load Razorpay script:', err);
          setError('Payment system is currently unavailable. Please try again later.');
        })
        .finally(() => {
          setIsScriptLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (isLoading || isScriptLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const checkoutData = await createSubscription(selectedPlan);

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
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              subscriptionId: response.razorpay_subscription_id,
            });

            // Close modal and redirect to dashboard with success message
            onClose();
            router.push('/dashboard?upgraded=true');
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          {/* Plan Selection Toggle */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedPlan === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedPlan === 'yearly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-primary-50 p-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary-600">
                {selectedPlan === 'monthly' ? '$9.99' : '$7.99'}
              </div>
              <div className="text-sm text-gray-600">
                per {selectedPlan === 'monthly' ? 'month' : 'month (billed yearly)'}
              </div>
            </div>
          </div>

          <h3 className="mb-3 font-semibold text-gray-900">Pro Features:</h3>
          <ul className="space-y-2">
            {[
              selectedPlan === 'monthly' ? '50 prompts per day' : 'Unlimited daily prompts',
              'Advanced prompt optimization',
              'Priority support',
              'Export prompt history',
              'Custom tags and folders',
              'API access',
            ].map((feature) => (
              <li key={feature} className="flex items-start">
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
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isLoading || isScriptLoading}
            className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isScriptLoading
              ? 'Loading Payment...'
              : isLoading
                ? 'Processing...'
                : `Upgrade Now (${selectedPlan})`}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </div>
  );
}
