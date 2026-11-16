import React, { lazy } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import userService from '../services/user.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/notification.service', () => ({
  default: {
    getUnreadCount: vi.fn().mockResolvedValue({ data: 0 }),
  },
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
    getConversations: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      data: { id: 'u-1', username: 'test1', role: 'ROLE_USER' },
    }),
  },
}));

vi.mock('../services/websocket', () => ({
  default: {
    connected: false,
    connect: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

const HangingLazyPage = lazy(() => new Promise(() => {}));

describe('AppLayout scoped Suspense & on-demand loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u-1', username: 'test1', role: 'ROLE_USER' }));
  });

  it('keeps sidebar navigation visible while inner lazy route content suspends', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Navigation chrome renders immediately and content falls back to Skeleton (never circular spinner loader)
    expect(screen.getByRole('navigation', { name: 'Main Navigation' })).toBeInTheDocument();
    expect(screen.getByTitle('Home')).toBeInTheDocument();
    expect(screen.getByTitle('Messages')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(document.querySelector('.instagram-spinner')).toBeNull();
    expect(screen.queryByText(/authenticating/i)).not.toBeInTheDocument();
  });

  it('uses SkeletonAppShell instead of spinner loader when hydrating an uncached session', () => {
    localStorage.removeItem('user');
    userService.getCurrentUser.mockImplementationOnce(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<div>Home Ready</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(document.querySelector('.instagram-spinner')).toBeNull();
    expect(screen.queryByText(/authenticating/i)).not.toBeInTheDocument();
  });

  it('renders Search-section skeleton (pill bar, tabs, 3-col grid) when /search suspends', () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/search" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(document.querySelector('.grid.grid-cols-3')).toBeInTheDocument();
    expect(document.querySelector('.rounded-full')).toBeInTheDocument();
    expect(document.querySelector('.instagram-spinner')).toBeNull();
  });

  it('renders Messages-section skeleton matching sidebar + empty pane or thread pane', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/messages']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/messages" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Conversation rows use 64px (w-16 h-16) circular avatars and empty-state skeleton
    expect(document.querySelectorAll('.w-16.h-16.rounded-full').length).toBeGreaterThanOrEqual(6);
    expect(document.querySelector('.w-20.h-20.rounded-full')).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/messages/conv-1']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/messages/:conversationId" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Direct thread route renders chat header + message bubble skeletons instead of empty CTA
    expect(document.querySelector('.w-10.h-10.rounded-full')).toBeInTheDocument();
    expect(document.querySelector('.w-20.h-20.rounded-full')).toBeNull();
  });

  it('renders Notifications-section skeleton matching filter pills and grouped cards', () => {
    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/notifications" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(document.querySelector('.max-w-\\[780px\\]')).toBeInTheDocument();
    expect(document.querySelectorAll('.w-11.h-11.rounded-full').length).toBe(5);
    expect(document.querySelectorAll('.w-11.h-11.rounded-lg').length).toBe(3);
    expect(document.querySelectorAll('.w-20.h-8.rounded-lg').length).toBe(2);
    expect(document.querySelector('.instagram-spinner')).toBeNull();
  });

  it('renders section-matched Admin skeletons across Overview, Users table, and Content grid', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'a-1', username: 'admin', role: 'ROLE_ADMIN' }));

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(document.querySelector('.w-28.h-28.rounded-full')).toBeInTheDocument();
    unmount();

    const { unmount: unmountUsers } = render(
      <MemoryRouter initialEntries={['/admin?tab=users']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(document.querySelectorAll('.w-9.h-9.rounded-full').length).toBe(5);
    unmountUsers();

    render(
      <MemoryRouter initialEntries={['/admin?tab=content&type=POSTS']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<HangingLazyPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(document.querySelectorAll('.h-\\[180px\\]').length).toBe(6);
    expect(document.querySelector('.instagram-spinner')).toBeNull();
  });
});

