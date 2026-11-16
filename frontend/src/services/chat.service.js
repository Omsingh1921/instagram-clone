import api from './api';

export const chatService = {
  getConversations: async (page = 0, size = 20, folder = null) => {
    return await api.get('/conversations', {
      params: {
        page,
        size,
        sort: 'updatedAt,desc',
        ...(folder ? { folder } : {}),
      },
    });
  },

  getPendingRequestsCount: async () => {
    return await api.get('/conversations/requests-count');
  },

  acceptMessageRequest: async (conversationId) => {
    return await api.post(`/conversations/${conversationId}/accept-request`);
  },

  declineMessageRequest: async (conversationId) => {
    return await api.post(`/conversations/${conversationId}/decline-request`);
  },

  getOrCreateDirectConversation: async (recipientId) => {
    return await api.post('/conversations', { recipientId });
  },

  getConversationById: async (conversationId) => {
    return await api.get(`/conversations/${conversationId}`);
  },

  getMessages: async (conversationId, page = 0, size = 15) => {
    return await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  sendMessage: async (conversationId, messageData) => {
    const payload = {
      ...messageData,
      content: messageData?.content ?? messageData?.text,
      messageType: messageData?.messageType || 'TEXT',
    };
    return await api.post(`/conversations/${conversationId}/messages`, payload);
  },

  unsendMessage: async (conversationId, messageId) => {
    return await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
  },

  reactToMessage: async (conversationId, messageId, emoji) => {
    return await api.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji });
  },

  removeReaction: async (conversationId, messageId) => {
    return await api.delete(`/conversations/${conversationId}/messages/${messageId}/reactions`);
  },

  createGroupConversation: async (groupData) => {
    return await api.post('/conversations/group', groupData);
  },

  updateGroupConversation: async (conversationId, updateData) => {
    return await api.put(`/conversations/${conversationId}/group`, updateData);
  },

  addGroupMembers: async (conversationId, memberIds) => {
    return await api.post(`/conversations/${conversationId}/members`, { memberIds });
  },

  removeGroupMember: async (conversationId, memberId) => {
    return await api.delete(`/conversations/${conversationId}/members/${memberId}`);
  },

  leaveGroup: async (conversationId) => {
    return await api.post(`/conversations/${conversationId}/leave`);
  },

  deleteConversation: async (conversationId) => {
    return await api.delete(`/conversations/${conversationId}`);
  },

  markAsRead: async (conversationId) => {
    return await api.post(`/conversations/${conversationId}/read`);
  },

  openViewOnceMessage: async (conversationId, messageId) => {
    return await api.post(`/conversations/${conversationId}/messages/${messageId}/open-view-once`);
  },

  togglePinConversation: async (conversationId) => {
    return await api.post(`/conversations/${conversationId}/pin`);
  },
};

export default chatService;

