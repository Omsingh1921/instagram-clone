import api from './api';

export const storyService = {
  createStory: async (storyData) => {
    return await api.post('/stories', storyData);
  },

  getStoryFeed: async () => {
    return await api.get('/stories/feed');
  },

  getUserStories: async (userId) => {
    return await api.get(`/users/${userId}/stories`);
  },

  markStoryViewed: async (storyId) => {
    return await api.post(`/stories/${storyId}/view`);
  },

  getStoryViewers: async (storyId) => {
    return await api.get(`/stories/${storyId}/viewers`);
  },

  deleteStory: async (storyId) => {
    return await api.delete(`/stories/${storyId}`);
  },

  // Story Highlights
  createHighlight: async (data) => {
    return await api.post('/stories/highlights', data);
  },

  getHighlightById: async (highlightId) => {
    return await api.get(`/stories/highlights/${highlightId}`);
  },

  getUserHighlights: async (userId) => {
    return await api.get(`/stories/highlights/user/${userId}`);
  },

  updateHighlight: async (highlightId, data) => {
    return await api.put(`/stories/highlights/${highlightId}`, data);
  },

  deleteHighlight: async (highlightId) => {
    return await api.delete(`/stories/highlights/${highlightId}`);
  },

  // Close Friends
  getCloseFriends: async () => {
    return await api.get('/users/close-friends');
  },

  addCloseFriend: async (friendId) => {
    return await api.post(`/users/close-friends/${friendId}`);
  },

  removeCloseFriend: async (friendId) => {
    return await api.delete(`/users/close-friends/${friendId}`);
  },

  // Question Sticker (AMA)
  answerStoryQuestion: async (storyId, answer) => {
    return await api.post(`/stories/${storyId}/question-responses`, { answer });
  },

  getStoryQuestionResponses: async (storyId) => {
    return await api.get(`/stories/${storyId}/question-responses`);
  },

  // Story Likes & Replies
  toggleLikeStory: async (storyId) => {
    return await api.post(`/stories/${storyId}/like`);
  },

  replyToStory: async (storyId, message) => {
    return await api.post(`/stories/${storyId}/reply`, { content: message, message });
  },

  reactToStory: async (storyId, emoji) => {
    return await api.post(`/stories/${storyId}/react`, { emoji });
  },

  // Interactive Stickers
  voteOnQuiz: async (storyId, selectedOption) => {
    return await api.post(`/stories/${storyId}/quiz/vote`, { selectedOption });
  },

  voteOnSlider: async (storyId, sliderValue) => {
    return await api.post(`/stories/${storyId}/slider/vote`, { sliderValue });
  },

  toggleCountdownReminder: async (storyId) => {
    return await api.post(`/stories/${storyId}/countdown/remind`);
  },

  // Story Archive & Memories
  getStoryArchive: async (page = 0, size = 20) => {
    return await api.get(`/stories/archive?page=${page}&size=${size}`);
  },

  getStoryArchiveCalendar: async () => {
    return await api.get('/stories/archive/calendar');
  },

  reshareArchivedStory: async (storyId) => {
    return await api.post(`/stories/archive/${storyId}/reshare`);
  },

  // Privacy & Story Hiding
  hideStoryFromUser: async (userId) => {
    return await api.post(`/users/story-privacy/hide/${userId}`);
  },

  unhideStoryFromUser: async (userId) => {
    return await api.delete(`/users/story-privacy/unhide/${userId}`);
  },

  getHiddenStoryUsers: async () => {
    return await api.get('/users/story-privacy/hidden');
  },

  // Resharing cross-content
  sharePostToStory: async (postId) => {
    return await api.post(`/stories/share/post/${postId}`);
  },

  shareReelToStory: async (reelId) => {
    return await api.post(`/stories/share/reel/${reelId}`);
  },

  shareMentionedStory: async (storyId) => {
    return await api.post(`/stories/share/mention/${storyId}`);
  },

  // Story Highlights Item Manipulation
  addStoriesToHighlight: async (highlightId, storyIds) => {
    return await api.post(`/stories/highlights/${highlightId}/items`, { storyIds });
  },

  removeStoryFromHighlight: async (highlightId, storyId) => {
    return await api.delete(`/stories/highlights/${highlightId}/items/${storyId}`);
  },

  // Reporting & Insights
  reportStory: async (storyId, reason, details) => {
    return await api.post(`/stories/${storyId}/report`, { reason, details });
  },

  getStoryInsights: async (storyId) => {
    return await api.get(`/stories/${storyId}/insights`);
  },
};

export default storyService;
