import api from './api';

export const searchService = {
  searchUsers: async (query = '', page = 0, size = 20) => {
    return await api.get('/search/users', {
      params: { q: query, page, size },
    });
  },

  searchPosts: async (query = '', page = 0, size = 20) => {
    return await api.get('/search/posts', {
      params: { q: query, page, size, sort: 'createdAt,desc' },
    });
  },

  searchHashtags: async (query = '') => {
    return await api.get('/search/tags', {
      params: { q: query },
    });
  },

  getTrendingHashtags: async () => {
    return await api.get('/search/tags/trending');
  },

  getPostsByHashtag: async (tag = '', page = 0, size = 20) => {
    return await api.get(`/search/tags/${encodeURIComponent(tag)}/posts`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getRecentSearches: async () => {
    return await api.get('/search/recent');
  },

  recordSearch: async ({ targetUserId = null, query = '', searchType = 'KEYWORD' }) => {
    return await api.post('/search/recent', {
      targetUserId,
      query,
      searchType,
    });
  },

  deleteRecentSearch: async (id) => {
    return await api.delete(`/search/recent/${id}`);
  },

  clearAllRecentSearches: async () => {
    return await api.delete('/search/recent');
  },

  getExploreFeed: async (page = 0, size = 20) => {
    return await api.get('/search/explore', {
      params: { page, size },
    });
  },
};

export default searchService;

