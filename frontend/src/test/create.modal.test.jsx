import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateModal } from '../components/modals/CreateModal';

describe('CreateModal Launcher', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectPost: vi.fn(),
    onSelectStory: vi.fn(),
    onSelectReel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render modal when isOpen is false', () => {
    render(<CreateModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders Create New launcher with Post, Story, and Reel studio cards', () => {
    render(<CreateModal {...defaultProps} />);

    expect(screen.getByText('Create New')).toBeTruthy();
    expect(
      screen.getByText('Choose a studio format to share with your followers')
    ).toBeTruthy();

    expect(screen.getByText('Post')).toBeTruthy();
    expect(screen.getByText('Feed')).toBeTruthy();
    expect(screen.getByText('Share photos or videos to your feed')).toBeTruthy();

    expect(screen.getByText('Story')).toBeTruthy();
    expect(screen.getByText('24h')).toBeTruthy();
    expect(screen.getByText('Disappears from your profile in 24 hours')).toBeTruthy();

    expect(screen.getByText('Reel')).toBeTruthy();
    expect(screen.getByText('Video')).toBeTruthy();
    expect(screen.getByText('Short immersive video with sound')).toBeTruthy();
  });

  it('closes launcher and triggers onSelectPost when Post card is clicked', () => {
    render(<CreateModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Post/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelectPost).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelectStory).not.toHaveBeenCalled();
    expect(defaultProps.onSelectReel).not.toHaveBeenCalled();
  });

  it('closes launcher and triggers onSelectStory when Story card is clicked', () => {
    render(<CreateModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Story/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelectStory).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelectPost).not.toHaveBeenCalled();
    expect(defaultProps.onSelectReel).not.toHaveBeenCalled();
  });

  it('closes launcher and triggers onSelectReel when Reel card is clicked', () => {
    render(<CreateModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Reel/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelectReel).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelectPost).not.toHaveBeenCalled();
    expect(defaultProps.onSelectStory).not.toHaveBeenCalled();
  });

  it('calls onClose when modal close button is clicked', () => {
    render(<CreateModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close modal'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});

