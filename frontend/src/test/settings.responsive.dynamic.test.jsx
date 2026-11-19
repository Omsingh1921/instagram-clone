import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
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

describe('Settings Dynamic Responsive Phone Web & PC Web Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', 'tok');
    userService.getCurrentUser.mockResolvedValue({
      data: { id: 'u1', username: 'ram', displayName: 'Ram Developer', email: 'ram@example.com' },
    });
    settingsService.getSettings.mockResolvedValue({ data: {} });
    window.innerWidth = 1024;
  });

  it('renders 2-column desktop layout on PC web with sidebar navigation and main content pane', async () => {
    window.innerWidth = 1024;
    renderSettings();

    // Nav sidebar present
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search settings...')).toBeInTheDocument();

    // Content pane present with Edit Profile section
    expect(screen.getByRole('heading', { name: 'Edit Profile' })).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('adapts dynamically to mobile phone web with subnav, quick pills tray, and back to menu navigation', async () => {
    // Set to mobile viewport
    window.innerWidth = 390;

    renderSettings('/settings?tab=profile');

    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Mobile subnav header rendered with Back to Settings button
    const backBtn = await screen.findByRole('button', { name: /Back to Settings menu/i });
    expect(backBtn).toBeInTheDocument();

    // Mobile quick-switch pills tray rendered
    const pillsTray = document.querySelector('.settings-mobile-pills-tray');
    expect(pillsTray).toBeInTheDocument();

    // Pills for tabs exist
    const notifPills = screen.getAllByRole('tab', { name: /Notifications/i });
    expect(notifPills.length).toBeGreaterThan(0);

    // Click Notifications pill to switch tab directly on phone web
    act(() => {
      fireEvent.click(notifPills[0]);
    });

    // Heading in subnav updates to Notifications
    const subnavTitle = document.querySelector('.settings-mobile-subnav-title');
    expect(subnavTitle).toHaveTextContent('Notifications');

    // Click < Settings back button to return to Settings Hub menu on mobile
    const currentBackBtn = screen.getByRole('button', { name: /Back to Settings menu/i });
    act(() => {
      fireEvent.click(currentBackBtn);
    });

    // Full Mobile Hub is now visible with "Settings and privacy"
    expect(screen.getByText('Settings and privacy')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search settings...')).toBeInTheDocument();

    // Verify category section headers are clean section labels (not accordion buttons)
    const sectionHeaders = document.querySelectorAll('.settings-mobile-section-header');
    expect(sectionHeaders.length).toBeGreaterThan(0);
    expect(document.querySelector('.is-mobile-hub .settings-nav-group-trigger')).toBeNull();

    // Tapping a setting from the hub navigates back to detail view
    const profileItem = screen.getByRole('button', { name: /Edit Profile/i });
    act(() => {
      fireEvent.click(profileItem);
    });

    // Returned to detail view with Back to Settings button
    expect(screen.getByRole('button', { name: /Back to Settings menu/i })).toBeInTheDocument();
    expect(document.querySelector('.settings-mobile-subnav-title')).toHaveTextContent('Edit Profile');
  });

  it('verifies SettingsPage.css has comprehensive desktop and mobile responsive rules', () => {
    const cssPath = path.resolve(__dirname, '../pages/settings/SettingsPage.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Desktop only hides mobile subnav and pills
    expect(cssContent).toMatch(/@media\s*\(min-width:\s*769px\)\s*\{[\s\S]*\.settings-mobile-subnav,[\s\S]*\.settings-mobile-pills-tray[\s\S]*display:\s*none\s*!important;/);

    // Mobile max-width: 768px rules
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{/);
    expect(cssContent).toMatch(/\.settings-mobile-pills-tray\s*\{[\s\S]*overflow-x:\s*auto;/);
    expect(cssContent).toMatch(/\.settings-mobile-pill-btn\.active\s*\{[\s\S]*background:/);
    expect(cssContent).toMatch(/\.settings-nav-pane\.is-mobile-hub/);
    expect(cssContent).toMatch(/calc\(76px\s*\+\s*env\(safe-area-inset-bottom/);

    // Small mobile max-width: 480px rules
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*\.settings-profile-card\s*\{[\s\S]*flex-direction:\s*column;/);
  });
});
