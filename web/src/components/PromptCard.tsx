import { useState } from 'react';
import { Prompt } from '@/types/api';

interface PromptCardProps {
  prompt: Prompt;
  onFavoriteToggle?: (promptId: string, isFavorite: boolean) => Promise<void>;
  onDelete?: (promptId: string) => Promise<void>;
}

export default function PromptCard({ prompt, onFavoriteToggle, onDelete }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.optimizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Optimized Prompt',
          text: prompt.optimizedText,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      handleCopy();
    }
  };

  const handleFavoriteToggle = async () => {
    if (!onFavoriteToggle || isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      await onFavoriteToggle(prompt.id, !prompt.isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;

    if (!confirm('Are you sure you want to delete this prompt?')) return;

    setIsDeleting(true);
    try {
      await onDelete(prompt.id);
    } catch (error) {
      console.error('Failed to delete:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Optimized Prompt</h3>
            {prompt.isFavorite && <span className="text-yellow-500">★</span>}
          </div>
          <p className="text-xs text-gray-500">{new Date(prompt.createdAt).toLocaleString()}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFavoriteToggle}
            disabled={isTogglingFavorite}
            className={`transition-colors disabled:opacity-50 ${prompt.isFavorite
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-gray-400 hover:text-yellow-500'
              }`}
            title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className="h-5 w-5"
              fill={prompt.isFavorite ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>

          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-500 disabled:opacity-50"
              title="Delete prompt"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 rounded-md bg-gray-50 p-3">
          <p
            className={`text-sm text-gray-700 ${!isExpanded ? 'line-clamp-3' : ''}`}
            style={!isExpanded ? {
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            } : {}}
          >
            {prompt.optimizedText}
          </p>
          {prompt.optimizedText.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {isExpanded ? '← Show less' : 'Read more →'}
            </button>
          )}
        </div>

        {/* Token Savings Display */}
        {prompt.tokensSaved !== undefined && prompt.tokensSaved !== 0 && (
          <div className="mb-2 rounded-md bg-green-50 border border-green-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium text-green-800">
                  {prompt.tokensSaved > 0 ? 'Tokens Saved' : 'Tokens Added'}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-900">
                  {Math.abs(prompt.tokensSaved)} tokens
                  {prompt.originalTokens && prompt.originalTokens > 0 && (
                    <span className="ml-1 text-xs">
                      ({Math.round((Math.abs(prompt.tokensSaved) / prompt.originalTokens) * 100)}%)
                    </span>
                  )}
                </div>
                <div className="text-xs text-green-700">
                  {prompt.originalTokens || 0} → {prompt.optimizedTokens || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {prompt.originalText && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Show original prompt
            </summary>
            <div className="mt-2 rounded-md bg-gray-50 p-3">
              <p className="text-sm text-gray-600">{prompt.originalText}</p>
            </div>
          </details>
        )}
      </div>

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? (
            <>
              <span className="inline-flex items-center">
                <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied!
              </span>
            </>
          ) : (
            'Copy'
          )}
        </button>

        <button
          onClick={handleShare}
          className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Share
        </button>
      </div>
    </div>
  );
}
