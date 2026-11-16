import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NotificationsPage from '../pages/NotificationsPage';
import notificationService from '../services/notification.service';
import followService from '../services/follow.service';

const mockToggleFollow = vi.fn().mockResolvedValue(true);
const mockIsFollowing = vi.fn().mockReturnValue(false);
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'current-u1', username: 'current_user' },
    isFollowing: mockIsFollowing,
    toggleFollow: mockToggleFollow,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

vi.mock('../services/notification.service', () => ({
  default: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue({}),
    markAllAsRead: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getPendingFollowRequests: vi.fn(),
    acceptFollowRequest: vi.fn().mockResolvedValue({}),
    rejectFollowRequest: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../services/chat.service', () => ({
  default: {
    getOrCreateDirectConversation: vi.fn(),
  },
}));

const sampleNotifications = [
  {
    id: 'n-sys',
    type: 'CONTENT_REMOVED',
    actor: { id: 'admin-id', username: 'admin', hasActiveStory: false },
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: 'n-req',
    type: 'FOLLOW_REQUEST',
    actor: { id: 'u-test1', username: 'test1', hasActiveStory: true },
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: 'n-like',
    type: 'POST_LIKED',
    actor: { id: 'u-alice', username: 'alice_dev', hasActiveStory: false },
    postId: 'post-99',
    mediaPreviewUrl: 'https://example.com/thumb.jpg',
    read: true,
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
];

const renderNotifications = () =>
  render(
    <MemoryRouter initialEntries={['/notifications']}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<div>Settings Notification Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('NotificationsPage Redesign Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationService.getNotifications.mockResolvedValue({
      data: { content: sampleNotifications },
    });
    followService.getPendingFollowRequests.mockResolvedValue({
      data: {
        content: [
          {
            id: 'req-test1',
            requester: { id: 'u-test1', username: 'test1', displayName: 'Test One' },
          },
        ],
      },
    });
  });

  it('renders header controls, filter pills, system shield badge, and marks all as read', async () => {
    renderNotifications();

    expect(await screen.findByText('Notifications')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'All' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Follows' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Mentions' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Comments' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Likes' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'System' })).toBeTruthy();

    expect(screen.getByLabelText('Verified badge')).toBeTruthy();
    expect(screen.getByText(/Notice: Your content was removed/i)).toBeTruthy();

    const markAllBtn = screen.getByRole('button', { name: /Mark all as read/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
    });
  });

  it('filters notifications by category and shows empty filter reset when category has no items', async () => {
    renderNotifications();
    await screen.findByText('alice_dev');

    fireEvent.click(screen.getByRole('tab', { name: 'Likes' }));
    expect(screen.getByText('alice_dev')).toBeTruthy();
    expect(screen.queryByText('test1')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Mentions' }));
    expect(screen.getByText('No mentions notifications')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /View all notifications/i }));
    expect(screen.getByText('test1')).toBeTruthy();
  });

  it('deduplicates pending follow request shown inline in notifications and confirms cleanly', async () => {
    const { container } = renderNotifications();
    await screen.findByText('test1');

    // No separate Follow Requests header when matched inline
    expect(screen.queryByText(/Follow Requests \(/i)).toBeNull();

    // Story ring applies ONLY to active story user (test1), not non-story users
    const storyRings = container.querySelectorAll('.avatar-ring-unseen');
    expect(storyRings.length).toBe(1);

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(followService.acceptFollowRequest).toHaveBeenCalledWith('req-test1');
    });
  });

  it('navigates to notification settings tab when gear button is clicked', async () => {
    renderNotifications();
    await screen.findByText('Notifications');

    fireEvent.click(screen.getByLabelText('Notification settings'));
    expect(await screen.findByText('Settings Notification Page')).toBeTruthy();
  });

  it('renders grouped New and Earlier skeleton cards while notifications load', () => {
    notificationService.getNotifications.mockImplementationOnce(() => new Promise(() => {}));
    followService.getPendingFollowRequests.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = renderNotifications();

    expect(container.querySelectorAll('.w-11.h-11.rounded-full').length).toBe(5);
    expect(container.querySelectorAll('.w-11.h-11.rounded-lg').length).toBe(3);
    expect(container.querySelectorAll('.w-20.h-8.rounded-lg').length).toBe(2);
    expect(container.querySelector('.instagram-spinner')).toBeNull();
  });
});

