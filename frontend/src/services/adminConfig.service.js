import api from './api';

export const adminConfigService = {
  // ==================== 1. EMAIL SERVER CONFIG ====================
  getEmailServerConfig: async () => {
    return await api.get('/admin/email/server');
  },

  updateEmailServerConfig: async (configData) => {
    return await api.put('/admin/email/server', configData);
  },

  resetEmailServerConfig: async () => {
    return await api.post('/admin/email/server/reset');
  },

  testEmailServer: async (recipient) => {
    return await api.post('/admin/email/server/test', null, {
      params: { recipient },
    });
  },

  // ==================== 2. DELETION & RETENTION CONFIG ====================
  getDeletionConfig: async () => {
    return await api.get('/admin/deletion/config');
  },

  updateDeletionConfig: async (configData) => {
    return await api.put('/admin/deletion/config', configData);
  },

  resetDeletionConfig: async () => {
    return await api.post('/admin/deletion/config/reset');
  },

  // ==================== 3. MEDIA & UPLOADS CONFIG ====================
  getMediaConfig: async () => {
    return await api.get('/admin/media/config');
  },

  updateMediaConfig: async (configData) => {
    return await api.put('/admin/media/config', configData);
  },

  resetMediaConfig: async () => {
    return await api.post('/admin/media/config/reset');
  },

  getPublicMediaConfig: async () => {
    return await api.get('/media/config/public');
  },

  // ==================== 4. FEATURE FLAGS & MAINTENANCE ====================
  getFeatureFlagConfig: async () => {
    return await api.get('/admin/features/config');
  },

  updateFeatureFlagConfig: async (configData) => {
    return await api.put('/admin/features/config', configData);
  },

  resetFeatureFlagConfig: async () => {
    return await api.post('/admin/features/config/reset');
  },

  getPublicFeatureFlags: async () => {
    return await api.get('/features/public');
  },

  // ==================== 5. MODERATION & SAFETY CONFIG ====================
  getModerationConfig: async () => {
    return await api.get('/admin/moderation/config');
  },

  updateModerationConfig: async (configData) => {
    return await api.put('/admin/moderation/config', configData);
  },

  resetModerationConfig: async () => {
    return await api.post('/admin/moderation/config/reset');
  },

  // ==================== 6. UNIFIED DYNAMIC CONFIG (SYSTEM SETTINGS) ====================
  getDynamicConfigs: async () => {
    return await api.get('/admin/dynamic-config');
  },

  updateDynamicConfig: async (key, value) => {
    return await api.put(`/admin/dynamic-config/${encodeURIComponent(key)}`, { value });
  },

  resetDynamicConfig: async (key) => {
    return await api.post(`/admin/dynamic-config/${encodeURIComponent(key)}/reset`);
  },

  resetAllDynamicConfigs: async () => {
    return await api.post('/admin/dynamic-config/reset');
  },

  getPublicDynamicConfigs: async () => {
    return await api.get('/dynamic-config/public');
  },
};

export default adminConfigService;
