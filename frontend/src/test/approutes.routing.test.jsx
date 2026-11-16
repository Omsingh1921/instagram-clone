import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CallProvider } from '../context/CallContext';
import { UploadProvider } from '../context/UploadContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import AppRoutes from '../routes/AppRoutes';
import feedService from '../services/feed.service';
import storyService from '../services/story.service';
import userService from '../services/user.service';
import chatService from '../services/chat.service';
import followService from '../services/follow.service';

vi.mock('../services/notification.service', () => ({
  default: { getUnreadCount: vi.fn().mockResolvedValue({ data: 0 }) },
}));

vi.mock('../services/settings.service', () => ({
  default: {
    getSettings: vi.fn().mockResolvedValue({ data: { breakReminderMinutes: 0 } }),
    recordScreenTimeHeartbeat: vi.fn().mockResolvedValue({ data: {} }),
    flushScreenTimeKeepalive: vi.fn(),
  },
}));

vi.mock('../services/chat.service', () => ({
  default: { getConversations: vi.fn().mockResolvedValue({ data: { content: [] } }) },
}));

vi.mock('../services/follow.service', () => ({
  default: { getFollowing: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      data: { id: 'u-1', username: 'test1', role: 'ROLE_USER' },
    }),
    getSuggestedUsers: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/feed.service', () => ({
  default: {
    getHomeFeed: vi.fn().mockResolvedValue({ data: { content: [] } }),
    getExploreFeed: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getStoryFeed: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/admin.service', () => ({
  default: {
    getDashboardOverview: vi.fn().mockResolvedValue({ data: {} }),
    getStats: vi.fn().mockResolvedValue({ data: {} }),
    getUsers: vi.fn().mockResolvedValue({ data: { content: [], totalPages: 0 } }),
  },
}));

vi.mock('../services/websocket', () => ({
  default: {
    connected: false,
    connect: vi.fn(),
    subscribe: vi.fn(() => () => { }),
    disconnect: vi.fn(),
  },
}));

function renderAppAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>
          <CallProvider>
            <UploadProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </UploadProvider>
          </CallProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AppRoutes nested route resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u-1', username: 'test1', role: 'ROLE_USER' }));
  });

  it('mounts HomePage inside main and triggers home feed & suggestions at /', async () => {
    const { container } = renderAppAt('/');

    await waitFor(
      () => {
        expect(container.querySelector('main.app-main-content .home-page-container')).not.toBeNull();
        expect(feedService.getHomeFeed).toHaveBeenCalled();
        expect(storyService.getStoryFeed).toHaveBeenCalled();
        expect(userService.getSuggestedUsers).toHaveBeenCalled();
        expect(chatService.getConversations).toHaveBeenCalledWith(0, 25);
        expect(followService.getFollowing).toHaveBeenCalledWith('u-1', 0, 25);
      },
      { timeout: 5000 }
    );
  });

  it('mounts ExplorePage inside main at /explore', async () => {
    const { container } = renderAppAt('/explore');

    await waitFor(
      () => {
        expect(container.querySelector('main.app-main-content .explore-page-container')).not.toBeNull();
        expect(feedService.getExploreFeed).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
  });

  it('redirects unknown authenticated routes back to HomePage at /', async () => {
    const { container } = renderAppAt('/non-existent-route');

    await waitFor(
      () => {
        expect(container.querySelector('main.app-main-content .home-page-container')).not.toBeNull();
        expect(feedService.getHomeFeed).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
  });

  it('mounts AdminRoutes inside main at /admin for admin users', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'a-1', username: 'admin', role: 'ROLE_ADMIN' }));
    renderAppAt('/admin');

    expect(await screen.findByText(/Good (Morning|Afternoon|Evening)/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('renders LoginPage eagerly for unauthenticated users at /login without route-chunk skeleton delay', () => {
    localStorage.clear();
    renderAppAt('/login');

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
});
