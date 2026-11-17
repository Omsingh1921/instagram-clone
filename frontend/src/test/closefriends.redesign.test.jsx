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
    getCloseFriends: vi.fn(),
    addCloseFriend: vi.fn(),
    removeCloseFriend: vi.fn(),
    getHiddenStoryUsers: vi.fn().mockResolvedValue({ data: [] }),
    hideStoryFromUser: vi.fn().mockResolvedValue({}),
    unhideStoryFromUser: vi.fn().mockResolvedValue({}),
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

describe('Close Friends Settings Section Redesign Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', 'tok');
    userService.getCurrentUser.mockResolvedValue({
      data: { id: 'me-1', username: 'test', displayName: 'Test User' },
    });
    settingsService.getSettings.mockResolvedValue({ data: {} });
    storyService.getCloseFriends.mockResolvedValue({
      data: [
        { id: 'f-1', username: 'rahul_sharma', displayName: 'Rahul Sharma' },
        { id: 'f-2', username: 'priya_verma', displayName: 'Priya Verma' },
      ],
    });
    followService.getFollowing.mockResolvedValue({
      data: {
        content: [
          { id: 'f-1', username: 'rahul_sharma', displayName: 'Rahul Sharma' },
          { id: 'f-3', username: 'arjun_singh', displayName: 'Arjun Singh' },
        ],
      },
    });
    storyService.removeCloseFriend.mockResolvedValue({});
    storyService.addCloseFriend.mockResolvedValue({});
  });

  it('opens Close Friends inline in Settings content pane with two tabs and removes a friend', async () => {
    renderSettings('/settings?tab=close_friends');

    expect(await screen.findByRole('tab', { name: /All Close Friends \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Add to Close Friends/i })).toBeInTheDocument();
    expect(await screen.findByText('rahul_sharma')).toBeInTheDocument();
    expect(screen.getByText('priya_verma')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(storyService.removeCloseFriend).toHaveBeenCalledWith('f-1');
      expect(screen.queryByText('rahul_sharma')).toBeNull();
    });
    expect(screen.getByRole('tab', { name: /All Close Friends \(1\)/i })).toBeInTheDocument();
  });

  it('switches to Add to Close Friends tab and adds a user via backend service', async () => {
    renderSettings('/settings?tab=close_friends');

    const addTab = await screen.findByRole('tab', { name: /Add to Close Friends/i });
    fireEvent.click(addTab);

    expect(await screen.findByText('arjun_singh')).toBeInTheDocument();
    const addButtons = screen.getAllByRole('button', { name: 'Add' });
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(storyService.addCloseFriend).toHaveBeenCalledWith('f-3');
    });
    expect(screen.getByRole('tab', { name: /All Close Friends \(3\)/i })).toBeInTheDocument();
  });
});

