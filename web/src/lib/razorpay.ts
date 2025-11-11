declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    razorpay_subscription_id: string;
  }) => void;
  modal: {
    ondismiss: () => void;
    escape: boolean;
    backdropclose: boolean;
    animate: boolean;
  };
  theme: {
    color: string;
  };
}

let isRazorpayLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadRazorpayScript = (): Promise<void> => {
  if (isRazorpayLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      isRazorpayLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      isRazorpayLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Razorpay script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const openRazorpayCheckout = (options: RazorpayOptions): void => {
  if (!window.Razorpay) {
    throw new Error('Razorpay script not loaded');
  }

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};

export const getRazorpayKeyId = (): string => {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
};
