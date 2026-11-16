import api from './api';

/**
 * Dedicated Media Service adhering to Section 30 (Frontend Upload Flow).
 * Communicates with backend Media API (/api/v1/media).
 * Completely hides Cloudinary storage domain and cloud name from client browser.
 */

const ensureMaskedUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  const CLOUD_BASE = 'https://res.cloudinary.com/';
  if (url.startsWith(CLOUD_BASE)) {
    const slashAfterCloud = url.indexOf('/', CLOUD_BASE.length);
    if (slashAfterCloud !== -1) {
      return '/cdn' + url.substring(slashAfterCloud);
    }
  }
  return url;
};

export const mediaService = {
  /**
   * Upload media file through backend /api/v1/media.
   * Completely avoids exposing Cloudinary credentials, domain, or presigned URLs to the client.
   */
  uploadMedia: async (file, category = 'posts', onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const res = await api.post('/media', formData, {
      headers: {
        'Content-Type': undefined,
      },
      timeout: 120000,
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress(pct);
        }
      },
    });

    const body = res?.data || res;
    const data = body?.data || body;
    const rawUrl = data?.secureUrl || data?.url || data?.mediaUrl;
    const maskedUrl = ensureMaskedUrl(rawUrl);
    const maskedThumbnail = ensureMaskedUrl(data?.thumbnailUrl || maskedUrl);

    if (onProgress) onProgress(100);

    return {
      success: true,
      data: {
        ...data,
        url: maskedUrl,
        secureUrl: maskedUrl,
        mediaUrl: maskedUrl,
        thumbnailUrl: maskedThumbnail,
        publicId: data?.publicId,
        mediaType: data?.mediaType || (file?.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE'),
      },
      url: maskedUrl,
      secureUrl: maskedUrl,
      mediaUrl: maskedUrl,
      thumbnailUrl: maskedThumbnail,
    };
  },

  getMedia: async (mediaId) => {
    return await api.get(`/media/${mediaId}`);
  },

  deleteMedia: async (mediaId) => {
    return await api.delete(`/media/${mediaId}`);
  },
};

export default mediaService;
