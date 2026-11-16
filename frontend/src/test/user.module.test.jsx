import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { UploadProvider } from '../context/UploadContext';
import FollowListModal from '../components/modals/FollowListModal';
import SettingsPage from '../pages/settings/SettingsPage';
import NotificationsPage from '../pages/NotificationsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import followService from '../services/follow.service';
import userService from '../services/user.service';
import settingsService from '../services/settings.service';
import notificationService from '../services/notification.service';
import sessionService from '../services/session.service';

vi.mock('../services/session.service', () => ({
  default: {
    getActiveSessions: vi.fn().mockResolvedValue({ data: [] }),
    revokeSession: vi.fn(),
    revokeOtherSessions: vi.fn(),
    logoutAll: vi.fn(),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
    removeFollower: vi.fn(),
    getPendingFollowRequests: vi.fn(),
    acceptFollowRequest: vi.fn(),
    rejectFollowRequest: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    getUserById: vi.fn(),
    updateProfile: vi.fn(),
    deactivateCurrentUser: vi.fn(),
    deleteCurrentUser: vi.fn(),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
    getUserById: vi.fn(),
    updateProfile: vi.fn(),
    deactivateCurrentUser: vi.fn(),
    deleteCurrentUser: vi.fn(),
  },
}));

vi.mock('../services/settings.service', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    changePassword: vi.fn(),
    getBlockedUsers: vi.fn(),
    unblockUser: vi.fn(),
    initiateEmailChange: vi.fn(),
    cancelPendingEmailChange: vi.fn(),
  },
}));

vi.mock('../services/notification.service', () => ({
  default: {
    getNotifications: vi.fn(),
    markAllAsRead: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

vi.mock('../services/post.service', () => ({
  default: {
    getUserPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getTaggedPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getArchivedPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getSavedPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getRecentlyDeletedPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/reel.service', () => ({
  default: {
    getUserReels: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getArchivedReels: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getSavedReels: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getRecentlyDeletedReels: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getUserStories: vi.fn().mockResolvedValue({ data: [] }),
    getUserHighlights: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/note.service', () => ({
  default: {
    getUserNote: vi.fn().mockResolvedValue({ data: null }),
    getActiveNotesFeed: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/collection.service', () => ({
  default: {
    getCollections: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/auth.service', () => ({
  default: {
    logout: vi.fn().mockResolvedValue({}),
    refreshToken: vi.fn(),
  },
}));

const mockCurrentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000001',
  username: 'testpilot',
  displayName: 'Test Pilot',
  email: 'pilot@example.com',
};

describe('User Module Complete Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('access_token', 'test-access-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');

    userService.getCurrentUser.mockResolvedValue({ data: mockCurrentUser });
    settingsService.getSettings.mockResolvedValue({
      data: { privateAccount: false, notifyLikes: true },
    });
    settingsService.getBlockedUsers.mockResolvedValue({ data: [] });
    followService.getFollowing.mockResolvedValue({ data: [] });
    followService.getFollowers.mockResolvedValue({ data: [] });
    followService.getPendingFollowRequests.mockResolvedValue({ data: [] });
    notificationService.getNotifications.mockResolvedValue({ data: [] });
    sessionService.getActiveSessions.mockResolvedValue({ data: [] });
  });

  const renderWithProviders = (ui) =>
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <UploadProvider>
              {ui}
            </UploadProvider>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

  describe('FollowListModal & Follower Management', () => {
    it('renders followers list and removes follower when requested', async () => {
      followService.getFollowers.mockResolvedValueOnce({
        data: {
          content: [
            { id: 'f1', username: 'alex_rivera', displayName: 'Alex Rivera' },
            { id: 'f2', username: 'sara_chen', displayName: 'Sara Chen' },
          ],
        },
      });
      followService.removeFollower.mockResolvedValueOnce({});

      renderWithProviders(
        <FollowListModal
          isOpen={true}
          onClose={vi.fn()}
          userId={mockCurrentUser.id}
          type="followers"
          title="Followers"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('@alex_rivera')).toBeInTheDocument();
        expect(screen.getByText('@sara_chen')).toBeInTheDocument();
      });

      const removeBtns = screen.getAllByRole('button', { name: /Remove/i });
      expect(removeBtns.length).toBe(2);

      fireEvent.click(removeBtns[0]);

      await waitFor(() => {
        expect(followService.removeFollower).toHaveBeenCalledWith('f1');
      });
    });
  });

  describe('SettingsPage Account & Danger Zone', () => {
    it('switches to Account & Danger Zone tab and requests email change', async () => {
      settingsService.initiateEmailChange.mockResolvedValueOnce({
        message: 'Verification link sent',
      });

      renderWithProviders(<SettingsPage />);

      const accountTabBtn = await screen.findByRole('button', { name: /Account & Danger Zone/i });
      expect(accountTabBtn).toBeInTheDocument();

      fireEvent.click(accountTabBtn);

      await waitFor(() => {
        expect(screen.getByText(/pilot@example.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter new email address')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter new email address');
      fireEvent.change(emailInput, { target: { value: 'newpilot@example.com' } });

      const submitBtn = screen.getByRole('button', { name: /Change Email/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(settingsService.initiateEmailChange).toHaveBeenCalledWith('newpilot@example.com');
      });
    });

    it('shows confirmation modal for account deactivation', async () => {
      userService.deactivateCurrentUser.mockResolvedValueOnce({});

      renderWithProviders(<SettingsPage />);

      const accountTabBtn = await screen.findByRole('button', { name: /Account & Danger Zone/i });
      fireEvent.click(accountTabBtn);

      await waitFor(() => {
        expect(screen.getByText('Temporarily Deactivate Account')).toBeInTheDocument();
      });

      const deactBtn = screen.getByRole('button', { name: /Deactivate My Account/i });
      fireEvent.click(deactBtn);

      await waitFor(() => {
        expect(screen.getByText('Deactivate Account?')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /Yes, Deactivate/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(userService.deactivateCurrentUser).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('NotificationsPage Follow Requests Approval', () => {
    it('displays pending follow requests and allows confirming them', async () => {
      followService.getPendingFollowRequests.mockResolvedValueOnce({
        data: {
          content: [
            {
              id: 'req-1',
              requester: { id: 'u-55', username: 'requester_dan', displayName: 'Dan Vance' },
            },
          ],
        },
      });
      followService.acceptFollowRequest.mockResolvedValueOnce({});

      renderWithProviders(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Follow Requests \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText('@requester_dan')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(followService.acceptFollowRequest).toHaveBeenCalledWith('req-1');
      });
    });
  });

  describe('ProfilePage Render & Hook Integrity', () => {
    it('renders ProfilePage without hook count mismatch across loading and loaded state', async () => {
      userService.getCurrentUser.mockResolvedValueOnce({
        data: {
          id: 'u-current',
          username: 'om_tester',
          displayName: 'Om Tester',
          avatarUrl: 'https://example.com/avatar.jpg',
          followersCount: 12,
          followingCount: 34,
          postsCount: 0,
        },
      });

      renderWithProviders(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('om_tester')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Settings Scoping', () => {
    it('shows only Edit Profile, Change Password, and Login activity when logged in as Admin', async () => {
      const adminUser = {
        id: '00000000-0000-0000-0000-000000000099',
        userId: '00000000-0000-0000-0000-000000000099',
        username: 'admin',
        displayName: 'System Administrator',
        email: 'admin@instagram.com',
        role: 'ROLE_ADMIN',
      };
      localStorage.setItem('user', JSON.stringify(adminUser));
      userService.getCurrentUser.mockResolvedValue({ data: adminUser });

      renderWithProviders(<SettingsPage />);

      expect(await screen.findByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Login activity/i })).toBeInTheDocument();

      // Consumer Instagram settings tabs must stay hidden for Admin
      expect(screen.queryByRole('button', { name: /Close Friends/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Account privacy/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Supervision for Teen Accounts/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Account & Danger Zone/i })).not.toBeInTheDocument();
    });
  });
});
