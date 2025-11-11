import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import UpgradeModal from '../UpgradeModal';
import * as api from '@/services/api';
import * as razorpay from '@/lib/razorpay';

jest.mock('@/services/api');
jest.mock('@/lib/razorpay');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('UpgradeModal', () => {
  const mockOnClose = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (razorpay.loadRazorpayScript as jest.Mock).mockResolvedValue(undefined);
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<UpgradeModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('per month')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
  });

  it('should display all pro features for monthly plan', () => {
    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('50 prompts per day')).toBeInTheDocument();
    expect(screen.getByText('Advanced prompt optimization')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();
    expect(screen.getByText('Export prompt history')).toBeInTheDocument();
    expect(screen.getByText('Custom tags and folders')).toBeInTheDocument();
    expect(screen.getByText('API access')).toBeInTheDocument();
  });

  it('should switch to yearly plan when yearly button is clicked', () => {
    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    const yearlyButton = screen.getByText('Yearly');
    fireEvent.click(yearlyButton);

    expect(screen.getByText('$7.99')).toBeInTheDocument();
    expect(screen.getByText('per month (billed yearly)')).toBeInTheDocument();
    expect(screen.getByText('Unlimited daily prompts')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call createSubscription when upgrade button is clicked', async () => {
    const mockCreateSubscription = jest.spyOn(api, 'createSubscription').mockResolvedValue({
      subscriptionId: 'sub_test123',
      razorpayKeyId: 'rzp_test_key',
      plan: 'pro_monthly',
      planName: 'Pro (Monthly)',
    });

    const mockOpenRazorpayCheckout = jest
      .spyOn(razorpay, 'openRazorpayCheckout')
      .mockImplementation(() => {
        // Simulate successful payment handler call
        const handler = (mockOpenRazorpayCheckout as any).mock.calls[0][0].handler;
        setTimeout(() => {
          handler({
            razorpay_payment_id: 'pay_test123',
            razorpay_order_id: 'order_test123',
            razorpay_signature: 'sig_test123',
            razorpay_subscription_id: 'sub_test123',
          });
        }, 0);
      });

    const mockVerifySubscription = jest.spyOn(api, 'verifySubscription').mockResolvedValue({
      success: true,
      plan: 'pro_monthly',
    });

    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    // Wait for script loading to complete
    await waitFor(() => {
      expect(screen.getByText('Upgrade Now (monthly)')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade Now (monthly)');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockCreateSubscription).toHaveBeenCalledWith('monthly');
      expect(mockOpenRazorpayCheckout).toHaveBeenCalled();
      expect(mockVerifySubscription).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard?upgraded=true');
    });
  });

  it('should show loading state during upgrade', async () => {
    jest.spyOn(api, 'createSubscription').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                subscriptionId: 'sub_test123',
                razorpayKeyId: 'rzp_test_key',
                plan: 'pro_monthly',
                planName: 'Pro (Monthly)',
              }),
            100
          );
        })
    );

    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    // Wait for script loading to complete
    await waitFor(() => {
      expect(screen.getByText('Upgrade Now (monthly)')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade Now (monthly)');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  it('should display error message on failure', async () => {
    jest.spyOn(api, 'createSubscription').mockRejectedValue(new Error('Payment failed'));
    jest.spyOn(api, 'handleApiError').mockReturnValue('Payment failed');

    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    // Wait for script loading to complete
    await waitFor(() => {
      expect(screen.getByText('Upgrade Now (monthly)')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade Now (monthly)');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  it('should handle payment verification failure', async () => {
    const mockCreateSubscription = jest.spyOn(api, 'createSubscription').mockResolvedValue({
      subscriptionId: 'sub_test123',
      razorpayKeyId: 'rzp_test_key',
      plan: 'pro_monthly',
      planName: 'Pro (Monthly)',
    });

    const mockOpenRazorpayCheckout = jest
      .spyOn(razorpay, 'openRazorpayCheckout')
      .mockImplementation(() => {
        // Simulate successful payment but failed verification
        const handler = (mockOpenRazorpayCheckout as any).mock.calls[0][0].handler;
        setTimeout(() => {
          handler({
            razorpay_payment_id: 'pay_test123',
            razorpay_order_id: 'order_test123',
            razorpay_signature: 'sig_test123',
            razorpay_subscription_id: 'sub_test123',
          });
        }, 0);
      });

    jest.spyOn(api, 'verifySubscription').mockRejectedValue(new Error('Verification failed'));
    jest.spyOn(api, 'handleApiError').mockReturnValue('Verification failed');

    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    // Wait for script loading to complete
    await waitFor(() => {
      expect(screen.getByText('Upgrade Now (monthly)')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade Now (monthly)');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(
        screen.getByText('Payment verification failed. Please contact support.')
      ).toBeInTheDocument();
    });
  });

  it('should close modal when clicking backdrop', () => {
    const { container } = render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    const backdrop = container.querySelector('.fixed.inset-0.bg-black');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });
});
