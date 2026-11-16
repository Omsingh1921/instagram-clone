import api from './api';

export const feedService = {
  getHomeFeed: async (page = 0, size = 5, mode = 'ALGORITHMIC') => {
    return await api.get('/feed', {
      params: { page, size, mode, sort: 'createdAt,desc' },
    });
  },

  getExploreFeed: async (page = 0, size = 20) => {
    return await api.get('/feed/explore', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  recordSeen: async (itemIds) => {
    if (!itemIds || !itemIds.length) return;
    return await api.post('/feed/seen', { itemIds });
  },
};

export default feedService;
