/**
 * Adaptive Progressive Media Utilities for Cloudinary and External Assets.
 * Implements real-time Network "Ping" (Round-Trip Time / RTT) and Connection Speed
 * adaptive streaming logic modeled after Instagram's production client web architecture:
 *
 * 1. Low Ping (< 70ms / Fast Wi-Fi / 5G):
 *    - Highest fidelity (1080p WebP / q_auto:best)
 *    - Advance pre-fetching allowed for next stories & reels
 * 2. Normal Ping (70 - 250ms / 4G LTE):
 *    - Standard 720p HD streaming / q_auto:good
 *    - Progressive blur-up placeholders
 *    - Normal pre-fetching allowed
 * 3. High Ping (> 250ms / Slow 3G / Poor Signal / Data Saver enabled):
 *    - Quality drops to 480p / q_auto:eco
 *    - Background pre-fetching DISABLED to avoid buffering active playing stream
 */

/**
 * Reads network latency (ping/RTT) and bandwidth from navigator.connection.
 * Returns the active adaptive quality profile.
 *
 * @returns {object} Network quality profile
 */
export const getNetworkQualityProfile = () => {
  if (typeof navigator === 'undefined') {
    return {
      quality: 'good',
      tier: 'standard',
      maxImageWidth: 720,
      videoTransformation: 'q_auto:good,vc_auto,w_720',
      isSlowNetwork: false,
      canPrefetch: true,
      ping: 60,
      effectiveType: '4g',
      saveData: false,
    };
  }

  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (!conn) {
    // Graceful fallback for browsers without NetworkInformation API (e.g. Safari)
    return {
      quality: 'good',
      tier: 'standard',
      maxImageWidth: 720,
      videoTransformation: 'q_auto:good,vc_auto,w_720',
      isSlowNetwork: false,
      canPrefetch: true,
      ping: 60,
      effectiveType: '4g',
      saveData: false,
    };
  }

  const ping = typeof conn.rtt === 'number' ? conn.rtt : 60;
  const downlink = typeof conn.downlink === 'number' ? conn.downlink : 10;
  const effectiveType = conn.effectiveType || '4g';
  const saveData = Boolean(conn.saveData);

  // High Ping (> 250ms), 2G/3G, or user Data Saver enabled -> Eco Mode
  if (saveData || ping > 250 || effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g' || downlink < 1.5) {
    return {
      quality: 'eco',
      tier: 'eco',
      maxImageWidth: 480,
      videoTransformation: 'q_auto:eco,vc_auto,w_480',
      isSlowNetwork: true,
      canPrefetch: false, // Turn off background prefetching to preserve bandwidth
      ping,
      downlink,
      effectiveType,
      saveData,
    };
  }

  // Low Ping (< 70ms) on Fast 4G / 5G / Wi-Fi -> Fast / Best Mode
  if (ping < 70 && effectiveType === '4g' && downlink >= 5) {
    return {
      quality: 'best',
      tier: 'fast',
      maxImageWidth: 1080,
      videoTransformation: 'q_auto:best,vc_auto',
      isSlowNetwork: false,
      canPrefetch: true,
      ping,
      downlink,
      effectiveType,
      saveData,
    };
  }

  // Normal Ping (70 - 250ms) -> Standard Mode
  return {
    quality: 'good',
    tier: 'standard',
    maxImageWidth: 720,
    videoTransformation: 'q_auto:good,vc_auto,w_720',
    isSlowNetwork: false,
    canPrefetch: true,
    ping,
    downlink,
    effectiveType,
    saveData,
  };
};

/**
 * Determines whether advance background prefetching (next reels, next stories)
 * should run given current network latency.
 *
 * @returns {boolean}
 */
export const shouldPrefetchMedia = () => {
  return getNetworkQualityProfile().canPrefetch;
};

/**
 * Returns an adaptive, progressive image URL dynamically tuned to network latency.
 *
 * @param {string} url - Source image URL
 * @param {object} options - Sizing and quality options
 * @returns {string} - Transformed optimized URL
 */
export const getAdaptiveImageUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return '';

  const profile = getNetworkQualityProfile();

  const {
    width = profile.maxImageWidth,
    height = null,
    quality = `auto:${profile.quality}`,
    format = 'auto',
    crop = 'limit',
    progressive = true,
    blur = null,
  } = options;

  // Cloudinary Image Optimization (supports masked /cdn/ as well as direct cloudinary.com)
  if ((url.includes('cloudinary.com') || url.includes('/cdn/') || url.startsWith('/cdn')) && url.includes('/image/upload/')) {
    const transforms = [];

    if (progressive) transforms.push('fl_progressive');
    if (format) transforms.push(`f_${format}`);
    if (quality) transforms.push(`q_${quality}`);
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop && (width || height)) transforms.push(`c_${crop}`);
    if (blur) transforms.push(`e_blur:${blur}`);

    const transformStr = transforms.join(',');
    return url.replace('/image/upload/', `/image/upload/${transformStr}/`);
  }

  // Unsplash Image Optimization
  if (url.includes('unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      if (width) u.searchParams.set('w', String(width));
      if (quality && typeof quality === 'number') u.searchParams.set('q', String(quality));
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
};

/**
 * Returns a tiny (~30px) heavily blurred placeholder URL for LQIP (blur-up).
 *
 * @param {string} url - Original image URL
 * @returns {string} - Placeholder image URL
 */
export const getBlurPlaceholderUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  if ((url.includes('cloudinary.com') || url.includes('/cdn/') || url.startsWith('/cdn')) && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/image/upload/w_30,q_20,e_blur:1000,f_auto/');
  }

  if (url.includes('unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('w', '30');
      u.searchParams.set('q', '20');
      u.searchParams.set('blur', '50');
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
};

/**
 * Derives a video poster image URL from a video URL or custom thumbnail,
 * adapted to client network bandwidth.
 *
 * @param {string} videoUrl - Video URL
 * @param {string} customThumbnailUrl - Optional custom thumbnail URL
 * @returns {string} - Poster image URL
 */
export const getVideoPosterUrl = (videoUrl, customThumbnailUrl = null) => {
  const profile = getNetworkQualityProfile();
  const posterWidth = profile.maxImageWidth || 720;

  if (customThumbnailUrl && typeof customThumbnailUrl === 'string' && customThumbnailUrl.trim() !== '') {
    return getAdaptiveImageUrl(customThumbnailUrl, { width: posterWidth });
  }

  if (!videoUrl || typeof videoUrl !== 'string') return '';

  // Cloudinary video URL -> extract frame at offset 0, width matching network profile, jpg format
  if ((videoUrl.includes('cloudinary.com') || videoUrl.includes('/cdn/') || videoUrl.startsWith('/cdn')) && videoUrl.includes('/video/upload/')) {
    const jpgUrl = videoUrl.replace(/\.[^/.]+$/, '.jpg');
    return jpgUrl.replace(
      '/video/upload/',
      `/video/upload/so_0,w_${posterWidth},c_limit,q_auto:${profile.quality},f_jpg/`
    );
  }

  // Generic fallback: replace extension with .jpg
  return videoUrl.replace(/\.[^/.]+$/, '.jpg');
};

/**
 * Optimizes Cloudinary video streaming URL with fast-start, auto video codec,
 * and adaptive bitrate/resolution matching real-time network ping (RTT).
 *
 * @param {string} videoUrl - Video URL
 * @param {object} options - Optional overrides
 * @returns {string} - Optimized adaptive video URL
 */
export const getAdaptiveVideoUrl = (videoUrl, options = {}) => {
  if (!videoUrl || typeof videoUrl !== 'string') return '';

  if ((videoUrl.includes('cloudinary.com') || videoUrl.includes('/cdn/') || videoUrl.startsWith('/cdn')) && videoUrl.includes('/video/upload/')) {
    // If explicit transformation already present, preserve unless overriding
    if (videoUrl.includes('/video/upload/q_auto') && videoUrl.includes('/video/upload/vc_auto')) {
      return videoUrl;
    }

    const profile = getNetworkQualityProfile();
    const transform = options.transformation || profile.videoTransformation;

    return videoUrl.replace('/video/upload/', `/video/upload/${transform}/`);
  }

  return videoUrl;
};
