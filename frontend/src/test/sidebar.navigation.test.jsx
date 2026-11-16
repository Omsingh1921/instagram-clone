import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';

const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-42',
      username: 'alex_dev',
      role: 'ROLE_USER',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    isAuthenticated: true,
    logout: mockLogout,
  }),
}));

vi.mock('../services/notification.service', () => ({
  default: { getUnreadCount: vi.fn().mockResolvedValue({ data: 2 }) },
}));

vi.mock('../services/settings.service', () => ({
  default: {
    getSettings: vi.fn().mockResolvedValue({ data: { breakReminderMinutes: 0 } }),
    recordScreenTimeHeartbeat: vi.fn().mockResolvedValue({ data: {} }),
    flushScreenTimeKeepalive: vi.fn(),
  },
}));

vi.mock('../services/chat.service', () => ({
  default: {
    getConversations: vi.fn().mockResolvedValue({
      data: {
        content: [
          { id: 'c-1', unreadCount: 3 },
          { id: 'c-2', unreadCount: 0 },
        ],
      },
    }),
  },
}));

vi.mock('../services/websocket', () => ({
  default: {
    connected: false,
    subscribe: vi.fn(() => () => {}),
  },
}));

function renderSidebarLayout({ initialPath = '/', onOutletRender } = {}) {
  const OutletSpy = () => {
    if (onOutletRender) onOutletRender();
    return <div data-testid="outlet-content">Feed Content</div>;
  };

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<OutletSpy />} />
          <Route path="/search" element={<div data-testid="search-page">Search</div>} />
          <Route path="/messages" element={<div data-testid="messages-page">Messages</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Collapsible Instagram Desktop Sidebar', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('defaults to collapsed 72px rail state with all nav items and unread badges preserved', async () => {
    renderSidebarLayout();

    const sidebar = document.querySelector('aside.desktop-sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).not.toHaveClass('is-expanded');
    expect(sidebar).toHaveAttribute('data-expanded', 'false');

    const sidebarQueries = within(sidebar);
    expect(sidebarQueries.getByLabelText('Instagram Home')).toBeInTheDocument();
    expect(sidebarQueries.getByTitle('Home')).toHaveAttribute('href', '/');
    expect(sidebarQueries.getByTitle('Search')).toHaveAttribute('href', '/search');
    expect(sidebarQueries.getByTitle('Reels')).toHaveAttribute('href', '/reels');
    expect(sidebarQueries.getByTitle('Messages')).toHaveAttribute('href', '/messages');
    expect(sidebarQueries.getByTitle('Notifications')).toHaveAttribute('href', '/notifications');
    expect(sidebarQueries.getByTitle('Create')).toBeInTheDocument();
    expect(sidebarQueries.getByTitle('Profile')).toHaveAttribute('href', '/profile/user-42');
    expect(sidebarQueries.getByTitle('More')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.querySelector('.nav-badge-dot')).toBeInTheDocument();
      expect(document.querySelector('.nav-badge-count')).toHaveTextContent('1');
    });
  });

  it('expands smoothly on mouseEnter and collapses automatically on mouseLeave without clicking', () => {
    renderSidebarLayout();
    const sidebar = document.querySelector('aside.desktop-sidebar');

    fireEvent.mouseEnter(sidebar);
    expect(sidebar).toHaveClass('is-expanded');
    expect(sidebar).toHaveAttribute('data-expanded', 'true');

    // Moving across child links keeps sidebar expanded without flicker
    fireEvent.mouseOver(screen.getByTitle('Reels'));
    expect(sidebar).toHaveClass('is-expanded');

    fireEvent.mouseLeave(sidebar);
    expect(sidebar).not.toHaveClass('is-expanded');
    expect(sidebar).toHaveAttribute('data-expanded', 'false');
  });

  it('does not unnecessarily re-render outlet route content when sidebar hovers in and out', async () => {
    let outletRenderCount = 0;
    renderSidebarLayout({
      onOutletRender: () => {
        outletRenderCount += 1;
      },
    });

    await waitFor(() => {
      expect(document.querySelector('.nav-badge-dot')).toBeInTheDocument();
    });
    const baselineRenders = outletRenderCount;

    const sidebar = document.querySelector('aside.desktop-sidebar');
    fireEvent.mouseEnter(sidebar);
    expect(sidebar).toHaveClass('is-expanded');

    fireEvent.mouseLeave(sidebar);
    expect(sidebar).not.toHaveClass('is-expanded');

    expect(outletRenderCount).toBe(baselineRenders);
  });

  it('keeps expanded state while More popup is open and preserves Create modal action', async () => {
    renderSidebarLayout();
    const sidebar = document.querySelector('aside.desktop-sidebar');

    fireEvent.click(screen.getByTitle('More'));
    expect(sidebar).toHaveClass('is-expanded');
    await waitFor(() => {
      expect(screen.getByText('Switch appearance')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(sidebar);
    expect(sidebar).toHaveClass('is-expanded');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(sidebar).not.toHaveClass('is-expanded');
    });
  });

  it('uses tap/click toggle on touch devices instead of mouse hover', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('hover: none') || query.includes('pointer: coarse'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    renderSidebarLayout();
    const sidebar = document.querySelector('aside.desktop-sidebar');

    // Hover does not expand on touch devices
    fireEvent.mouseEnter(sidebar);
    expect(sidebar).not.toHaveClass('is-expanded');

    // Dedicated touch toggle expands and collapses on tap
    const touchToggle = screen.getByRole('button', { name: 'Expand sidebar' });
    fireEvent.click(touchToggle);
    expect(sidebar).toHaveClass('is-expanded');
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();

    // Tapping outside collapses touch-expanded sidebar
    fireEvent.mouseDown(screen.getByTestId('outlet-content'));
    expect(sidebar).not.toHaveClass('is-expanded');
  });

  it('opens More menu automatically on hover, stays open inside popup, and closes after short delay when mouse leaves', async () => {
    // Pre-warm lazy MoreMenuPopup chunk once before timer checks
    await import('../components/navigation/MoreMenuPopup');
    renderSidebarLayout();

    const moreButton = screen.getByTitle('More');
    const hoverZone = moreButton.closest('.sidebar-more-hover-zone');

    // Hovering More opens popup without clicking
    fireEvent.mouseEnter(moreButton);

    const popup = await waitFor(() => {
      const menu = document.querySelector('.more-popup-menu-container');
      expect(menu).toBeInTheDocument();
      return menu;
    });

    // Core 6 options remain intact; Threads and Switch accounts are removed
    for (const label of [
      'Settings',
      'Your Activity',
      'Saved',
      'Switch appearance',
      'Report a problem',
      'Log out',
    ]) {
      expect(within(popup).getByText(label)).toBeInTheDocument();
    }
    expect(within(popup).queryByText('Threads')).not.toBeInTheDocument();
    expect(within(popup).queryByText('Switch accounts')).not.toBeInTheDocument();

    vi.useFakeTimers();

    // Moving across trigger and popup cancels close delay and prevents flicker
    fireEvent.mouseLeave(hoverZone);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(document.querySelector('.more-popup-menu-container')).toBeInTheDocument();

    fireEvent.mouseEnter(popup);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(document.querySelector('.more-popup-menu-container')).toBeInTheDocument();

    // Leaving both closes after ~180ms delay
    fireEvent.mouseLeave(hoverZone);
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(document.querySelector('.more-popup-menu-container')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(document.querySelector('.more-popup-menu-container')).not.toBeInTheDocument();
  });

  it('preserves touch click-to-toggle and supports keyboard Escape on More menu', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('hover: none') || query.includes('pointer: coarse'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { unmount } = renderSidebarLayout();
    const moreButton = screen.getByTitle('More');

    // Touch devices do not open More on hover
    fireEvent.mouseEnter(moreButton);
    expect(document.querySelector('.more-popup-menu-container')).not.toBeInTheDocument();

    // Touch tap toggles open and closed cleanly
    fireEvent.click(moreButton);
    await waitFor(() => {
      expect(document.querySelector('.more-popup-menu-container')).toBeInTheDocument();
    });

    fireEvent.mouseDown(moreButton);
    fireEvent.click(moreButton);
    await waitFor(() => {
      expect(document.querySelector('.more-popup-menu-container')).not.toBeInTheDocument();
    });

    // Keyboard ArrowDown opens menu and moves focus into menu, Escape closes and restores focus
    moreButton.focus();
    fireEvent.keyDown(moreButton, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(document.querySelector('.more-popup-menu-container')).toBeInTheDocument();
    });

    const firstItem = document.querySelector('.more-popup-menu-container .more-menu-item');
    firstItem.focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(document.querySelector('.more-popup-menu-container')).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(moreButton);

    unmount();
  });

  it('constrains desktop sidebar to 100dvh with scrollable middle nav and pinned More footer', () => {
    renderSidebarLayout();

    const sidebar = document.querySelector('aside.desktop-sidebar');
    const brandZone = sidebar.querySelector('.sidebar-brand-zone');
    const navList = sidebar.querySelector('.sidebar-nav-list');
    const footer = sidebar.querySelector('.sidebar-footer');

    expect(brandZone).toBeInTheDocument();
    expect(navList).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(within(footer).getByTitle('More')).toBeInTheDocument();

    const fs = require('node:fs');
    const path = require('node:path');
    const appLayoutCss = fs.readFileSync(
      path.resolve(__dirname, '../layouts/AppLayout.css'),
      'utf8'
    );
    const morePopupCss = fs.readFileSync(
      path.resolve(__dirname, '../components/navigation/MoreMenuPopup.css'),
      'utf8'
    );

    expect(appLayoutCss).toMatch(/\.desktop-sidebar\s*\{[\s\S]*height:\s*100dvh;/);
    expect(appLayoutCss).toMatch(/\.sidebar-nav-list\s*\{[\s\S]*flex:\s*1;[\s\S]*min-height:\s*0;[\s\S]*overflow-y:\s*auto;/);
    expect(appLayoutCss).toMatch(/\.sidebar-footer\s*\{[\s\S]*flex-shrink:\s*0;/);
    expect(morePopupCss).toMatch(/\.more-popup-menu-container\s*\{[\s\S]*max-height:\s*calc\(100dvh - 82px\);[\s\S]*overflow-y:\s*auto;[\s\S]*overflow-x:\s*hidden;/);
  });
});

