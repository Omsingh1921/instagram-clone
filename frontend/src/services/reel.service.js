import api from './api';

export const reelService = {
  createReel: async (reelData) => {
    return await api.post('/reels', reelData);
  },

  getReels: async (page = 0, size = 5, seed = null) => {
    return await api.get('/reels', {
      params: { page, size, seed: seed || undefined, sort: 'createdAt,desc' },
    });
  },

  getReelById: async (reelId) => {
    return await api.get(`/reels/${reelId}`);
  },

  getUserReels: async (userId, page = 0, size = 12) => {
    return await api.get(`/users/${userId}/reels`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  deleteReel: async (reelId) => {
    return await api.delete(`/reels/${reelId}`);
  },

  updateReel: async (reelId, reelData) => {
    return await api.put(`/reels/${reelId}`, reelData);
  },

  restoreReel: async (reelId) => {
    return await api.post(`/reels/${reelId}/restore`);
  },

  getRecentlyDeletedReels: async (page = 0, size = 12) => {
    return await api.get('/reels/recently-deleted', {
      params: { page, size, sort: 'deletedAt,desc' },
    });
  },

  permanentlyDeleteReel: async (reelId) => {
    return await api.delete(`/reels/${reelId}/permanent`);
  },

  toggleArchiveReel: async (reelId) => {
    return await api.put(`/reels/${reelId}/archive`);
  },

  getArchivedReels: async (page = 0, size = 12) => {
    return await api.get('/reels/archived', {
      params: { page, size, sort: 'archivedAt,desc' },
    });
  },

  toggleSaveReel: async (reelId) => {
    return await api.put(`/reels/${reelId}/bookmark`);
  },

  bookmarkReel: async (reelId) => {
    return await api.put(`/reels/${reelId}/bookmark`);
  },

  getSavedReels: async (page = 0, size = 12) => {
    return await api.get('/users/me/saved-reels', {
      params: { page, size },
    });
  },

  togglePinReel: async (reelId) => {
    return await api.post(`/reels/${reelId}/pin`);
  },

  getFollowingReels: async (page = 0, size = 5, seed = null) => {
    return await api.get('/reels/following', {
      params: { page, size, seed: seed || undefined, sort: 'createdAt,desc' },
    });
  },

  getReelsByHashtag: async (hashtag, page = 0, size = 12) => {
    return await api.get(`/reels/hashtag/${encodeURIComponent(hashtag)}`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getReelsByAudio: async (title, page = 0, size = 12) => {
    return await api.get('/reels/audio', {
      params: { title, page, size, sort: 'createdAt,desc' },
    });
  },

  createDraft: async (reelData) => {
    return await api.post('/reels/drafts', reelData);
  },

  getDrafts: async (page = 0, size = 12) => {
    return await api.get('/reels/drafts', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  publishDraft: async (reelId) => {
    return await api.put(`/reels/${reelId}/publish`);
  },

  markNotInterested: async (reelId) => {
    return await api.post(`/reels/${reelId}/not-interested`);
  },

  removeNotInterested: async (reelId) => {
    return await api.delete(`/reels/${reelId}/not-interested`);
  },

  unarchiveReel: async (reelId) => {
    return await api.delete(`/reels/${reelId}/archive`);
  },

  unsaveReel: async (reelId) => {
    return await api.delete(`/reels/${reelId}/bookmark`);
  },

  reportReel: async (reelId, reportData) => {
    return await api.post(`/reels/${reelId}/reports`, reportData);
  },

  toggleLike: async (reelId) => {
    return await api.post(`/reels/${reelId}/like`);
  },

  getLikes: async (reelId, page = 0, size = 20) => {
    return await api.get(`/reels/${reelId}/likes`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  addComment: async (reelId, commentData) => {
    return await api.post(`/reels/${reelId}/comments`, commentData);
  },

  getComments: async (reelId, page = 0, size = 20) => {
    return await api.get(`/reels/${reelId}/comments`, {
      params: { page, size, sort: 'createdAt,asc' },
    });
  },

  deleteComment: async (commentId) => {
    return await api.delete(`/reels/comments/${commentId}`);
  },

  recordView: async (reelId) => {
    return await api.post(`/reels/${reelId}/view`);
  },

  recordShare: async (reelId, shareData = { shareType: 'COPY_LINK' }) => {
    return await api.post(`/reels/${reelId}/share`, shareData);
  },
};

export default reelService;
