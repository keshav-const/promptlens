import { GetServerSideProps } from 'next';
import { requireAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    fetchABTests,
    createABTest,
    deleteABTest,
    getABTestStats,
    handleApiError,
} from '@/services/api';
import { ABTest } from '@/types/api';

export default function ABTesting() {
    const router = useRouter();
    const [tests, setTests] = useState<ABTest[]>([]);
    const [stats, setStats] = useState({ total: 0, draft: 0, active: 0, completed: 0 });
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'active' | 'completed'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [testsData, statsData] = await Promise.all([
                fetchABTests(filterStatus === 'all' ? {} : { status: filterStatus }),
                getABTestStats(),
            ]);

            setTests(testsData.tests);
            setStats(statsData);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTest = async (data: {
        name: string;
        description: string;
        variants: Array<{ name: string; prompt: string }>;
    }) => {
        try {
            const newTest = await createABTest(data);
            setShowCreateModal(false);
            router.push(`/ab-testing/${newTest._id}`);
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const handleDeleteTest = async (id: string) => {
        if (!confirm('Are you sure you want to delete this A/B test?')) return;

        try {
            await deleteABTest(id);
            loadData();
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            active: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
        };
        return colors[status as keyof typeof colors] || colors.draft;
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
                    <p className="mt-2 text-gray-600">
                        Compare prompt variations and find what works best
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                    Create New Test
                </button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-sm text-gray-600">Total Tests</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-sm text-gray-600">Draft</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-500">{stats.draft}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-sm text-gray-600">Active</div>
                    <div className="mt-1 text-2xl font-semibold text-blue-600">{stats.active}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="mt-1 text-2xl font-semibold text-green-600">{stats.completed}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                {(['all', 'draft', 'active', 'completed'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${filterStatus === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-lg text-gray-600">Loading tests...</div>
                </div>
            )}

            {/* Tests List */}
            {!isLoading && tests.length === 0 && (
                <div className="flex min-h-[400px] flex-col items-center justify-center">
                    <svg
                        className="mb-4 h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">No tests found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Create your first A/B test to start comparing prompts
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                        Create Test
                    </button>
                </div>
            )}

            {!isLoading && tests.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {tests.map((test) => (
                        <div
                            key={test._id}
                            className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                                    <span
                                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(
                                            test.status
                                        )}`}
                                    >
                                        {test.status}
                                    </span>
                                </div>
                            </div>

                            {test.description && (
                                <p className="mb-4 text-sm text-gray-600">{test.description}</p>
                            )}

                            <div className="mb-4 text-sm text-gray-500">
                                <div>{test.variants.length} variants</div>
                                {test.winner && <div className="text-green-600">Winner: {test.winner}</div>}
                            </div>

                            <div className="mt-auto flex gap-2 border-t border-gray-100 pt-4">
                                <button
                                    onClick={() => router.push(`/ab-testing/${test._id}`)}
                                    className="flex-1 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => handleDeleteTest(test._id)}
                                    className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateTestModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateTest}
                />
            )}
        </div>
    );
}

// Create Test Modal Component
function CreateTestModal({
    onClose,
    onCreate,
}: {
    onClose: () => void;
    onCreate: (data: {
        name: string;
        description: string;
        variants: Array<{ name: string; prompt: string }>;
    }) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [variants, setVariants] = useState([
        { name: 'Variant A', prompt: '' },
        { name: 'Variant B', prompt: '' },
    ]);

    const addVariant = () => {
        if (variants.length < 5) {
            setVariants([
                ...variants,
                { name: `Variant ${String.fromCharCode(65 + variants.length)}`, prompt: '' },
            ]);
        }
    };

    const removeVariant = (index: number) => {
        if (variants.length > 2) {
            setVariants(variants.filter((_, i) => i !== index));
        }
    };

    const updateVariant = (index: number, field: 'name' | 'prompt', value: string) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Please enter a test name');
            return;
        }
        if (variants.some((v) => !v.prompt.trim())) {
            alert('Please fill in all variant prompts');
            return;
        }
        onCreate({ name, description, variants });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Create A/B Test</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Test Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="e.g., Email Subject Line Test"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="What are you testing?"
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">Variants</label>
                            {variants.length < 5 && (
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    + Add Variant
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {variants.map((variant, index) => (
                                <div key={index} className="rounded-lg border border-gray-200 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <input
                                            type="text"
                                            value={variant.name}
                                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                                            placeholder="Variant name"
                                        />
                                        {variants.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(index)}
                                                className="text-sm text-red-600 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        value={variant.prompt}
                                        onChange={(e) => updateVariant(index, 'prompt', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        placeholder="Enter prompt text..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                        >
                            Create Test
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    return requireAuth(context);
};
