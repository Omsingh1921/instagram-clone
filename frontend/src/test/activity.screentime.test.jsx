import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import YourActivityPage from '../pages/activity/YourActivityPage';
import useScreenTimeTracker from '../hooks/useScreenTimeTracker';
import settingsService from '../services/settings.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/settings.service', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getScreenTime: vi.fn(),
    recordScreenTimeHeartbeat: vi.fn(),
    flushScreenTimeKeepalive: vi.fn(),
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
    getArchivedStories: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

function TrackerHarness({ enabled = true }) {
  const { breakReminderMinutes, breakModalOpen, dismissBreakReminder } = useScreenTimeTracker({ enabled });
  return (
    <div>
      <span data-testid="break-mins">{breakReminderMinutes}</span>
      <span data-testid="break-open">{String(breakModalOpen)}</span>
      <button type="button" onClick={dismissBreakReminder}>
        Dismiss Break
      </button>
    </div>
  );
}

describe('Real Screen Time Tracking & Break Reminder Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('access_token', 'mock-jwt');
    localStorage.setItem('user', JSON.stringify({ id: 'u-1', username: 'alice', role: 'ROLE_USER' }));
    settingsService.getSettings.mockResolvedValue({ data: { breakReminderMinutes: 0 } });
    settingsService.updateSettings.mockResolvedValue({ data: { breakReminderMinutes: 20 } });
    settingsService.recordScreenTimeHeartbeat.mockResolvedValue({
      data: { usageDate: '2026-11-12', todaySeconds: 60, todayMinutes: 1 },
    });
    settingsService.getScreenTime.mockResolvedValue({
      data: {
        daysRequested: 7,
        dailyAverageMinutes: 19,
        todayMinutes: 25,
        breakReminderMinutes: 10,
        dailyBreakdown: [
          { date: '2026-11-06', dayLabel: 'Fri', minutes: 10, seconds: 600 },
          { date: '2026-11-07', dayLabel: 'Sat', minutes: 15, seconds: 900 },
          { date: '2026-11-08', dayLabel: 'Sun', minutes: 20, seconds: 1200 },
          { date: '2026-11-09', dayLabel: 'Mon', minutes: 18, seconds: 1080 },
          { date: '2026-11-10', dayLabel: 'Tue', minutes: 22, seconds: 1320 },
          { date: '2026-11-11', dayLabel: 'Wed', minutes: 23, seconds: 1380 },
          { date: '2026-11-12', dayLabel: 'Thu', minutes: 25, seconds: 1500 },
        ],
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads real 7-day screen time metrics on YourActivityPage Time spent tab and persists break reminder to backend', async () => {
    const breakEventSpy = vi.fn();
    window.addEventListener('app:break-reminder-updated', breakEventSpy);

    render(
      <MemoryRouter initialEntries={['/your-activity?tab=time']}>
        <AuthProvider>
          <ToastProvider>
            <YourActivityPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(settingsService.getScreenTime).toHaveBeenCalledWith(7, expect.any(String));
      expect(screen.getByText('19m')).toBeInTheDocument();
      expect(screen.getByText('Today: 25m')).toBeInTheDocument();
    });

    expect(screen.getByTitle('Thu (2026-11-12): 25m')).toBeInTheDocument();

    const reminderSelect = screen.getByLabelText('Set reminder to take breaks');
    await waitFor(() => {
      expect(reminderSelect).toHaveValue('10');
    });

    fireEvent.change(reminderSelect, { target: { value: '20' } });

    await waitFor(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledWith({ breakReminderMinutes: 20 });
      expect(localStorage.getItem('break_reminder_mins')).toBe('20');
    });
    expect(breakEventSpy).toHaveBeenCalled();

    window.removeEventListener('app:break-reminder-updated', breakEventSpy);
  });

  it('tracks visible active seconds, flushes 60s heartbeats, and opens break reminder modal when threshold is reached', async () => {
    vi.useFakeTimers();
    localStorage.setItem('break_reminder_mins', '1'); // 1 minute simulated preference for fast timer verification
    settingsService.getSettings.mockResolvedValueOnce({ data: { breakReminderMinutes: 1 } });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });

    render(<TrackerHarness enabled={true} />);

    // Advance 59 seconds -> no heartbeat yet, modal closed
    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    expect(settingsService.recordScreenTimeHeartbeat).not.toHaveBeenCalled();
    expect(screen.getByTestId('break-open').textContent).toBe('false');

    // Advance 1 more second (60s total) -> flushes heartbeat AND opens break reminder
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(settingsService.recordScreenTimeHeartbeat).toHaveBeenCalledWith(60, expect.any(String));
    expect(screen.getByTestId('break-open').textContent).toBe('true');

    // Dismissing resets counter and closes modal
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Break' }));
    expect(screen.getByTestId('break-open').textContent).toBe('false');
  });
});

