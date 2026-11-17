import api from './api';

export const notificationService = {
  getNotifications: async (page = 0, size = 20) => {
    return await api.get('/notifications', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getUnreadCount: async () => {
    return await api.get('/notifications/unread-count');
  },

  markAsRead: async (notificationId) => {
    return await api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    return await api.put('/notifications/read-all');
  },

  deleteNotification: async (notificationId) => {
    return await api.delete(`/notifications/${notificationId}`);
  },

  clearReadNotifications: async () => {
    return await api.delete('/notifications/clear-read');
  },
};

export default notificationService;
