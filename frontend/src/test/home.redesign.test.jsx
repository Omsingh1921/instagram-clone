import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { UploadProvider } from '../context/UploadContext';
import HomePage from '../pages/HomePage';
import feedService from '../services/feed.service';
import followService from '../services/follow.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/feed.service', () => ({
  default: {
    getHomeFeed: vi.fn(),
    recordSeen: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      id: 'user-1',
      username: 'test1',
      displayName: 'Test User',
      role: 'USER',
    }),
    getSuggestedUsers: vi.fn().mockResolvedValue({
      data: [
        { id: 'u2', username: 'priya_19', displayName: 'Priya' },
        { id: 'u3', username: 'rahul_kr', displayName: 'Rahul' },
      ],
    }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getStoryFeed: vi.fn().mockResolvedValue({ data: [] }),
    getUserStories: vi.fn().mockResolvedValue({ data: { stories: [] } }),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue({ data: [] }),
    followUser: vi.fn().mockResolvedValue({ success: true }),
    unfollowUser: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../services/settings.service', () => ({
  default: {
    isUserMuted: vi.fn().mockResolvedValue({ data: false }),
  },
}));

vi.mock('../services/engagement.service', () => ({
  default: {
    toggleLike: vi.fn().mockResolvedValue({}),
    toggleSave: vi.fn().mockResolvedValue({}),
    addComment: vi.fn().mockResolvedValue({}),
  },
}));

const renderHome = () => {
  localStorage.setItem('access_token', 'mock-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 'user-1', username: 'test1', displayName: 'Test User', role: 'USER' })
  );

  return render(
    <MemoryRouter initialEntries={['/']}>
      <ToastProvider>
        <AuthProvider>
          <UploadProvider>
            <HomePage />
          </UploadProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Home Feed & Navigation Redesign Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    feedService.getHomeFeed.mockResolvedValue({
      data: {
        content: [
          {
            id: 'post-101',
            caption: 'Homemade food #food #indianfood',
            author: { id: 'user-1', username: 'test1' },
            media: [{ id: 'm1', mediaUrl: 'https://example.com/food.jpg', mediaType: 'IMAGE' }],
            likeCount: 12,
            commentCount: 3,
            createdAt: new Date().toISOString(),
          },
        ],
        last: true,
      },
    });
  });

  it('switches between For you and Following feed modes cleanly', async () => {
    renderHome();

    await waitFor(() => {
      expect(feedService.getHomeFeed).toHaveBeenCalledWith(0, 5, 'ALGORITHMIC');
    });

    const followingTab = screen.getByRole('tab', { name: 'Following' });
    fireEvent.click(followingTab);

    await waitFor(() => {
      expect(feedService.getHomeFeed).toHaveBeenCalledWith(0, 5, 'FOLLOWING');
    });
  });

  it('renders current user Edit profile card, highlights hashtags, and supports suggestion follow & dismiss', async () => {
    renderHome();

    const editProfileBtn = await screen.findByRole('button', { name: /edit profile/i });
    fireEvent.click(editProfileBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/settings');

    // Hashtag clickable chip inside PostCard
    const tagBtn = await screen.findByRole('button', { name: '#food' });
    expect(tagBtn).toBeInTheDocument();

    // Suggested users & dismiss button
    expect(await screen.findByText('priya_19')).toBeInTheDocument();
    const dismissPriya = screen.getByRole('button', { name: /dismiss priya_19/i });
    fireEvent.click(dismissPriya);
    expect(screen.queryByText('priya_19')).not.toBeInTheDocument();

    // Follow action triggers follow service
    const followButtons = screen.getAllByRole('button', { name: /^follow$/i });
    fireEvent.click(followButtons[0]);
    await waitFor(() => {
      expect(followService.followUser).toHaveBeenCalledWith('u3');
    });
  });

  it('places right sidebar column beside main feed in CSS grid with user card, See All, and footer links', async () => {
    const { container } = renderHome();

    const grid = container.querySelector('.home-page-container .home-layout-grid');
    const feedColumn = grid?.querySelector('.home-feed-column');
    const rightSidebar = grid?.querySelector('aside.home-sidebar-column');

    expect(grid).toBeInTheDocument();
    expect(feedColumn).toBeInTheDocument();
    expect(rightSidebar).toBeInTheDocument();

    // User profile card & Edit profile inside right sidebar
    expect(rightSidebar.querySelector('.home-user-glass-card')).toBeInTheDocument();
    expect(rightSidebar).toHaveTextContent('test1');

    // Suggested for you & See All navigation
    expect(await screen.findByText('Suggested for you')).toBeInTheDocument();
    const seeAllBtn = screen.getByRole('button', { name: /see all/i });
    fireEvent.click(seeAllBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/explore');

    // Footer links inside right sidebar
    expect(rightSidebar.querySelector('footer.sidebar-footer-links')).toBeInTheDocument();
    expect(rightSidebar).toHaveTextContent(/2026 INSTAGRAM/i);
  });
});

