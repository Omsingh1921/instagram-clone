import api from './api';

export const noteService = {
  createOrUpdateNote: async (data) => {
    return await api.post('/notes', data);
  },

  getActiveNotesFeed: async () => {
    return await api.get('/notes/feed');
  },

  deleteCurrentNote: async () => {
    return await api.delete('/notes');
  },
};

export default noteService;
