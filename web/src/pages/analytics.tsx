import { GetServerSideProps } from 'next';
import { requireAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import {
    fetchAnalytics,
    fetchUsageStats,
    exportAnalyticsCSV,
    handleApiError,
} from '@/services/api';
import { AnalyticsData, UsageStats } from '@/types/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [range, setRange] = useState<'week' | 'month' | 'year'>('month');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadData();
    }, [range]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [analyticsData, statsData] = await Promise.all([
                fetchAnalytics(range),
                fetchUsageStats(),
            ]);

            setAnalytics(analyticsData);
            setStats(statsData);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            await exportAnalyticsCSV(range);
        } catch (err) {
            alert(handleApiError(err));
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg text-gray-600">Loading analytics...</div>
            </div>
        );
    }

    if (error || !analytics || !stats) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error || 'Failed to load analytics'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="mt-2 text-gray-600">Track your prompt usage and performance</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value as 'week' | 'month' | 'year')}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Today" value={stats.today} color="blue" />
                <StatsCard title="This Week" value={stats.thisWeek} color="green" />
                <StatsCard title="This Month" value={stats.thisMonth} color="yellow" />
                <StatsCard title="All Time" value={stats.allTime} color="purple" />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Usage Over Time */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Usage Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Prompts" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Model Breakdown */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Model Usage</h3>
                    {analytics.modelBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.modelBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.model}: ${entry.percentage}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {analytics.modelBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-gray-500">
                            No model data available
                        </div>
                    )}
                </div>

                {/* Daily Breakdown Bar Chart */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Daily Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Legend />
                            <Bar dataKey="count" fill="#3B82F6" name="Prompts" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Summary</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <div className="text-sm text-gray-600">Total Prompts</div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">
                            {analytics.totalPrompts}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Favorites</div>
                        <div className="mt-1 text-2xl font-semibold text-yellow-600">
                            {analytics.favoriteCount}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Date Range</div>
                        <div className="mt-1 text-sm text-gray-900">
                            {new Date(analytics.dateRange.start).toLocaleDateString()} -{' '}
                            {new Date(analytics.dateRange.end).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stats Card Component
function StatsCard({
    title,
    value,
    color,
}: {
    title: string;
    value: number;
    color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className={`rounded-lg border border-gray-200 p-6 ${colorClasses[color]}`}>
            <div className="text-sm font-medium opacity-75">{title}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    return requireAuth(context);
};
