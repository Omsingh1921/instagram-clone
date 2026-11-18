import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { UploadProvider } from '../context/UploadContext';
import ProfilePage from '../pages/profile/ProfilePage';
import userService from '../services/user.service';
import storyService from '../services/story.service';
import postService from '../services/post.service';
import reelService from '../services/reel.service';

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
    getUserById: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../services/post.service', () => ({
  default: {
    getUserPosts: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'p-1',
          caption: 'Sunset mountains',
          media: [
            { id: 'm-1', mediaUrl: 'https://example.com/1.jpg', mediaType: 'IMAGE' },
            { id: 'm-2', mediaUrl: 'https://example.com/2.jpg', mediaType: 'IMAGE' },
          ],
          likeCount: 15,
          commentCount: 4,
        },
      ],
    }),
    getSavedPosts: vi.fn().mockResolvedValue({ content: [] }),
    getUserTaggedPosts: vi.fn().mockResolvedValue({ content: [] }),
    getArchivedPosts: vi.fn().mockResolvedValue({ content: [] }),
    getRecentlyDeletedPosts: vi.fn().mockResolvedValue({ content: [] }),
    togglePinPost: vi.fn().mockResolvedValue({ data: { isPinned: true } }),
  },
}));

vi.mock('../services/reel.service', () => ({
  default: {
    getUserReels: vi.fn().mockResolvedValue({ content: [] }),
    getSavedReels: vi.fn().mockResolvedValue({ content: [] }),
    unsaveReel: vi.fn().mockResolvedValue({}),
    getArchivedReels: vi.fn().mockResolvedValue({ content: [] }),
    unarchiveReel: vi.fn().mockResolvedValue({}),
    getRecentlyDeletedReels: vi.fn().mockResolvedValue({ content: [] }),
    togglePinReel: vi.fn().mockResolvedValue({ data: { isPinned: true } }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getUserStories: vi.fn().mockResolvedValue({ stories: [] }),
    getStoryArchive: vi.fn().mockResolvedValue({ content: [] }),
    getUserHighlights: vi.fn(),
    getHighlightById: vi.fn(),
  },
}));

vi.mock('../services/note.service', () => ({
  default: {
    getActiveNotesFeed: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/collection.service', () => ({
  default: {
    getCollections: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/settings.service', () => ({
  default: {
    isUserMuted: vi.fn().mockResolvedValue(false),
  },
}));

const baseUser = {
  id: 'uuid-user-1',
  userId: 'uuid-user-1',
  username: 'om_dev',
  displayName: 'Test User',
  bio: 'Developer | Java | Spring Boot',
  websiteUrl: 'https://github.com/omthakur',
  isVerified: true,
  postCount: 24,
  followerCount: 1248,
  followingCount: 312,
};

const renderProfile = () => {
  localStorage.setItem('access_token', 'mock-token');
  localStorage.setItem('user', JSON.stringify(baseUser));

  return render(
    <MemoryRouter initialEntries={['/profile/me']}>
      <ToastProvider>
        <AuthProvider>
          <UploadProvider>
            <Routes>
              <Route path="/profile/:userId" element={<ProfilePage />} />
            </Routes>
          </UploadProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('ProfilePage Redesign & Existing API Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.getCurrentUser.mockResolvedValue({ data: baseUser });
    userService.updateProfile.mockResolvedValue({
      data: { ...baseUser, bio: 'Updated Bio' },
    });
  });

  it('loads dynamic profile stats, bio, website, all 6 tabs, and highlights from backend services', async () => {
    storyService.getUserHighlights.mockResolvedValue({
      data: [
        { id: 'hl-1', title: 'Travel 🌄', coverImageUrl: 'https://example.com/travel.jpg' },
        { id: 'hl-2', title: 'Coding 💻', coverImageUrl: 'https://example.com/code.jpg' },
      ],
    });
    storyService.getHighlightById.mockResolvedValue({
      data: {
        id: 'hl-1',
        title: 'Travel 🌄',
        stories: [
          {
            id: 'st-1',
            mediaUrl: 'https://example.com/travel-story.jpg',
            mediaType: 'IMAGE',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    renderProfile();

    expect(await screen.findByText('om_dev')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Developer | Java | Spring Boot')).toBeInTheDocument();
    expect(screen.getByText('github.com/omthakur')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();

    // All 6 content navigation tabs
    expect(screen.getByRole('button', { name: /posts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reels/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tagged/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /archived/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recently deleted/i })).toBeInTheDocument();

    // Story highlights render and open real stories via getHighlightById
    const travelHl = screen.getByText('Travel 🌄');
    expect(travelHl).toBeInTheDocument();
    expect(screen.getByText('Coding 💻')).toBeInTheDocument();
    fireEvent.click(travelHl);

    await waitFor(() => {
      expect(storyService.getHighlightById).toHaveBeenCalledWith('hl-1');
    });
  });

  it('connects Edit profile form and does not render hardcoded highlight circles when database highlights are empty', async () => {
    storyService.getUserHighlights.mockResolvedValue({ data: [] });

    renderProfile();

    expect(await screen.findByText('om_dev')).toBeInTheDocument();
    expect(postService.getUserPosts).toHaveBeenCalledWith('uuid-user-1', 0, 30);

    // Only the "+ New" trigger renders when backend highlights are empty (no hardcoded presets on profile)
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.queryByText('Travel 🌄')).not.toBeInTheDocument();
    expect(screen.queryByText('Coding 💻')).not.toBeInTheDocument();
    expect(screen.queryByText('Food 🍲')).not.toBeInTheDocument();
    expect(screen.queryByText('Nature 🌅')).not.toBeInTheDocument();
    expect(screen.queryByText('Life ✨')).not.toBeInTheDocument();

    // Open and save inline Edit Profile form
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalled();
    });

    // Switch to Saved tab fetches saved posts
    fireEvent.click(screen.getByRole('button', { name: /saved/i }));
    await waitFor(() => {
      expect(postService.getSavedPosts).toHaveBeenCalledWith(0, 30);
    });
  });

  it('applies colorful story ring only when user has an active story', async () => {
    storyService.getUserHighlights.mockResolvedValue({ data: [] });
    storyService.getUserStories.mockResolvedValueOnce({ stories: [] });

    const { container, unmount } = renderProfile();
    expect(await screen.findByText('om_dev')).toBeInTheDocument();

    expect(container.querySelector('.profile-avatar-trigger.has-live-story')).toBeNull();
    expect(container.querySelector('.avatar-ring-unseen')).toBeNull();
    unmount();

    storyService.getUserStories.mockResolvedValueOnce({
      stories: [{ id: 's-1', mediaUrl: 'https://example.com/s.jpg', mediaType: 'IMAGE', viewed: false }],
    });
    const activeRender = renderProfile();
    expect(await activeRender.findByText('om_dev')).toBeInTheDocument();

    await waitFor(() => {
      expect(activeRender.container.querySelector('.profile-avatar-trigger.has-live-story')).toBeTruthy();
      expect(activeRender.container.querySelector('.avatar-ring-unseen')).toBeTruthy();
    });
  });

  it('renders Saved tab with Reels subtab, loads saved reels and removes reel on unsave click', async () => {
    const savedReel = {
      id: 'saved-reel-101',
      videoUrl: 'https://example.com/reel101.mp4',
      thumbnailUrl: 'https://example.com/thumb101.jpg',
      caption: 'Best saved reel ever',
      likeCount: 99,
      commentCount: 12,
      viewCount: 1500,
    };

    reelService.getSavedReels.mockResolvedValueOnce({
      content: [savedReel],
    });
    reelService.unsaveReel.mockResolvedValueOnce({});

    render(
      <MemoryRouter initialEntries={['/profile/u-1?tab=saved']}>
        <AuthProvider>
          <ToastProvider>
            <ProfilePage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Switch to Reels subtab in Saved
    const reelsSubtab = await screen.findByRole('button', { name: /Reels \(/i });
    fireEvent.click(reelsSubtab);

    expect(await screen.findByText('1.5K')).toBeInTheDocument();

    const unsaveBtn = screen.getByLabelText('Remove from saved');
    expect(unsaveBtn).toBeInTheDocument();
    fireEvent.click(unsaveBtn);

    await waitFor(() => {
      expect(reelService.unsaveReel).toHaveBeenCalledWith('saved-reel-101');
    });
  });

  it('renders Archived tab with Reels subtab, loads archived reels and unarchives reel on click', async () => {
    const archivedReel = {
      id: 'archived-reel-202',
      videoUrl: 'https://example.com/archived202.mp4',
      thumbnailUrl: 'https://example.com/thumb202.jpg',
      caption: 'My hidden memory reel',
      likeCount: 45,
      commentCount: 8,
      viewCount: 820,
      isArchived: true,
    };

    reelService.getArchivedReels.mockResolvedValueOnce({
      content: [archivedReel],
    });
    reelService.unarchiveReel.mockResolvedValueOnce({});

    render(
      <MemoryRouter initialEntries={['/profile/u-1?tab=archived']}>
        <AuthProvider>
          <ToastProvider>
            <ProfilePage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Switch to Reels subtab in Archived
    const reelsSubtab = await screen.findByRole('button', { name: /Reels \(/i });
    fireEvent.click(reelsSubtab);

    expect(await screen.findByText('820')).toBeInTheDocument();

    const showOnProfileBtn = screen.getByRole('button', { name: /Show on profile/i });
    expect(showOnProfileBtn).toBeInTheDocument();
    fireEvent.click(showOnProfileBtn);

    await waitFor(() => {
      expect(reelService.unarchiveReel).toHaveBeenCalledWith('archived-reel-202');
    });
  });

  it('pins post to profile and displays corner pin badge', async () => {
    let isPinnedState = false;
    postService.getUserPosts.mockImplementation(() =>
      Promise.resolve({
        content: [
          {
            id: 'post-pin-1',
            caption: 'My top memory',
            userId: 'uuid-user-1',
            media: [{ id: 'm-pin', mediaUrl: 'https://example.com/pin.jpg', mediaType: 'IMAGE' }],
            likeCount: 50,
            commentCount: 10,
            isPinned: isPinnedState,
          },
        ],
      })
    );
    postService.togglePinPost.mockImplementation(() => {
      isPinnedState = !isPinnedState;
      return Promise.resolve({ data: { isPinned: isPinnedState } });
    });

    renderProfile();

    const optsBtn = await screen.findByRole('button', { name: /Post options/i });
    expect(optsBtn).toBeInTheDocument();
    fireEvent.click(optsBtn);

    const pinBtn = await screen.findByRole('button', { name: /Pin to your profile/i });
    expect(pinBtn).toBeInTheDocument();
    fireEvent.click(pinBtn);

    await waitFor(() => {
      expect(postService.togglePinPost).toHaveBeenCalledWith('post-pin-1');
    });

    await waitFor(() => {
      expect(screen.getByTitle('Pinned to profile')).toBeInTheDocument();
    });
  });
});

