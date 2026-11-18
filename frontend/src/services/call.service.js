import api from './api';

export const callService = {
  /**
   * Initiate a new audio or video call
   */
  initiateCall: async (recipientId, callType = 'VIDEO', conversationId = null) => {
    const response = await api.post('/calls/initiate', {
      recipientId,
      callType,
      conversationId,
    });
    return response.data || response;
  },

  /**
   * Answer an incoming call
   */
  answerCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/answer`);
    return response.data || response;
  },

  /**
   * Reject / decline an incoming call
   */
  rejectCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/reject`);
    return response.data || response;
  },

  /**
   * End an ongoing call
   */
  endCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/end`);
    return response.data || response;
  },

  /**
   * Initiate a new audio or video group call
   */
  initiateGroupCall: async (conversationId, callType = 'VIDEO') => {
    const response = await api.post('/calls/group/initiate', {
      conversationId,
      callType,
    });
    return response.data || response;
  },

  /**
   * Join an ongoing group call
   */
  joinCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/join`);
    return response.data || response;
  },

  /**
   * Leave an ongoing group call
   */
  leaveCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/leave`);
    return response.data || response;
  },

  /**
   * Get active group call for a conversation
   */
  getActiveGroupCall: async (conversationId) => {
    const response = await api.get(`/calls/group/${conversationId}/active`);
    return response.data || response;
  },

  /**
   * Get call history for the current user
   */
  getCallHistory: async (page = 0, size = 20) => {
    const response = await api.get('/calls/history', {
      params: { page, size, sort: 'startedAt,desc' },
    });
    return response.data || response;
  },

  /**
   * Get active call session if any
   */
  getActiveCall: async () => {
    const response = await api.get('/calls/active');
    return response.data || response;
  },

  /**
   * Get call session by ID
   */
  getCallById: async (callId) => {
    const response = await api.get(`/calls/${callId}`);
    return response.data || response;
  },
};

export default callService;

