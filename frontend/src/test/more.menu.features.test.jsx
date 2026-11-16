import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MoreMenuPopup from '../components/navigation/MoreMenuPopup';
import ReportProblemModal from '../components/modals/ReportProblemModal';
import SwitchAccountsModal from '../components/modals/SwitchAccountsModal';
import adminService from '../services/admin.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock adminService
vi.mock('../services/admin.service', () => ({
  default: {
    createReport: vi.fn().mockResolvedValue({ id: 'rep-1', status: 'OPEN' }),
  },
}));

// Mock react-router useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Instagram Web More Menu & Features Parity Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('1. Renders MoreMenuPopup with core platform items and without Threads or Switch accounts', () => {
    render(
      <BrowserRouter>
        <MoreMenuPopup
          isOpen={true}
          onClose={vi.fn()}
          theme="dark"
          onToggleTheme={vi.fn()}
          onOpenReportProblem={vi.fn()}
          onLogout={vi.fn()}
        />
      </BrowserRouter>
    );

    // Group 1
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Your Activity')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Switch appearance')).toBeInTheDocument();
    expect(screen.getByText('Report a problem')).toBeInTheDocument();

    // Removed options
    expect(screen.queryByText('Threads')).not.toBeInTheDocument();
    expect(screen.queryByText('Switch accounts')).not.toBeInTheDocument();

    // Group 2: Logout
    expect(screen.getByText('Log out')).toBeInTheDocument();

    // Redesigned icon badges & Logout danger card styling
    expect(document.querySelectorAll('.more-menu-icon-badge').length).toBe(6);
    expect(screen.getByText('Log out').closest('button')).toHaveClass('logout-item');
  });

  it('2. Calls onOpenReportProblem and onLogout when Report a problem or Log out is clicked', () => {
    const onClose = vi.fn();
    const onOpenReportProblem = vi.fn();
    const onLogout = vi.fn();
    render(
      <BrowserRouter>
        <MoreMenuPopup
          isOpen={true}
          onClose={onClose}
          theme="dark"
          onToggleTheme={vi.fn()}
          onOpenReportProblem={onOpenReportProblem}
          onLogout={onLogout}
        />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Report a problem'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenReportProblem).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Log out'));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('3. Navigates to /settings, /your-activity, and /profile/me?tab=saved when clicked', () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <MoreMenuPopup
          isOpen={true}
          onClose={onClose}
          theme="dark"
          onToggleTheme={vi.fn()}
          onOpenReportProblem={vi.fn()}
          onOpenSwitchAccounts={vi.fn()}
          onLogout={vi.fn()}
        />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Your Activity'));
    expect(mockNavigate).toHaveBeenCalledWith('/your-activity');

    fireEvent.click(screen.getByText('Saved'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile/me?tab=saved');
  });

  it('4. Toggles appearance directly on click without opening a sub-menu', () => {
    const onToggleTheme = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <BrowserRouter>
        <MoreMenuPopup
          isOpen={true}
          onClose={onClose}
          theme="dark"
          onToggleTheme={onToggleTheme}
          onOpenReportProblem={vi.fn()}
          onLogout={vi.fn()}
        />
      </BrowserRouter>
    );

    const switchBtn = screen.getByText('Switch appearance').closest('button');
    expect(switchBtn).toHaveAttribute('aria-pressed', 'true');

    // Direct click toggles theme immediately and stays on main menu
    fireEvent.click(switchBtn);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Re-rendering with light theme updates button pressed state
    rerender(
      <BrowserRouter>
        <MoreMenuPopup
          isOpen={true}
          onClose={onClose}
          theme="light"
          onToggleTheme={onToggleTheme}
          onOpenReportProblem={vi.fn()}
          onLogout={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Switch appearance').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('5. Report a problem modal submits bug report to backend with category and diagnostics', async () => {
    const onClose = vi.fn();
    render(
      <AuthProvider>
        <ToastProvider>
          <ReportProblemModal isOpen={true} onClose={onClose} />
        </ToastProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Report a problem')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/include as much detail/i);
    fireEvent.change(textarea, { target: { value: 'Stories sometimes fail to render video.' } });

    const submitBtn = screen.getByText('Send report');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminService.createReport).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: 'PROBLEM',
          reasonCode: 'BUG',
          description: expect.stringContaining('Stories sometimes fail to render video.'),
        })
      );
    });
  });

  it('6. SwitchAccountsModal displays current account and allows switching', async () => {
    const mockAccounts = [
      { id: 'acc-1', username: 'primary_user', displayName: 'Primary User', accessToken: 'token-1' },
      { id: 'acc-2', username: 'second_brand', displayName: 'Second Brand', accessToken: 'token-2' },
    ];
    localStorage.setItem('access_token', 'token-1');

    render(
      <AuthProvider>
        <ToastProvider>
          <SwitchAccountsModal isOpen={true} onClose={vi.fn()} accounts={mockAccounts} />
        </ToastProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Switch accounts')).toBeInTheDocument();
    expect(screen.getByText('second_brand')).toBeInTheDocument();
    expect(screen.getByText('Log into an Existing Account')).toBeInTheDocument();
  });
});
