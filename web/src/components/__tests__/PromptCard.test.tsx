import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptCard from '../PromptCard';
import { Prompt } from '@/types/api';

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('PromptCard', () => {
  const mockPrompt: Prompt = {
    id: '1',
    userId: 'test-user',
    originalText: 'Original prompt text',
    optimizedText: 'Optimized prompt text',
    tags: ['tag1', 'tag2'],
    isFavorite: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render prompt data correctly', () => {
    render(<PromptCard prompt={mockPrompt} />);

    expect(screen.getByText('Optimized Prompt')).toBeInTheDocument();
    expect(screen.getByText('Optimized prompt text')).toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('should show favorite star when prompt is favorite', () => {
    const favoritePrompt = { ...mockPrompt, isFavorite: true };
    render(<PromptCard prompt={favoritePrompt} />);

    const star = screen.getByText('★');
    expect(star).toBeInTheDocument();
  });

  it('should copy text to clipboard when copy button is clicked', async () => {
    render(<PromptCard prompt={mockPrompt} />);

    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Optimized prompt text');
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should toggle favorite when star button is clicked', async () => {
    const mockFavoriteToggle = jest.fn().mockResolvedValue(undefined);
    render(<PromptCard prompt={mockPrompt} onFavoriteToggle={mockFavoriteToggle} />);

    const favoriteButton = screen.getByTitle('Add to favorites');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(mockFavoriteToggle).toHaveBeenCalledWith('1', true);
    });
  });

  it('should show confirmation before deleting', async () => {
    const mockDelete = jest.fn().mockResolvedValue(undefined);
    global.confirm = jest.fn().mockReturnValue(true);

    render(<PromptCard prompt={mockPrompt} onDelete={mockDelete} />);

    const deleteButton = screen.getByTitle('Delete prompt');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('1');
    });
  });

  it('should not delete if confirmation is cancelled', async () => {
    const mockDelete = jest.fn();
    global.confirm = jest.fn().mockReturnValue(false);

    render(<PromptCard prompt={mockPrompt} onDelete={mockDelete} />);

    const deleteButton = screen.getByTitle('Delete prompt');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  it('should show original prompt in details', () => {
    render(<PromptCard prompt={mockPrompt} />);

    const details = screen.getByText('Show original prompt');
    expect(details).toBeInTheDocument();

    fireEvent.click(details);

    expect(screen.getByText('Original prompt text')).toBeInTheDocument();
  });

  it('should not show delete button when onDelete is not provided', () => {
    render(<PromptCard prompt={mockPrompt} />);

    const deleteButton = screen.queryByTitle('Delete prompt');
    expect(deleteButton).not.toBeInTheDocument();
  });
});
