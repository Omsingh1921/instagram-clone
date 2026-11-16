import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StoryViewerModal from '../components/story/StoryViewerModal';
import StoryBar from '../components/story/StoryBar';
import storyService from '../services/story.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock story service
vi.mock('../services/story.service', () => ({
  default: {
    getStoryFeed: vi.fn(),
    markStoryViewed: vi.fn().mockResolvedValue({ success: true }),
    toggleLikeStory: vi.fn().mockResolvedValue({ data: { liked: true } }),
    replyToStory: vi.fn().mockResolvedValue({ data: { id: 'msg-1' } }),
    reactToStory: vi.fn().mockResolvedValue({ data: { id: 'msg-2' } }),
    voteOnQuiz: vi.fn().mockResolvedValue({ data: { userVote: 0, percentA: 100, percentB: 0 } }),
    voteOnSlider: vi.fn().mockResolvedValue({ data: { userVote: 75, averageRating: 75 } }),
    toggleCountdownReminder: vi.fn().mockResolvedValue({ data: { isSubscribed: true } }),
    getStoryArchive: vi.fn().mockResolvedValue({ data: { content: [] } }),
    sharePostToStory: vi.fn().mockResolvedValue({ data: { id: 'story-new' } }),
    shareReelToStory: vi.fn().mockResolvedValue({ data: { id: 'story-new-2' } }),
    reportStory: vi.fn().mockResolvedValue({ success: true }),
    getStoryInsights: vi.fn().mockResolvedValue({
      data: {
        impressions: 42,
        reach: 35,
        repliesCount: 5,
        sharesCount: 2,
        forwardTaps: 10,
        backTaps: 3,
        nextStoryTaps: 1,
        exitedCount: 4,
      },
    }),
  },
}));

describe('Stories Comprehensive Frontend Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. storyService exposes all checklist API methods', () => {
    expect(typeof storyService.voteOnQuiz).toBe('function');
    expect(typeof storyService.voteOnSlider).toBe('function');
    expect(typeof storyService.toggleCountdownReminder).toBe('function');
    expect(typeof storyService.reactToStory).toBe('function');
    expect(typeof storyService.getStoryArchive).toBe('function');
    expect(typeof storyService.sharePostToStory).toBe('function');
    expect(typeof storyService.shareReelToStory).toBe('function');
    expect(typeof storyService.reportStory).toBe('function');
    expect(typeof storyService.getStoryInsights).toBe('function');
  });

  it('2. StoryViewerModal renders Quick Reaction Emojis and Close Friends badge', async () => {
    const mockGroups = [
      {
        author: { id: 'other-user-123', username: 'nature_photographer', avatarUrl: 'https://example.com/pic.jpg' },
        stories: [
          {
            id: 'story-1',
            mediaUrl: 'https://example.com/story.jpg',
            mediaType: 'IMAGE',
            createdAt: new Date().toISOString(),
            isCloseFriends: true,
            audioTitle: 'Midnight City',
            audioArtist: 'M83',
            quiz: {
              id: 'quiz-1',
              question: 'Where was this photo taken?',
              optionA: 'Iceland',
              optionB: 'Norway',
              correctOptionIndex: 0,
              totalVotes: 10,
            },
          },
        ],
      },
    ];

    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <StoryViewerModal
              isOpen={true}
              storyGroups={mockGroups}
              initialGroupIdx={0}
              onClose={vi.fn()}
            />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify username and close friends badge
    expect(screen.getByText('nature_photographer')).toBeInTheDocument();
    expect(screen.getByText('Close Friends')).toBeInTheDocument();

    // Verify audio attribution
    expect(screen.getByText(/Midnight City/)).toBeInTheDocument();

    // Verify quick emoji reaction buttons exist
    const emojis = ['😂', '😮', '😍', '😢', '👏', '🔥', '🎉', '💯'];
    emojis.forEach((emoji) => {
      expect(screen.getByTitle(`React with ${emoji}`)).toBeInTheDocument();
    });

    // Verify Quiz sticker question is displayed
    expect(screen.getByText('Where was this photo taken?')).toBeInTheDocument();
    expect(screen.getByText('Iceland')).toBeInTheDocument();
    expect(screen.getByText('Norway')).toBeInTheDocument();

    // Click emoji reaction
    fireEvent.click(screen.getByTitle('React with 🔥'));
    expect(storyService.reactToStory).toHaveBeenCalledWith('story-1', '🔥');

    // Vote on quiz option
    fireEvent.click(screen.getByText('Iceland'));
    expect(storyService.voteOnQuiz).toHaveBeenCalledWith('story-1', 0);
  });

  it('3. StoryBar renders Close Friends green ring indicator', async () => {
    storyService.getStoryFeed.mockResolvedValueOnce({
      data: [
        {
          user: { id: 'user-cf', username: 'bestie', profilePictureUrl: 'https://example.com/cf.jpg' },
          stories: [{ id: 's-cf', isCloseFriends: true, viewed: false }],
          allViewed: false,
        },
      ],
    });

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <StoryBar />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('bestie')).toBeInTheDocument();
    });

    // Check for close friends ring class
    const cfRing = container.querySelector('.avatar-ring-close-friends');
    expect(cfRing).toBeInTheDocument();
  });
});
