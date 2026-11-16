import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/settings/SettingsPage';
import userService from '../services/user.service';
import settingsService from '../services/settings.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
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

vi.mock('../services/session.service', () => ({
  default: {
    getActiveSessions: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue({ data: [] }),
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

describe('SettingsPage Dropdown Sections Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', 'tok');
    userService.getCurrentUser.mockResolvedValue({
      data: { id: 'u1', username: 'test', displayName: 'test1', email: 't@example.com' },
    });
    settingsService.getSettings.mockResolvedValue({ data: {} });
  });

  it('expands core groups by default and collapses secondary groups behind dropdown headers', async () => {
    renderSettings();

    const howYouUseTrigger = await screen.findByRole('button', { name: /How you use Instagram/i });
    const privacyTrigger = screen.getByRole('button', { name: /Who can see your content/i });
    const accountMgmtTrigger = screen.getByRole('button', { name: /Account management/i });

    expect(howYouUseTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(privacyTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(accountMgmtTrigger).toHaveAttribute('aria-expanded', 'false');

    // Click dropdown to expand secondary section
    fireEvent.click(privacyTrigger);
    expect(privacyTrigger).toHaveAttribute('aria-expanded', 'true');

    // Click open dropdown to collapse
    fireEvent.click(howYouUseTrigger);
    expect(howYouUseTrigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('auto-expands sections matching Search settings input', async () => {
    renderSettings();

    const privacyTrigger = await screen.findByRole('button', { name: /Who can see your content/i });
    expect(privacyTrigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.change(screen.getByPlaceholderText('Search settings...'), {
      target: { value: 'Blocked' },
    });

    expect(privacyTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('auto-expands the parent dropdown section when deep-linked via ?tab=sessions', async () => {
    renderSettings('/settings?tab=sessions');

    const appMediaTrigger = await screen.findByRole('button', { name: /Your app and media/i });
    expect(appMediaTrigger).toHaveAttribute('aria-expanded', 'true');
  });
});
