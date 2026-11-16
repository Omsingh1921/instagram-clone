import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../pages/search/SearchPage';
import searchService from '../services/search.service';

const mockAuthUser = vi.hoisted(() => ({ id: 'me-1', username: 'test_me' }));
const mockToggleFollow = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const mockIsFollowing = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockToast = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn() }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isFollowing: mockIsFollowing,
    toggleFollow: mockToggleFollow,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => mockToast,
}));

vi.mock('../services/search.service', () => ({
  default: {
    getRecentSearches: vi.fn(),
    getExploreFeed: vi.fn(),
    searchUsers: vi.fn(),
    searchHashtags: vi.fn(),
    searchPosts: vi.fn(),
    getPostsByHashtag: vi.fn(),
    recordSearch: vi.fn().mockResolvedValue({}),
    deleteRecentSearch: vi.fn().mockResolvedValue({}),
    clearAllRecentSearches: vi.fn().mockResolvedValue({}),
  },
}));

const renderSearch = () =>
  render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>
  );

describe('SearchPage Redesign Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchService.getRecentSearches.mockResolvedValue({ data: [] });
    searchService.getExploreFeed.mockResolvedValue({
      data: {
        content: [
          {
            id: 'exp-1',
            caption: 'Food bowl',
            contentType: 'POST',
            likeCount: 12,
            commentCount: 3,
            media: [{ mediaUrl: 'https://example.com/food.jpg', mediaType: 'IMAGE' }],
          },
          {
            id: 'exp-2',
            caption: 'Reel clip',
            contentType: 'REEL',
            isReel: true,
            likeCount: 25,
            commentCount: 5,
            media: [{ mediaUrl: 'https://example.com/reel.mp4', mediaType: 'VIDEO' }],
          },
        ],
      },
    });
  });

  it('renders Search header, pill tabs, and Discover tiles with corner badges', async () => {
    const { container } = renderSearch();

    expect(screen.getByText('Search')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search accounts, #tags, or posts...')).toBeTruthy();

    expect(screen.getByRole('tab', { name: /Accounts/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Tags/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /Posts/i })).toHaveAttribute('aria-selected', 'false');

    expect(await screen.findByText('Discover')).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelectorAll('.search-grid-item').length).toBe(2);
    });
    expect(container.querySelectorAll('.search-corner-badge').length).toBe(1);
  });

  it('searches accounts and applies story rings only when actor hasActiveStory is true', async () => {
    searchService.searchUsers.mockResolvedValue({
      data: {
        content: [
          { id: 'u-1', username: 'active_story_user', displayName: 'Active', hasActiveStory: true },
          { id: 'u-2', username: 'plain_user', displayName: 'Plain', hasActiveStory: false },
        ],
      },
    });

    const { container } = renderSearch();
    const input = screen.getByPlaceholderText('Search accounts, #tags, or posts...');
    fireEvent.change(input, { target: { value: 'user' } });

    expect(await screen.findByText('active_story_user')).toBeTruthy();
    expect(screen.getByText('plain_user')).toBeTruthy();
    expect(container.querySelectorAll('.avatar-ring-unseen').length).toBe(1);
  });

  it('switches to Tags tab and filters Posts when hashtag is clicked', async () => {
    searchService.searchHashtags.mockResolvedValue({
      data: [{ name: 'travel', postCount: 42 }],
    });
    searchService.getPostsByHashtag.mockResolvedValue({
      data: { content: [] },
    });

    renderSearch();
    const input = screen.getByPlaceholderText('Search accounts, #tags, or posts...');
    fireEvent.change(input, { target: { value: 'trav' } });
    fireEvent.click(screen.getByRole('tab', { name: /Tags/i }));

    expect(await screen.findByText('#travel')).toBeTruthy();
    fireEvent.click(screen.getByText('#travel'));

    await waitFor(() => {
      expect(searchService.getPostsByHashtag).toHaveBeenCalledWith('travel', 0, 20);
    });
    expect(screen.getByRole('tab', { name: /Posts/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders tab-matched skeletons when searching in Posts or Tags tab', async () => {
    searchService.searchPosts.mockImplementation(() => new Promise(() => {}));
    searchService.searchHashtags.mockImplementation(() => new Promise(() => {}));

    const { container } = renderSearch();
    const input = screen.getByPlaceholderText('Search accounts, #tags, or posts...');

    fireEvent.change(input, { target: { value: 'sunset' } });
    fireEvent.click(screen.getByRole('tab', { name: /Posts/i }));

    await waitFor(() => {
      expect(container.querySelector('.grid.grid-cols-3')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Tags/i }));
    await waitFor(() => {
      expect(container.querySelector('.search-tags-list .search-skeleton-row')).toBeTruthy();
    });
  });
});

