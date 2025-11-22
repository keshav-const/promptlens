import { GetServerSideProps } from 'next';
import { requireAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    fetchABTestById,
    updateVariant,
    setWinner,
    updateABTest,
    handleApiError,
} from '@/services/api';
import { ABTest, Variant } from '@/types/api';

export default function ABTestDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [test, setTest] = useState<ABTest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadTest();
        }
    }, [id]);

    const loadTest = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchABTestById(id as string);
            setTest(data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRating = async (variantName: string, rating: number) => {
        if (!test) return;

        try {
            const updated = await updateVariant(test._id, variantName, { rating });
            setTest(updated);
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const handleNotes = async (variantName: string, notes: string) => {
        if (!test) return;

        try {
            const updated = await updateVariant(test._id, variantName, { notes });
            setTest(updated);
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const handleSetWinner = async (variantName: string) => {
        if (!test) return;
        if (!confirm(`Set "${variantName}" as the winner?`)) return;

        try {
            const updated = await setWinner(test._id, variantName);
            setTest(updated);
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const handleStatusChange = async (status: 'draft' | 'active' | 'completed') => {
        if (!test) return;

        try {
            const updated = await updateABTest(test._id, { status });
            setTest(updated);
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg text-gray-600">Loading test...</div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error || 'Test not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/ab-testing')}
                    className="mb-4 text-sm text-gray-600 hover:text-gray-900"
                >
                    ← Back to Tests
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
                        {test.description && <p className="mt-2 text-gray-600">{test.description}</p>}
                    </div>
                    <select
                        value={test.status}
                        onChange={(e) =>
                            handleStatusChange(e.target.value as 'draft' | 'active' | 'completed')
                        }
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Winner Banner */}
            {test.winner && (
                <div className="mb-6 rounded-lg bg-green-50 p-4">
                    <div className="flex items-center">
                        <svg
                            className="h-5 w-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="ml-2 text-sm font-medium text-green-800">
                            Winner: {test.winner}
                        </span>
                    </div>
                </div>
            )}

            {/* Variants Comparison */}
            <div className="grid gap-6 lg:grid-cols-2">
                {test.variants.map((variant) => (
                    <VariantCard
                        key={variant.name}
                        variant={variant}
                        isWinner={test.winner === variant.name}
                        onRate={(rating) => handleRating(variant.name, rating)}
                        onNotes={(notes) => handleNotes(variant.name, notes)}
                        onSetWinner={() => handleSetWinner(variant.name)}
                        disabled={test.status === 'completed'}
                    />
                ))}
            </div>
        </div>
    );
}

// Variant Card Component
function VariantCard({
    variant,
    isWinner,
    onRate,
    onNotes,
    onSetWinner,
    disabled,
}: {
    variant: Variant;
    isWinner: boolean;
    onRate: (rating: number) => void;
    onNotes: (notes: string) => void;
    onSetWinner: () => void;
    disabled: boolean;
}) {
    const [notes, setNotes] = useState(variant.notes || '');
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    const saveNotes = () => {
        onNotes(notes);
        setIsEditingNotes(false);
    };

    return (
        <div
            className={`rounded-lg border-2 p-6 ${isWinner
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
        >
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{variant.name}</h3>
                    {isWinner && (
                        <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Winner
                        </span>
                    )}
                </div>
                {!disabled && !isWinner && (
                    <button
                        onClick={onSetWinner}
                        className="rounded-md bg-primary-600 px-3 py-1 text-sm font-medium text-white hover:bg-primary-700"
                    >
                        Set as Winner
                    </button>
                )}
            </div>

            {/* Prompt */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Prompt</label>
                <div className="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-900">
                    {variant.prompt}
                </div>
            </div>

            {/* Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => !disabled && onRate(star)}
                            disabled={disabled}
                            className={`text-2xl ${variant.rating && star <= variant.rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                } ${!disabled ? 'hover:text-yellow-400' : 'cursor-not-allowed'}`}
                        >
                            ★
                        </button>
                    ))}
                    {variant.rating && (
                        <span className="ml-2 text-sm text-gray-600">({variant.rating}/5)</span>
                    )}
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                {isEditingNotes ? (
                    <div className="mt-1">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Add notes about this variant..."
                        />
                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={saveNotes}
                                className="rounded-md bg-primary-600 px-3 py-1 text-sm font-medium text-white hover:bg-primary-700"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setNotes(variant.notes || '');
                                    setIsEditingNotes(false);
                                }}
                                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-1">
                        {variant.notes ? (
                            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-900">
                                {variant.notes}
                            </div>
                        ) : (
                            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
                                No notes yet
                            </div>
                        )}
                        {!disabled && (
                            <button
                                onClick={() => setIsEditingNotes(true)}
                                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                            >
                                {variant.notes ? 'Edit Notes' : 'Add Notes'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    return requireAuth(context);
};
