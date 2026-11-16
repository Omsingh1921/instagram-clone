import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { UploadProvider } from '../context/UploadContext';
import PostCard from '../components/post/PostCard';
import CommentsModal from '../components/modals/CommentsModal';
import ReelsPage from '../pages/ReelsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import postService from '../services/post.service';
import reelService from '../services/reel.service';
import userService from '../services/user.service';
import storyService from '../services/story.service';

const mockCurrentUser = {
  id: 'user-123',
  userId: 'user-123',
  username: 'om_singh',
  displayName: 'Om Singh',
  avatarUrl: 'https://example.com/avatar.jpg',
  role: 'USER',
};

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      id: 'user-123',
      userId: 'user-123',
      username: 'om_singh',
      displayName: 'Om Singh',
      avatarUrl: 'https://example.com/avatar.jpg',
      role: 'USER',
      followersCount: 10,
      followingCount: 5,
    }),
    getUserById: vi.fn().mockResolvedValue({
      id: 'user-123',
      userId: 'user-123',
      username: 'om_singh',
      displayName: 'Om Singh',
      avatarUrl: 'https://example.com/avatar.jpg',
      role: 'USER',
      followersCount: 10,
      followingCount: 5,
    }),
  },
}));

vi.mock('../services/post.service', () => ({
  default: {
    deletePost: vi.fn().mockResolvedValue({ success: true }),
    getPostById: vi.fn().mockResolvedValue({
      id: 'test-post-1',
      caption: 'Test post caption',
      author: { id: 'user-123', username: 'om_singh' },
      media: [{ id: 'm1', mediaUrl: 'https://example.com/test.jpg', mediaType: 'IMAGE' }],
      likeCount: 5,
      commentCount: 2,
    }),
    getUserPosts: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'grid-post-1',
          caption: 'Delicious food bowl',
          author: { id: 'user-123', username: 'om_singh' },
          media: [{ id: 'm1', mediaUrl: 'https://example.com/food.jpg', mediaType: 'IMAGE' }],
          likeCount: 20,
          commentCount: 5,
        },
      ],
    }),
    toggleLike: vi.fn().mockResolvedValue({ liked: true }),
    toggleSave: vi.fn().mockResolvedValue({ saved: true }),
  },
}));

vi.mock('../services/reel.service', () => ({
  default: {
    deleteReel: vi.fn().mockResolvedValue({ success: true }),
    getReelById: vi.fn().mockResolvedValue({
      id: 'test-reel-1',
      caption: 'Test reel caption',
      author: { id: 'user-123', username: 'om_singh' },
      videoUrl: 'https://example.com/video.mp4',
      likeCount: 10,
      commentCount: 4,
    }),
    getUserReels: vi.fn().mockResolvedValue({ content: [] }),
    getReels: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'test-reel-1',
          caption: 'My exclusive reel',
          author: { id: 'user-123', username: 'om_singh' },
          videoUrl: 'https://example.com/video.mp4',
          likeCount: 15,
          commentCount: 6,
        },
      ],
    }),
    getReelsFeed: vi.fn().mockResolvedValue({ content: [] }),
    getFollowingReelsFeed: vi.fn().mockResolvedValue({ content: [] }),
    recordView: vi.fn().mockResolvedValue({}),
    getComments: vi.fn().mockResolvedValue([]),
    toggleLikeReel: vi.fn().mockResolvedValue({ liked: true }),
    toggleSaveReel: vi.fn().mockResolvedValue({ saved: true }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getUserStories: vi.fn().mockResolvedValue({ stories: [] }),
    getUserHighlights: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/note.service', () => ({
  default: {
    getActiveNotesFeed: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/engagement.service', () => ({
  default: {
    getComments: vi.fn().mockResolvedValue([]),
    addComment: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue([]),
  },
}));

const renderWithProviders = (ui, initialEntries = ['/']) => {
  localStorage.setItem('access_token', 'mock-token');
  localStorage.setItem('user', JSON.stringify(mockCurrentUser));

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <UploadProvider>
            {ui}
          </UploadProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Post & Reel Three-Dot Menu Delete Option Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('1. PostCard top-right three dots opens menu and reliably executes Delete post', async () => {
    const mockPost = {
      id: 'test-post-1',
      caption: 'My first post',
      author: { id: 'user-123', username: 'om_singh' },
      media: [{ id: 'm1', mediaUrl: 'https://example.com/pic.jpg', mediaType: 'IMAGE' }],
      likeCount: 12,
      commentCount: 3,
    };
    const onPostDeleted = vi.fn();

    renderWithProviders(<PostCard post={mockPost} onPostDeleted={onPostDeleted} />);

    // Locate the three-dot button in the post header
    const threeDotBtn = screen.getByLabelText(/Post options/i);
    expect(threeDotBtn).toBeTruthy();

    // Click three dots
    fireEvent.click(threeDotBtn);

    // Verify "Delete post" option is visible
    const deleteBtn = await screen.findByText(/Delete post/i);
    expect(deleteBtn).toBeTruthy();

    // Click Delete post
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(postService.deletePost).toHaveBeenCalledWith('test-post-1');
      expect(onPostDeleted).toHaveBeenCalledWith('test-post-1');
    });
  });

  it('2. CommentsModal top-right three dots opens options sheet and executes Delete Post', async () => {
    const onClose = vi.fn();
    const onPostUpdated = vi.fn();

    renderWithProviders(
      <CommentsModal
        isOpen={true}
        onClose={onClose}
        postId="test-post-1"
        isReel={false}
        onPostUpdated={onPostUpdated}
      />
    );

    // Wait for post data to load
    await screen.findByText('Test post caption');

    // Click three-dot button in header
    const optionsBtns = screen.getAllByTitle('Options');
    expect(optionsBtns.length).toBeGreaterThan(0);
    fireEvent.click(optionsBtns[0]);

    // Verify "Delete Post" appears in options dialog
    const deleteBtn = await screen.findByText(/Delete Post/i);
    expect(deleteBtn).toBeTruthy();

    // Click Delete
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(postService.deletePost).toHaveBeenCalledWith('test-post-1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('3. CommentsModal for Reel opens options sheet and executes Delete Reel', async () => {
    const onClose = vi.fn();
    const onPostUpdated = vi.fn();

    renderWithProviders(
      <CommentsModal
        isOpen={true}
        onClose={onClose}
        postId="test-reel-1"
        isReel={true}
        onPostUpdated={onPostUpdated}
      />
    );

    // Wait for reel data to load
    await screen.findByText('Test reel caption');

    // Click three-dot button in header
    const optionsBtns = screen.getAllByTitle('Options');
    expect(optionsBtns.length).toBeGreaterThan(0);
    fireEvent.click(optionsBtns[0]);

    // Verify "Delete Reel" appears in options dialog
    const deleteBtn = await screen.findByText(/Delete Reel/i);
    expect(deleteBtn).toBeTruthy();

    // Click Delete
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(reelService.deleteReel).toHaveBeenCalledWith('test-reel-1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('4. ReelsPage top-right corner three dots opens options sheet and executes Delete Reel', async () => {
    renderWithProviders(<ReelsPage />);

    // Wait for feed to load reel
    await screen.findByText('My exclusive reel');

    // Locate the top-right three-dot options button
    const topOptionsBtn = screen.getByLabelText(/Reel options/i);
    expect(topOptionsBtn).toBeTruthy();

    // Click top-right three dots
    fireEvent.click(topOptionsBtn);

    // Verify "Delete reel" option is displayed
    const deleteBtn = await screen.findByText(/Delete reel/i);
    expect(deleteBtn).toBeTruthy();

    // Click Delete reel
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(reelService.deleteReel).toHaveBeenCalledWith('test-reel-1');
    });
  });

  it('5. ProfilePage grid post thumbnail has three-dot options button directly on top of post (Post ke uper)', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Routes>,
      ['/profile/me']
    );

    // Wait for post thumbnail to render
    await screen.findAllByAltText('Delicious food bowl');

    // Find the three-dot button directly on top of the post thumbnail
    const postOptsBtn = screen.getByLabelText(/Post options/i);
    expect(postOptsBtn).toBeTruthy();

    // Click the three dots right on top of the post
    fireEvent.click(postOptsBtn);

    // Options action sheet appears with "Delete Post"
    const deletePostBtn = await screen.findByText(/Delete Post/i);
    expect(deletePostBtn).toBeTruthy();

    // Click Delete Post
    fireEvent.click(deletePostBtn);

    await waitFor(() => {
      expect(postService.deletePost).toHaveBeenCalledWith('grid-post-1');
    });
  });
});
