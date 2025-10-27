import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UsageTracker from '../UsageTracker';
import { UsageData } from '@/types/api';

describe('UsageTracker', () => {
  const mockUsageData: UsageData = {
    userId: 'test-user',
    dailyCount: 5,
    dailyLimit: 10,
    monthlyCount: 50,
    monthlyLimit: 300,
    resetAt: '2024-01-02T00:00:00.000Z',
    plan: 'free',
  };

  it('should render usage data correctly', () => {
    render(<UsageTracker usage={mockUsageData} />);

    expect(screen.getByText('Daily Usage')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('of 10 prompts')).toBeInTheDocument();
    expect(screen.getByText(/Monthly usage:/)).toBeInTheDocument();
    expect(screen.getByText('50 / 300')).toBeInTheDocument();
  });

  it('should show refresh button when onRefresh is provided', () => {
    const mockRefresh = jest.fn();
    render(<UsageTracker usage={mockUsageData} onRefresh={mockRefresh} />);

    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('should show refreshing state', () => {
    const mockRefresh = jest.fn();
    render(<UsageTracker usage={mockUsageData} onRefresh={mockRefresh} isRefreshing={true} />);

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    const refreshButton = screen.getByText('Refreshing...');
    expect(refreshButton).toBeDisabled();
  });

  it('should show warning when near limit', () => {
    const nearLimitUsage: UsageData = {
      ...mockUsageData,
      dailyCount: 9,
      dailyLimit: 10,
    };

    render(<UsageTracker usage={nearLimitUsage} />);

    expect(screen.getByText("You're approaching your daily limit.")).toBeInTheDocument();
  });

  it('should show error when at limit', () => {
    const atLimitUsage: UsageData = {
      ...mockUsageData,
      dailyCount: 10,
      dailyLimit: 10,
    };

    render(<UsageTracker usage={atLimitUsage} />);

    expect(
      screen.getByText('Daily limit reached. Upgrade to Pro for unlimited prompts!'),
    ).toBeInTheDocument();
  });

  it('should show correct progress bar color', () => {
    const { container, rerender } = render(<UsageTracker usage={mockUsageData} />);

    let progressBar = container.querySelector('.bg-primary-600');
    expect(progressBar).toBeInTheDocument();

    const nearLimitUsage: UsageData = { ...mockUsageData, dailyCount: 9 };
    rerender(<UsageTracker usage={nearLimitUsage} />);

    progressBar = container.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();

    const atLimitUsage: UsageData = { ...mockUsageData, dailyCount: 10 };
    rerender(<UsageTracker usage={atLimitUsage} />);

    progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display plan type', () => {
    render(<UsageTracker usage={mockUsageData} />);

    expect(screen.getByText('free', { exact: false })).toBeInTheDocument();
  });
});
