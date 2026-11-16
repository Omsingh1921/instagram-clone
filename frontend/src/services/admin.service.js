import api from './api';

export const adminService = {
  createReport: async (reportData) => {
    return await api.post('/reports', reportData);
  },

  getReports: async (status = null, targetType = null, page = 0, size = 20) => {
    const params = { page, size, sort: 'createdAt,desc' };
    if (status && status !== 'ALL') params.status = status;
    if (targetType && targetType !== 'ALL') params.targetType = targetType;
    return await api.get('/admin/reports', { params });
  },

  resolveReport: async (reportId, resolutionData) => {
    return await api.put(`/admin/reports/${reportId}`, resolutionData);
  },

  updateUserStatus: async (userId, statusData) => {
    return await api.put(`/admin/users/${userId}/status`, statusData);
  },

  deleteUser: async (userId) => {
    return await api.delete(`/admin/users/${userId}`);
  },

  getUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  // Dynamic Email Configurations (Senders per category)
  getEmailConfigs: async () => {
    return await api.get('/admin/email-configs');
  },

  getEmailConfigByCategory: async (category) => {
    return await api.get(`/admin/email-configs/${category}`);
  },

  updateEmailConfig: async (configData) => {
    return await api.put('/admin/email-configs', configData);
  },

  sendTestEmail: async (testData) => {
    return await api.post('/admin/email-configs/test', testData);
  },

  // Dynamic Email Templates (Placeholders, HTML body, reset)
  getEmailTemplates: async () => {
    return await api.get('/admin/email-templates');
  },

  getEmailTemplateByType: async (emailType) => {
    return await api.get(`/admin/email-templates/${emailType}`);
  },

  updateEmailTemplate: async (templateData) => {
    return await api.put('/admin/email-templates', templateData);
  },

  previewEmailTemplate: async (previewData) => {
    return await api.post('/admin/email-templates/preview', previewData);
  },

  resetEmailTemplate: async (emailType) => {
    return await api.post(`/admin/email-templates/reset/${emailType}`);
  },

  getStats: async (days = 7) => {
    return await api.get('/admin/stats', { params: { days } });
  },

  getActivity: async (limit = 12) => {
    return await api.get('/admin/activity', { params: { limit } });
  },

  getContent: async (type = 'POSTS', query = '', page = 0, size = 18) => {
    const params = { type, page, size };
    if (query && query.trim()) params.query = query.trim();
    return await api.get('/admin/content', { params });
  },

  deleteContent: async (type, contentId) => {
    return await api.delete(`/admin/content/${type}/${contentId}`);
  },
};

export default adminService;
