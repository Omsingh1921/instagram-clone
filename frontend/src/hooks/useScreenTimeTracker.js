import { useState, useEffect, useRef, useCallback } from 'react';
import settingsService from '../services/settings.service';

const LEADER_LOCK_KEY = 'screen_time_leader_lock';
const LEADER_TTL_MS = 12000;
const HEARTBEAT_INTERVAL_SECONDS = 60;

export function getLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tracks active foreground session time for authenticated non-admin users,
 * flushes heartbeats to `/users/me/screen-time/heartbeat`, and manages
 * break-reminder timer alerts.
 */
export function useScreenTimeTracker({ enabled = false }) {
  const [breakReminderMinutes, setBreakReminderMinutes] = useState(() => {
    const saved = Number(localStorage.getItem('break_reminder_mins') || 0);
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  });
  const [breakModalOpen, setBreakModalOpen] = useState(false);

  const tabIdRef = useRef(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const bufferedSecondsRef = useRef(0);
  const continuousSecondsRef = useRef(0);
  const breakMinutesRef = useRef(breakReminderMinutes);
  const breakModalOpenRef = useRef(false);

  useEffect(() => {
    breakMinutesRef.current = breakReminderMinutes;
  }, [breakReminderMinutes]);

  useEffect(() => {
    breakModalOpenRef.current = breakModalOpen;
  }, [breakModalOpen]);

  const tryClaimLeader = useCallback(() => {
    try {
      const now = Date.now();
      const raw = localStorage.getItem(LEADER_LOCK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tabId && parsed.tabId !== tabIdRef.current && now - (parsed.ts || 0) < LEADER_TTL_MS) {
          return false;
        }
      }
      localStorage.setItem(
        LEADER_LOCK_KEY,
        JSON.stringify({ tabId: tabIdRef.current, ts: now })
      );
      return true;
    } catch {
      return true;
    }
  }, []);

  const releaseLeader = useCallback(() => {
    try {
      const raw = localStorage.getItem(LEADER_LOCK_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.tabId === tabIdRef.current) {
        localStorage.removeItem(LEADER_LOCK_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const flushBufferedSeconds = useCallback(async ({ keepalive = false } = {}) => {
    const secondsToFlush = bufferedSecondsRef.current;
    if (secondsToFlush <= 0) return;

    const clamped = Math.min(120, Math.max(1, secondsToFlush));
    bufferedSecondsRef.current = Math.max(0, secondsToFlush - clamped);
    const usageDate = getLocalIsoDate();

    if (keepalive) {
      settingsService.flushScreenTimeKeepalive(clamped, usageDate);
      return;
    }

    try {
      await settingsService.recordScreenTimeHeartbeat(clamped, usageDate);
      window.dispatchEvent(new CustomEvent('app:screen-time-flushed'));
    } catch {
      // Restore buffered seconds on transient error without overflowing cap
      bufferedSecondsRef.current = Math.min(120, bufferedSecondsRef.current + clamped);
    }
  }, []);

  // Load persisted break reminder preference from backend user settings
  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const fetchSettings = settingsService?.getSettings?.();
    if (fetchSettings && typeof fetchSettings.then === 'function') {
      fetchSettings
        .then((res) => {
          if (!active) return;
          const data = res?.data || res;
          if (typeof data?.breakReminderMinutes === 'number') {
            setBreakReminderMinutes(data.breakReminderMinutes);
            localStorage.setItem('break_reminder_mins', String(data.breakReminderMinutes));
          }
        })
        .catch(() => {
          // Fallback silently to cached localStorage value
        });
    }

    const handleBreakSettingUpdated = (event) => {
      const nextMinutes = Number(event?.detail?.minutes ?? 0);
      const normalized = Number.isFinite(nextMinutes) && nextMinutes >= 0 ? nextMinutes : 0;
      setBreakReminderMinutes(normalized);
      continuousSecondsRef.current = 0;
      setBreakModalOpen(false);
    };

    window.addEventListener('app:break-reminder-updated', handleBreakSettingUpdated);
    return () => {
      active = false;
      window.removeEventListener('app:break-reminder-updated', handleBreakSettingUpdated);
    };
  }, [enabled]);

  // Foreground active timer + periodic heartbeat + unload/hide keepalive flush
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (!tryClaimLeader()) return;

      bufferedSecondsRef.current += 1;
      continuousSecondsRef.current += 1;

      if (bufferedSecondsRef.current >= HEARTBEAT_INTERVAL_SECONDS) {
        flushBufferedSeconds();
      }

      const limitMinutes = breakMinutesRef.current;
      if (
        limitMinutes > 0 &&
        !breakModalOpenRef.current &&
        continuousSecondsRef.current >= limitMinutes * 60
      ) {
        breakModalOpenRef.current = true;
        setBreakModalOpen(true);
      }
    };

    const intervalId = setInterval(tick, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushBufferedSeconds({ keepalive: true });
        releaseLeader();
      }
    };

    const handlePageHide = () => {
      flushBufferedSeconds({ keepalive: true });
      releaseLeader();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (bufferedSecondsRef.current > 0) {
        flushBufferedSeconds({ keepalive: true });
      }
      releaseLeader();
    };
  }, [enabled, flushBufferedSeconds, releaseLeader, tryClaimLeader]);

  const dismissBreakReminder = useCallback(() => {
    continuousSecondsRef.current = 0;
    breakModalOpenRef.current = false;
    setBreakModalOpen(false);
  }, []);

  return {
    breakReminderMinutes,
    breakModalOpen,
    dismissBreakReminder,
  };
}

export default useScreenTimeTracker;
