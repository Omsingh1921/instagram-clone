import api from './api';

export const settingsService = {
  getSettings: async () => {
    return await api.get('/users/me/settings');
  },

  updateSettings: async (settingsData) => {
    return await api.put('/users/me/settings', settingsData);
  },

  changePassword: async (passwordData) => {
    return await api.put('/users/me/password', passwordData);
  },

  blockUser: async (userId, payload = {}) => {
    return await api.post(`/users/${userId}/block`, payload);
  },

  getBlockStatus: async (userId) => {
    return await api.get(`/users/${userId}/block-status`);
  },

  unblockUser: async (userId) => {
    return await api.delete(`/users/${userId}/block`);
  },

  getBlockedUsers: async (page = 0, size = 20) => {
    return await api.get('/users/me/blocks', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  initiateEmailChange: async (newEmailOrPayload, currentPassword) => {
    if (typeof newEmailOrPayload === 'object' && newEmailOrPayload !== null) {
      return await api.post('/users/me/email', newEmailOrPayload);
    }
    return await api.post('/users/me/email', {
      newEmail: newEmailOrPayload,
      currentPassword: currentPassword || '',
    });
  },

  cancelPendingEmailChange: async () => {
    return await api.delete('/users/me/email');
  },

  getEmailPreferences: async () => {
    return await api.get('/users/me/email-preferences');
  },

  updateEmailPreferences: async (preferences) => {
    return await api.put('/users/me/email-preferences', preferences);
  },

  muteUser: async (userId, mutePosts = true, muteStories = true) => {
    return await api.post(`/users/${userId}/mute`, null, {
      params: { mutePosts, muteStories },
    });
  },

  unmuteUser: async (userId) => {
    return await api.delete(`/users/${userId}/mute`);
  },

  isUserMuted: async (userId) => {
    return await api.get(`/users/${userId}/mute`);
  },

  getMutedUsers: async (page = 0, size = 20) => {
    return await api.get('/users/settings/muted', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getScreenTime: async (days = 7, today = null) => {
    const params = { days };
    if (today) params.today = today;
    return await api.get('/users/me/screen-time', { params });
  },

  getAccountCreated: async () => {
    return await api.get('/users/me/account-created');
  },

  getPasswordHistory: async () => {
    return await api.get('/users/me/password-history');
  },

  recordScreenTimeHeartbeat: async (activeSeconds, usageDate = null) => {
    return await api.post('/users/me/screen-time/heartbeat', {
      activeSeconds,
      ...(usageDate ? { usageDate } : {}),
    });
  },

  flushScreenTimeKeepalive: (activeSeconds, usageDate = null) => {
    if (typeof fetch !== 'function') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const base = api.defaults.baseURL || '/api/v1';
    const url = `${base.replace(/\/$/, '')}/users/me/screen-time/heartbeat`;
    fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        activeSeconds,
        ...(usageDate ? { usageDate } : {}),
      }),
    }).catch(() => {});
  },
};

export default settingsService;


