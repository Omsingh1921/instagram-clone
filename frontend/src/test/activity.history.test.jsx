import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import YourActivityPage from '../pages/activity/YourActivityPage';
import settingsService from '../services/settings.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { formatDate } from '../utils';

vi.mock('../services/settings.service', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getScreenTime: vi.fn(),
    recordScreenTimeHeartbeat: vi.fn(),
    flushScreenTimeKeepalive: vi.fn(),
    getAccountCreated: vi.fn(),
    getPasswordHistory: vi.fn(),
  },
}));

vi.mock('../services/post.service', () => ({
  default: {
    getLikedPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getUserPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getArchivedPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getRecentlyDeletedPosts: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/reel.service', () => ({
  default: {
    getUserReels: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getArchivedReels: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getRecentlyDeletedReels: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getStoryArchive: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

describe('YourActivityPage Account History (2 minimal separate endpoints)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('access_token', 'mock-jwt');
    localStorage.setItem('user', JSON.stringify({ id: 'u-1', username: 'test1', role: 'ROLE_USER' }));
    settingsService.getSettings.mockResolvedValue({ data: { breakReminderMinutes: 0 } });
  });

  it('fetches account creation date and password change summary separately and renders only those 2 cards', async () => {
    const createdIso = '2026-11-01T11:05:33';
    const pwIso = '2026-11-12T09:15:10';

    settingsService.getAccountCreated.mockResolvedValue({
      data: { accountCreatedAt: createdIso },
    });
    settingsService.getPasswordHistory.mockResolvedValue({
      data: { lastChangedAt: pwIso, changeCount: 2 },
    });

    render(
      <MemoryRouter initialEntries={['/your-activity?tab=history']}>
        <AuthProvider>
          <ToastProvider>
            <YourActivityPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(settingsService.getAccountCreated).toHaveBeenCalledTimes(1);
      expect(settingsService.getPasswordHistory).toHaveBeenCalledTimes(1);
      expect(screen.getByText(formatDate(createdIso))).toBeInTheDocument();
      expect(screen.getByText('Changed 2 times.')).toBeInTheDocument();
      expect(screen.getByText(`Last changed ${formatDate(pwIso)}`)).toBeInTheDocument();
    });

    expect(screen.getByText('Account created')).toBeInTheDocument();
    expect(screen.getByText('Password last updated')).toBeInTheDocument();
    expect(screen.queryByText('Privacy preferences active')).not.toBeInTheDocument();
  });

  it('shows never-changed state cleanly when password change count is 0', async () => {
    const createdIso = '2026-11-05T08:00:00';
    settingsService.getAccountCreated.mockResolvedValue({
      data: { accountCreatedAt: createdIso },
    });
    settingsService.getPasswordHistory.mockResolvedValue({
      data: { lastChangedAt: null, changeCount: 0 },
    });

    render(
      <MemoryRouter initialEntries={['/your-activity?tab=history']}>
        <AuthProvider>
          <ToastProvider>
            <YourActivityPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('You have not changed your password yet.')).toBeInTheDocument();
      expect(screen.getByText('Never changed')).toBeInTheDocument();
    });
  });
});

