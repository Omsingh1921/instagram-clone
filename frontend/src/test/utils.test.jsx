import { describe, it, expect, afterEach } from 'vitest';
import { formatCount, isValidUUID, timeAgo, formatDate } from '../utils';
import {
  getNetworkQualityProfile,
  shouldPrefetchMedia,
  getAdaptiveImageUrl,
  getAdaptiveVideoUrl,
  getVideoPosterUrl,
  getBlurPlaceholderUrl,
} from '../utils/mediaUrl';

describe('Utility Functions Suite', () => {
  it('1. isValidUUID correctly validates UUID v4 strings and rejects numeric IDs', () => {
    expect(isValidUUID('c3b7a5a8-4395-4672-8822-4946631ad18e')).toBe(true);
    expect(isValidUUID('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d')).toBe(true);

    // Rejects non-UUIDs / numeric IDs
    expect(isValidUUID('1')).toBe(false);
    expect(isValidUUID('12345')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID(null)).toBe(false);
  });

  it('2. formatCount formats numbers with K, M, and plain representations', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(42)).toBe('42');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1500)).toBe('1.5K');
    expect(formatCount(1000000)).toBe('1M');
    expect(formatCount(2500000)).toBe('2.5M');
  });

  it('3. timeAgo produces expected relative time tokens', () => {
    const now = new Date();
    expect(timeAgo(now.toISOString())).toBe('just now');

    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(timeAgo(fiveMinsAgo.toISOString())).toBe('5m');

    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
    expect(timeAgo(threeHoursAgo.toISOString())).toBe('3h');

    const fourDaysAgo = new Date(now.getTime() - 4 * 86400 * 1000);
    expect(timeAgo(fourDaysAgo.toISOString())).toBe('4d');
  });

  it('4. formatDate returns readable string', () => {
    const d = new Date('2026-05-15T12:00:00Z');
    expect(formatDate(d.toISOString())).toMatch(/2026/);
    expect(formatDate('')).toBe('');
  });

  describe('Adaptive Progressive Media & Network Ping (RTT) Suite', () => {
    const originalConnection = navigator.connection;

    afterEach(() => {
      Object.defineProperty(navigator, 'connection', {
        value: originalConnection,
        configurable: true,
        writable: true,
      });
    });

    it('5. Low Ping (< 70ms / Fast 5G/Wi-Fi) yields high-res 1080p, best quality, and prefetch enabled', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { rtt: 40, downlink: 25, effectiveType: '4g', saveData: false },
        configurable: true,
      });

      const profile = getNetworkQualityProfile();
      expect(profile.quality).toBe('best');
      expect(profile.maxImageWidth).toBe(1080);
      expect(profile.isSlowNetwork).toBe(false);
      expect(profile.canPrefetch).toBe(true);
      expect(shouldPrefetchMedia()).toBe(true);

      const videoUrl = 'https://res.cloudinary.com/demo/video/upload/sample.mp4';
      const adaptedVideo = getAdaptiveVideoUrl(videoUrl);
      expect(adaptedVideo).toContain('/video/upload/q_auto:best,vc_auto/');

      const imgUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const adaptedImg = getAdaptiveImageUrl(imgUrl);
      expect(adaptedImg).toContain('w_1080');
      expect(adaptedImg).toContain('q_auto:best');
    });

    it('6. Normal Ping (70-250ms / 4G LTE) yields 720p HD streaming and prefetch enabled', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { rtt: 120, downlink: 6, effectiveType: '4g', saveData: false },
        configurable: true,
      });

      const profile = getNetworkQualityProfile();
      expect(profile.quality).toBe('good');
      expect(profile.maxImageWidth).toBe(720);
      expect(profile.isSlowNetwork).toBe(false);
      expect(profile.canPrefetch).toBe(true);
      expect(shouldPrefetchMedia()).toBe(true);

      const videoUrl = 'https://res.cloudinary.com/demo/video/upload/sample.mp4';
      const adaptedVideo = getAdaptiveVideoUrl(videoUrl);
      expect(adaptedVideo).toContain('/video/upload/q_auto:good,vc_auto,w_720/');

      const imgUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const adaptedImg = getAdaptiveImageUrl(imgUrl);
      expect(adaptedImg).toContain('w_720');
      expect(adaptedImg).toContain('q_auto:good');
    });

    it('7. High Ping (> 250ms / Slow 3G / Poor Signal) drops to 480p eco and DISABLES background prefetch', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { rtt: 350, downlink: 1.0, effectiveType: '3g', saveData: false },
        configurable: true,
      });

      const profile = getNetworkQualityProfile();
      expect(profile.quality).toBe('eco');
      expect(profile.maxImageWidth).toBe(480);
      expect(profile.isSlowNetwork).toBe(true);
      expect(profile.canPrefetch).toBe(false);
      expect(shouldPrefetchMedia()).toBe(false);

      const videoUrl = 'https://res.cloudinary.com/demo/video/upload/sample.mp4';
      const adaptedVideo = getAdaptiveVideoUrl(videoUrl);
      expect(adaptedVideo).toContain('/video/upload/q_auto:eco,vc_auto,w_480/');

      const imgUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const adaptedImg = getAdaptiveImageUrl(imgUrl);
      expect(adaptedImg).toContain('w_480');
      expect(adaptedImg).toContain('q_auto:eco');
    });

    it('8. SaveData flag immediately activates eco mode and disables prefetching regardless of ping', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { rtt: 25, downlink: 50, effectiveType: '4g', saveData: true },
        configurable: true,
      });

      const profile = getNetworkQualityProfile();
      expect(profile.quality).toBe('eco');
      expect(profile.isSlowNetwork).toBe(true);
      expect(profile.canPrefetch).toBe(false);
      expect(shouldPrefetchMedia()).toBe(false);
    });

    it('9. Blur placeholder and video poster generation are robust', () => {
      const imgUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      expect(getBlurPlaceholderUrl(imgUrl)).toContain('w_30,q_20,e_blur:1000,f_auto');

      const videoUrl = 'https://res.cloudinary.com/demo/video/upload/sample.mp4';
      const posterUrl = getVideoPosterUrl(videoUrl);
      expect(posterUrl).toContain('so_0');
      expect(posterUrl).toContain('f_jpg');
    });
  });
});
