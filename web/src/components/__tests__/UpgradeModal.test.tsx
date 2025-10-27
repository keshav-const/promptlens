import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpgradeModal from '../UpgradeModal';
import * as api from '@/services/api';

jest.mock('@/services/api');

describe('UpgradeModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('should display all pro features', () => {
    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Unlimited daily prompts')).toBeInTheDocument();
    expect(screen.getByText('Advanced prompt optimization')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();
    expect(screen.getByText('Export prompt history')).toBeInTheDocument();
    expect(screen.getByText('Custom tags and folders')).toBeInTheDocument();
    expect(screen.getByText('API access')).toBeInTheDocument();
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

  it('should call createCheckoutSession when upgrade button is clicked', async () => {
    const mockCreateCheckoutSession = jest
      .spyOn(api, 'createCheckoutSession')
      .mockResolvedValue({
        url: 'https://checkout.stripe.com/test',
        sessionId: 'test-session-id',
      });

    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: jest.fn() };

    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    const upgradeButton = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockCreateCheckoutSession).toHaveBeenCalledTimes(1);
    });

    window.location = originalLocation;
  });

  it('should show loading state during upgrade', async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: jest.fn() };

    jest.spyOn(api, 'createCheckoutSession').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                url: 'https://checkout.stripe.com/test',
                sessionId: 'test-session-id',
              }),
            100,
          );
        }),
    );

    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    const upgradeButton = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    window.location = originalLocation;
  });

  it('should display error message on failure', async () => {
    jest.spyOn(api, 'createCheckoutSession').mockRejectedValue(new Error('Payment failed'));
    jest.spyOn(api, 'handleApiError').mockReturnValue('Payment failed');

    render(<UpgradeModal isOpen={true} onClose={mockOnClose} />);

    const upgradeButton = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
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
