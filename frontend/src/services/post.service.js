import api from './api';
import mediaService from './media.service';
export const postService = {
  createPost: async (postData) => {
    return await api.post('/posts', postData);
  },

  getPostById: async (postId) => {
    return await api.get(`/posts/${postId}`);
  },

  getUserPosts: async (userId, page = 0, size = 12) => {
    return await api.get(`/users/${userId}/posts`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getSavedPosts: async (page = 0, size = 12) => {
    return await api.get('/posts/saved', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getLikedPosts: async (page = 0, size = 12) => {
    return await api.get('/posts/liked', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  updatePost: async (postId, updateData) => {
    return await api.put(`/posts/${postId}`, updateData);
  },

  deletePost: async (postId) => {
    return await api.delete(`/posts/${postId}`);
  },

  uploadMedia: async (file, category = 'posts', onProgress = null) => {
    return await mediaService.uploadMedia(file, category, onProgress);
  },

  togglePinPost: async (postId) => {
    return await api.post(`/posts/${postId}/pin`);
  },

  toggleComments: async (postId) => {
    return await api.post(`/posts/${postId}/toggle-comments`);
  },

  respondToCollabInvite: async (postId, accept) => {
    return await api.post(`/posts/${postId}/collab-response?accept=${accept}`);
  },

  toggleArchivePost: async (postId) => {
    return await api.post(`/posts/${postId}/archive`);
  },

  getArchivedPosts: async (page = 0, size = 12) => {
    return await api.get('/posts/archived', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  toggleHideLikeCount: async (postId) => {
    return await api.post(`/posts/${postId}/hide-likes`);
  },

  restorePost: async (postId) => {
    return await api.post(`/posts/${postId}/restore`);
  },

  getRecentlyDeletedPosts: async (page = 0, size = 12) => {
    return await api.get('/posts/recently-deleted', {
      params: { page, size, sort: 'deletedAt,desc' },
    });
  },

  permanentlyDeletePost: async (postId) => {
    return await api.delete(`/posts/${postId}/permanent`);
  },

  getUserTaggedPosts: async (userId, page = 0, size = 12) => {
    return await api.get(`/users/${userId}/tagged-posts`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },
};

export default postService;
