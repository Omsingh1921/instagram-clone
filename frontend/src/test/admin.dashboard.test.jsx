import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminConsoleSidebar from '../components/admin/AdminConsoleSidebar';
import adminService from '../services/admin.service';
import { ToastProvider } from '../context/ToastContext';

// Mock adminService
vi.mock('../services/admin.service', () => ({
  default: {
    getStats: vi.fn(),
    getUsers: vi.fn(),
    getActivity: vi.fn(),
    getContent: vi.fn(),
    deleteContent: vi.fn(),
    updateUserStatus: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const mockStats = {
  totalUsers: 1420,
  activeUsers: 1390,
  suspendedUsers: 25,
  deactivatedUsers: 5,
  totalPosts: 8520,
  totalComments: 31200,
  totalReels: 4210,
  activeStories: 340,
  totalStories: 640,
  totalReports: 78,
  openReports: 12,
  reviewedReports: 14,
  resolvedReports: 45,
  dismissedReports: 7,
  actionedThisWeek: 24,
  periodDays: 7,
  usersGrowthPercent: 5.2,
  postsGrowthPercent: 7.8,
  reelsGrowthPercent: 12.6,
  storiesGrowthPercent: 9.1,
  totalLikes: 124305,
  likesGrowthPercent: 10.4,
  totalEngagementComments: 18942,
  commentsGrowthPercent: 8.7,
  totalShares: 7530,
  sharesGrowthPercent: 11.9,
  totalSaves: 9287,
  savesGrowthPercent: 6.3,
  growthSeries: [
    { date: '2026-10-04', label: 'Oct 4', users: 10, posts: 25, reels: 8, stories: 12, likes: 100, comments: 20, engagement: 150 },
    { date: '2026-10-10', label: 'Oct 10', users: 24, posts: 42, reels: 16, stories: 19, likes: 240, comments: 48, engagement: 320 },
  ],
};

const mockActivity = [
  {
    id: 'post-1',
    type: 'POST_CREATED',
    actionText: 'created a new post',
    actor: { id: 'u1', username: 'alice_creator', avatarUrl: null },
    createdAt: '2026-10-10T11:50:00Z',
  },
];

const mockContentPage = {
  content: [
    {
      id: 'c-1',
      contentType: 'POST',
      author: { id: 'u1', username: 'alice_creator', avatarUrl: null },
      caption: 'Evening sunset shot',
      likesCount: 42,
      commentsCount: 5,
      createdAt: '2026-10-10T11:45:00Z',
    },
  ],
  totalPages: 1,
  totalElements: 1,
};

const mockUsersPage = {
  content: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      username: 'john_doe',
      displayName: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
      role: 'ROLE_USER',
      status: 'ACTIVE',
      createdAt: '2026-10-10T12:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      username: 'sarah_admin',
      displayName: 'Sarah Admin',
      email: 'sarah@example.com',
      emailVerified: true,
      role: 'ROLE_ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-10-01T12:00:00Z',
    },
  ],
  totalPages: 1,
  totalElements: 2,
};

describe('Admin Dashboard & User Management Suite', () => {
  let confirmSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getStats.mockResolvedValue({ data: mockStats });
    adminService.getUsers.mockResolvedValue({ data: mockUsersPage });
    adminService.getActivity.mockResolvedValue({ data: mockActivity });
    adminService.getContent.mockResolvedValue({ data: mockContentPage });
    confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <AdminDashboardPage />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders Admin Dashboard overview and loads system KPI metrics cards', async () => {
    renderComponent();

    expect(screen.getByText('Admin Control Center')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overview & Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /User Management/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(adminService.getStats).toHaveBeenCalled();
      expect(screen.getByText('1,420')).toBeInTheDocument(); // Total users
      expect(screen.getByText('8,520')).toBeInTheDocument(); // Total posts
      expect(screen.getByText('4,210')).toBeInTheDocument(); // Total reels
      expect(screen.getByText('78')).toBeInTheDocument();    // Total reports
    });
  });

  it('switches to User Management tab and loads user list table', async () => {
    renderComponent();

    const usersTab = screen.getByRole('button', { name: /User Management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalled();
      expect(screen.getByText('@john_doe')).toBeInTheDocument();
      expect(screen.getByText('@sarah_admin')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('suspends an active user when Suspend button is clicked', async () => {
    adminService.updateUserStatus.mockResolvedValue({ success: true });
    renderComponent();

    const usersTab = screen.getByRole('button', { name: /User Management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('@john_doe')).toBeInTheDocument();
    });

    const suspendButtons = screen.getAllByRole('button', { name: /Suspend/i });
    fireEvent.click(suspendButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(within(dialog).getByText('Suspend Account?')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /^Suspend$/i }));

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        expect.objectContaining({ status: 'SUSPENDED' })
      );
    });
  });

  it('does not render Make Admin role toggle controls in User Management', async () => {
    renderComponent();

    const usersTab = screen.getByRole('button', { name: /User Management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('@john_doe')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Make Admin/i })).toBeNull();
    expect(adminService.updateUserRole).toBeUndefined();
  });

  it('renders Platform Growth chart, Content Distribution donut, Engagement Metrics, Live Activity and Quick Actions', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Platform Growth')).toBeInTheDocument();
      expect(screen.getByText('Content Distribution')).toBeInTheDocument();
      expect(screen.getByText('Moderation Overview')).toBeInTheDocument();
      expect(screen.getByText('Recent User Activity')).toBeInTheDocument();
      expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText((124305).toLocaleString())).toBeInTheDocument();
      expect(screen.getByText('alice_creator')).toBeInTheDocument();
    });

    // Change period selector triggers updated backend stats query
    const rangeSelect = screen.getByLabelText(/Analytics time range/i);
    fireEvent.change(rangeSelect, { target: { value: '30' } });

    await waitFor(() => {
      expect(adminService.getStats).toHaveBeenCalledWith(30);
    });
  });

  it('switches to Content Explorer tab and loads platform posts with removal capability', async () => {
    adminService.deleteContent.mockResolvedValue({ success: true });
    renderComponent();

    const contentTab = screen.getByRole('button', { name: /Content Explorer/i });
    fireEvent.click(contentTab);

    await waitFor(() => {
      expect(adminService.getContent).toHaveBeenCalledWith('POSTS', '', 0, 18);
      expect(screen.getByText('Evening sunset shot')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    const cancelDialog = await screen.findByRole('dialog');
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(within(cancelDialog).getByText('Remove Post?')).toBeInTheDocument();
    expect(within(cancelDialog).getByText(/Remove this post by @alice_creator\?/i)).toBeInTheDocument();

    fireEvent.click(within(cancelDialog).getByRole('button', { name: /^Cancel$/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(adminService.deleteContent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    const confirmDialog = await screen.findByRole('dialog');
    fireEvent.click(within(confirmDialog).getByRole('button', { name: /^Remove$/i }));

    await waitFor(() => {
      expect(adminService.deleteContent).toHaveBeenCalledWith('POST', 'c-1');
    });
  });

  it('removes My Profile from the AdminConsoleSidebar account popover while keeping theme, switch accounts, and logout', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminConsoleSidebar
          user={{ id: 'admin-1', displayName: 'System Administrator', username: 'admin', role: 'ROLE_ADMIN' }}
          theme="dark"
          onToggleTheme={vi.fn()}
          onLogout={vi.fn()}
          onOpenSwitchAccounts={vi.fn()}
        />
      </MemoryRouter>
    );

    const profileTrigger = await screen.findByRole('button', { name: /System Administrator/i });
    expect(screen.queryByRole('button', { name: /^Analytics$/i })).toBeNull();
    fireEvent.click(profileTrigger);

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.queryByText(/My Profile/i)).toBeNull();
    expect(screen.getByText('Light Theme')).toBeInTheDocument();
    expect(screen.getByText('Switch Accounts')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('renders section-matched skeletons inside User Management table and Content Explorer grid', async () => {
    adminService.getUsers.mockImplementationOnce(() => new Promise(() => {}));
    adminService.getContent.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /User Management/i }));
    await waitFor(() => {
      expect(container.querySelectorAll('.users-table-container .w-9.h-9.rounded-full').length).toBe(6);
    });

    fireEvent.click(screen.getByRole('button', { name: /Content Explorer/i }));
    await waitFor(() => {
      expect(container.querySelectorAll('.h-\\[180px\\]').length).toBe(6);
    });
  });

  it('keeps static overview labels visible and renders sized data skeletons while stats load', async () => {
    adminService.getStats.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Platform Growth')).toBeInTheDocument();
      expect(screen.getByText('Content Distribution')).toBeInTheDocument();
      expect(screen.getByText('Moderation Overview')).toBeInTheDocument();
      expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(container.querySelectorAll('.kpi-value .animate-pulse').length).toBe(4);
    expect(container.querySelectorAll('.kpi-delta-row .animate-pulse').length).toBe(5);
    expect(container.querySelectorAll('.admin-analytics-grid .animate-pulse').length).toBeGreaterThanOrEqual(12);
    expect(container.querySelectorAll('.engagement-metric-right .animate-pulse').length).toBe(8);
  });
});
