import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/settings/SettingsPage';
import storyService from '../services/story.service';
import userService from '../services/user.service';
import settingsService from '../services/settings.service';
import followService from '../services/follow.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/story.service', () => ({
  default: {
    getCloseFriends: vi.fn().mockResolvedValue({ data: [] }),
    getHiddenStoryUsers: vi.fn(),
    hideStoryFromUser: vi.fn(),
    unhideStoryFromUser: vi.fn(),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
    searchUsers: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../services/settings.service', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getBlockedUsers: vi.fn().mockResolvedValue({ data: [] }),
    getMutedUsers: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn(),
  },
}));

vi.mock('../services/session.service', () => ({
  default: {
    getActiveSessions: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

const renderSettings = (initialEntry = '/settings') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <ToastProvider>
          <SettingsPage />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('Story Privacy Settings Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', 'tok');
    userService.getCurrentUser.mockResolvedValue({
      data: { id: 'me-1', username: 'test', displayName: 'Test User' },
    });
    settingsService.getSettings.mockResolvedValue({ data: {} });
    storyService.getHiddenStoryUsers.mockResolvedValue({
      data: [
        { id: 'u-1', username: 'sneaky_user', displayName: 'Sneaky User' },
        { id: 'u-2', username: 'nosy_neighbor', displayName: 'Nosy Neighbor' },
      ],
    });
    followService.getFollowing.mockResolvedValue({
      data: {
        content: [
          { id: 'u-1', username: 'sneaky_user', displayName: 'Sneaky User' },
          { id: 'u-3', username: 'innocent_friend', displayName: 'Innocent Friend' },
        ],
      },
    });
    storyService.unhideStoryFromUser.mockResolvedValue({});
    storyService.hideStoryFromUser.mockResolvedValue({});
  });

  it('renders Story Privacy pane and unhides a user', async () => {
    renderSettings('/settings?tab=story_privacy');

    expect(await screen.findByRole('tab', { name: /Hidden \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Hide from People/i })).toBeInTheDocument();
    expect(await screen.findByText('sneaky_user')).toBeInTheDocument();
    expect(screen.getByText('nosy_neighbor')).toBeInTheDocument();

    const unhideButtons = screen.getAllByRole('button', { name: 'Unhide' });
    fireEvent.click(unhideButtons[0]);

    await waitFor(() => {
      expect(storyService.unhideStoryFromUser).toHaveBeenCalledWith('u-1');
      expect(screen.queryByText('sneaky_user')).toBeNull();
    });
    expect(await screen.findByRole('tab', { name: /Hidden \(1\)/i })).toBeInTheDocument();
  });

  it('switches to Hide from People tab and hides a candidate user', async () => {
    renderSettings('/settings?tab=story_privacy');

    const addTab = await screen.findByRole('tab', { name: /Hide from People/i });
    fireEvent.click(addTab);

    expect(await screen.findByText('innocent_friend')).toBeInTheDocument();
    const hideBtn = screen.getByRole('button', { name: /^Hide$/i });
    fireEvent.click(hideBtn);

    await waitFor(() => {
      expect(storyService.hideStoryFromUser).toHaveBeenCalledWith('u-3');
    });
  });
});
