import api from './api';

export const collectionService = {
  getCollections: async () => {
    const res = await api.get('/collections');
    return res.data;
  },
  createCollection: async (data) => {
    const res = await api.post('/collections', data);
    return res.data;
  },
  getCollectionPosts: async (id, page = 0, size = 18) => {
    const res = await api.get(`/collections/${id}/posts?page=${page}&size=${size}`);
    return res.data;
  },
  getCollectionReels: async (id, page = 0, size = 18) => {
    const res = await api.get(`/collections/${id}/reels?page=${page}&size=${size}`);
    return res.data;
  },
  addItem: async (collectionId, postId, reelId) => {
    let url = `/collections/${collectionId}/items?`;
    if (postId) url += `postId=${postId}`;
    if (reelId) url += `${postId ? '&' : ''}reelId=${reelId}`;
    const res = await api.post(url);
    return res.data;
  },
  removeItem: async (collectionId, postId, reelId) => {
    let url = `/collections/${collectionId}/items?`;
    if (postId) url += `postId=${postId}`;
    if (reelId) url += `${postId ? '&' : ''}reelId=${reelId}`;
    const res = await api.delete(url);
    return res.data;
  },
  deleteCollection: async (id) => {
    const res = await api.delete(`/collections/${id}`);
    return res.data;
  }
};

export default collectionService;
