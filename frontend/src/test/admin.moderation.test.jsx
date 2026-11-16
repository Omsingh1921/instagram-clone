import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AdminConsoleSidebar from '../components/admin/AdminConsoleSidebar';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import adminService from '../services/admin.service';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/admin.service', () => ({
  default: {
    getStats: vi.fn(),
    getReports: vi.fn(),
    resolveReport: vi.fn(),
  },
}));

const sampleReports = [
  {
    id: 'rep-uuid-1001',
    targetId: 'post-uuid-5555',
    targetType: 'POST',
    status: 'OPEN',
    reasonCode: 'SPAM',
    description: 'Repeated promotional spam links in caption.',
    reporter: { username: 'alice_mod' },
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: 'rep-uuid-1002',
    targetId: 'reel-uuid-7777',
    targetType: 'REEL',
    status: 'RESOLVED',
    reasonCode: 'HARASSMENT',
    description: 'Abusive comments targeted at creator.',
    reporter: { username: 'bob_user' },
    action: 'WARN_USER',
    reviewer: { username: 'admin_lead' },
    resolutionNotes: 'Issued official community guideline warning.',
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
    resolvedAt: new Date(Date.now() - 1800_000).toISOString(),
  },
];

const LocationTracker = ({ onLocation }) => {
  const location = useLocation();
  onLocation(`${location.pathname}${location.search}`);
  return null;
};

describe('Admin Console Consolidated Moderation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getStats.mockResolvedValue({ data: { openReports: 4 } });
    adminService.getReports.mockResolvedValue({ data: { content: sampleReports } });
    adminService.resolveReport.mockResolvedValue({ data: { success: true } });
  });

  it('keeps Moderation as the single sidebar entry without duplicate Reports link and preserves active state across query params', async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/admin/reports']}>
        <AdminConsoleSidebar
          user={{ id: 'a-1', displayName: 'Admin', username: 'admin', role: 'ROLE_ADMIN' }}
          theme="dark"
          onToggleTheme={vi.fn()}
          onLogout={vi.fn()}
        />
      </MemoryRouter>
    );

    const moderationLink = await screen.findByRole('link', { name: /Moderation/i });
    expect(moderationLink).toHaveAttribute('href', '/admin/reports');
    expect(moderationLink).toHaveClass('active');
    expect(screen.queryByRole('link', { name: /^Reports$/i })).toBeNull();

    rerender(
      <MemoryRouter initialEntries={['/admin/reports?status=OPEN']}>
        <AdminConsoleSidebar
          user={{ id: 'a-1', displayName: 'Admin', username: 'admin', role: 'ROLE_ADMIN' }}
          theme="dark"
          onToggleTheme={vi.fn()}
          onLogout={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Moderation/i })).toHaveClass('active');
  });

  it('reads initial URL query parameters on direct load and updates query parameters when switching status or type filters', async () => {
    let currentUrl = '';

    render(
      <MemoryRouter initialEntries={['/admin/reports?status=OPEN']}>
        <ToastProvider>
          <LocationTracker
            onLocation={(url) => {
              currentUrl = url;
            }}
          />
          <Routes>
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminService.getReports).toHaveBeenCalledWith('OPEN', null, 0, 50);
    });
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-pressed', 'true');

    // Click Resolved filter pill -> updates query params and fetches RESOLVED
    fireEvent.click(screen.getByRole('button', { name: 'Resolved' }));
    await waitFor(() => {
      expect(currentUrl).toBe('/admin/reports?status=RESOLVED');
      expect(adminService.getReports).toHaveBeenCalledWith('RESOLVED', null, 0, 50);
    });

    // Change target content type -> preserves status param and adds targetType
    fireEvent.change(screen.getByLabelText('Filter reports by content type'), {
      target: { value: 'REEL' },
    });
    await waitFor(() => {
      expect(currentUrl).toContain('status=RESOLVED');
      expect(currentUrl).toContain('targetType=REEL');
      expect(adminService.getReports).toHaveBeenCalledWith('RESOLVED', 'REEL', 0, 50);
    });

    // Click All pill -> deletes status param while keeping targetType
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => {
      expect(currentUrl).toBe('/admin/reports?targetType=REEL');
      expect(adminService.getReports).toHaveBeenCalledWith(null, 'REEL', 0, 50);
    });
  });

  it('renders header metadata, balanced details, full-width reporter notes, resolution info, and 4 action handlers', async () => {
    const statsSpy = vi.fn();
    window.addEventListener('admin:stats-updated', statsSpy);

    render(
      <MemoryRouter initialEntries={['/admin/reports']}>
        <ToastProvider>
          <AdminReportsPage />
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ID: rep-uuid-1001')).toBeInTheDocument();
    });

    // Header & Details for OPEN & RESOLVED cards
    expect(screen.getByText('Target: post-uuid-5555')).toBeInTheDocument();
    expect(screen.getByText('SPAM')).toBeInTheDocument();
    expect(screen.getByText('@alice_mod')).toBeInTheDocument();
    expect(screen.getByText('Repeated promotional spam links in caption.')).toBeInTheDocument();

    // Resolution info (when available)
    expect(screen.getByText('Issued official community guideline warning.')).toBeInTheDocument();
    expect(screen.getByText('Action: WARN_USER')).toBeInTheDocument();
    expect(screen.getByText('Reviewer: @admin_lead')).toBeInTheDocument();

    // Action buttons for actionable OPEN report
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Warn User' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Takedown Content' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suspend Author' })).toBeInTheDocument();

    // Quick Dismiss works and triggers sidebar stats refresh
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => {
      expect(adminService.resolveReport).toHaveBeenCalledWith('rep-uuid-1001', {
        status: 'DISMISSED',
        action: 'NO_ACTION',
        resolutionNotes: 'Dismissed: No violation detected',
      });
      expect(statsSpy).toHaveBeenCalled();
    });

    // Warn User opens modal and submits resolution
    fireEvent.click(screen.getByRole('button', { name: 'Warn User' }));
    const notesInput = await screen.findByLabelText('Resolution Notes & Audit Log');
    fireEvent.change(notesInput, { target: { value: 'Warned for spam policy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Resolution' }));

    await waitFor(() => {
      expect(adminService.resolveReport).toHaveBeenCalledWith('rep-uuid-1001', {
        status: 'RESOLVED',
        action: 'WARN_USER',
        resolutionNotes: 'Warned for spam policy',
      });
    });

    window.removeEventListener('admin:stats-updated', statsSpy);
  });
});

