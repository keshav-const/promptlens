import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { fetchTemplates, fetchCategories, useTemplate, handleApiError } from '@/services/api';
import { Template } from '@/types/api';

export default function Templates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, searchTerm]);

    const loadCategories = async () => {
        try {
            const data = await fetchCategories();
            setCategories(data.categories);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchTemplates({
                category: selectedCategory || undefined,
                search: searchTerm || undefined,
            });
            setTemplates(data.templates);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseTemplate = async (template: Template) => {
        try {
            await useTemplate(template._id);
            // Copy template content to clipboard
            await navigator.clipboard.writeText(template.content);
            alert('Template copied to clipboard!');
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const getCategoryLabel = (category: string) => {
        return category
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Prompt Templates</h1>
                <p className="mt-2 text-gray-600">
                    Browse and use pre-built prompt templates to get started quickly
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`rounded-md px-4 py-2 text-sm font-medium ${selectedCategory === ''
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`rounded-md px-4 py-2 text-sm font-medium ${selectedCategory === category
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {getCategoryLabel(category)}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-64"
                />
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
                    <div className="text-lg text-gray-600">Loading templates...</div>
                </div>
            )}

            {/* Templates Grid */}
            {!isLoading && templates.length === 0 && (
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || selectedCategory
                            ? 'Try adjusting your filters'
                            : 'No templates available yet'}
                    </p>
                </div>
            )}

            {!isLoading && templates.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <div
                            key={template._id}
                            className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                                    <span className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-800">
                                        {getCategoryLabel(template.category)}
                                    </span>
                                </div>
                            </div>

                            <p className="mb-4 flex-1 text-sm text-gray-600">{template.description}</p>

                            {template.tags.length > 0 && (
                                <div className="mb-4 flex flex-wrap gap-1">
                                    {template.tags.slice(0, 3).map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {template.tags.length > 3 && (
                                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                            +{template.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Used {template.usageCount} times</span>
                                </div>
                                <button
                                    onClick={() => handleUseTemplate(template)}
                                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                                >
                                    Use Template
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
