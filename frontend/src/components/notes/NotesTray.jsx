import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { Skeleton } from '../ui/Skeleton';
import noteService from '../../services/note.service';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './NotesTray.css';

export const NotesTray = ({ onSelectUserForChat }) => {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [storyUsers, setStoryUsers] = useState(() => ({
    ids: new Set(),
    usernames: new Set(),
  }));
  const [modalOpen, setModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);
      const res = await noteService.getActiveNotesFeed();
      const list = res?.data || res || [];
      setNotes(Array.isArray(list) ? list : []);
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadStoryAvailability = useCallback(async () => {
    const nextIds = new Set();
    const nextUsernames = new Set();
    const curId = currentUser?.id || currentUser?.userId;
    const curUsername = currentUser?.username?.toLowerCase();

    try {
      const res = await storyService.getStoryFeed();
      const rawData = res?.data?.data || res?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : [];

      list.forEach((item) => {
        if (!item) return;
        const userObj = item.user || item.author;
        const stories = Array.isArray(item.stories) ? item.stories : null;
        if (stories && stories.length === 0) return;

        const uid = String(userObj?.id || userObj?.userId || item.userId || '');
        const uname = userObj?.username?.toLowerCase();
        if (uid) nextIds.add(uid);
        if (uname) nextUsernames.add(uname);
      });
    } catch {
      // Ignore if story feed is unavailable
    }

    const hasCurFromFeed =
      (curId && nextIds.has(String(curId))) ||
      (curUsername && nextUsernames.has(curUsername));

    if (curId && !hasCurFromFeed) {
      try {
        const myRes = await storyService.getUserStories(curId);
        const myData = myRes?.data?.data || myRes?.data || myRes;
        const activeList = Array.isArray(myData?.stories)
          ? myData.stories
          : Array.isArray(myData)
          ? myData
          : [];
        if (activeList.length > 0) {
          nextIds.add(String(curId));
          if (curUsername) nextUsernames.add(curUsername);
        }
      } catch {
        // Ignore if user has no active stories
      }
    }

    setStoryUsers({ ids: nextIds, usernames: nextUsernames });
  }, [currentUser?.id, currentUser?.userId, currentUser?.username]);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    loadStoryAvailability();

    const handleRefreshStories = () => loadStoryAvailability();
    window.addEventListener('story:refresh', handleRefreshStories);
    window.addEventListener('feed:refresh', handleRefreshStories);
    return () => {
      window.removeEventListener('story:refresh', handleRefreshStories);
      window.removeEventListener('feed:refresh', handleRefreshStories);
    };
  }, [loadStoryAvailability]);

  const checkHasStory = (userObj) => {
    if (!userObj) return false;
    if (userObj.hasActiveStory || userObj.hasStory) return true;
    const uid = String(userObj.id || userObj.userId || '');
    const uname = userObj.username?.toLowerCase();
    return Boolean(
      (uid && storyUsers.ids.has(uid)) ||
      (uname && storyUsers.usernames.has(uname))
    );
  };

  const isOwnNoteItem = (note) =>
    Boolean(
      note?.isOwnNote ??
        note?.ownNote ??
        (currentUser?.id && String(note?.user?.id || note?.userId) === String(currentUser.id))
    );
  const myNote = notes.find(isOwnNoteItem);
  const friendsNotes = notes.filter((n) => !isOwnNoteItem(n));
  const myHasStory = Boolean(
    checkHasStory(currentUser) ||
    checkHasStory(myNote?.user)
  );

  const handleOpenModal = () => {
    if (myNote) {
      setNoteText(myNote.text || '');
    } else {
      setNoteText('');
    }
    setModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      setSaving(true);
      await noteService.createOrUpdateNote({
        text: noteText.trim(),
      });
      showSuccess(myNote ? 'Note updated' : 'Note shared');
      setModalOpen(false);
      loadNotes();
    } catch (err) {
      showError(err.message || 'Failed to share note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      setSaving(true);
      await noteService.deleteCurrentNote();
      showSuccess('Note deleted');
      setModalOpen(false);
      loadNotes();
    } catch (err) {
      showError(err.message || 'Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="notes-tray-wrapper">
      <div className="notes-tray-scroll">
        {/* Current User Note */}
        <div className="note-item-col" onClick={handleOpenModal}>
          {myNote ? (
            <div className="note-bubble-floating">
              {myNote.text}
            </div>
          ) : (
            <div className="note-bubble-floating empty-prompt">
              Share a thought...
            </div>
          )}
          <div className="note-avatar-container">
            <div className={myHasStory ? 'note-avatar-ring' : 'note-avatar-plain'}>
              <Avatar
                src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
                alt={currentUser?.username}
                size="lg"
              />
            </div>
            {!myNote && (
              <div className="note-add-badge">
                <Plus size={13} strokeWidth={2.7} />
              </div>
            )}
          </div>
          <span className="note-username-label">Your note</span>
        </div>

        {/* Friends' Notes */}
        {loadingNotes && friendsNotes.length === 0 ? (
          [...Array(2)].map((_, i) => (
            <div key={`note-sk-${i}`} className="note-item-col" aria-hidden="true">
              <Skeleton className="w-16 h-6 rounded-2xl mb-1" />
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-2.5 mt-1.5" />
            </div>
          ))
        ) : (
          friendsNotes.map((note) => {
            const friendHasStory = checkHasStory(note.user);
            return (
              <div
                key={note.id}
                className="note-item-col"
                onClick={() => onSelectUserForChat?.(note.user)}
                title={`Reply to ${note.user?.username}'s note`}
              >
                <div className="note-bubble-floating">
                  {note.text}
                </div>
                <div className="note-avatar-container">
                  <div className={friendHasStory ? 'note-avatar-ring' : 'note-avatar-plain'}>
                    <Avatar
                      src={note.user?.avatarUrl || note.user?.profilePictureUrl}
                      alt={note.user?.username}
                      size="lg"
                    />
                  </div>
                </div>
                <span className="note-username-label">{note.user?.username}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Note Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={myNote ? 'Your Note' : 'New Note'}
      >
        <div className="note-create-modal">
          <div className="note-preview-bubble">
            {noteText.trim() ? noteText : 'Share what is on your mind...'}
          </div>
          <Avatar
            src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
            alt={currentUser?.username}
            size="lg"
          />

          <textarea
            className="note-textarea-input"
            placeholder="Share a thought (up to 60 chars)..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            maxLength={60}
          />
          <div style={{ alignSelf: 'flex-end', fontSize: '11px', color: '#888', marginTop: '4px' }}>
            {noteText.length}/60
          </div>

          <div className="note-actions-row">
            {myNote && (
              <button
                type="button"
                className="note-delete-btn"
                onClick={handleDeleteNote}
                disabled={saving}
                aria-label="Delete note"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              className="note-share-btn"
              onClick={handleSaveNote}
              disabled={!noteText.trim() || saving}
            >
              {saving ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NotesTray;
