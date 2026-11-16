import React, { useState, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import noteService from '../../services/note.service';
import { useToast } from '../../context/ToastContext';
import './NoteModal.css';

export const NoteModal = ({ isOpen, onClose, currentNote, onNoteUpdated }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (currentNote) {
      setText(currentNote.text || '');
    } else {
      setText('');
    }
  }, [currentNote, isOpen]);

  const handleShareNote = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      showError('Please write something in your note');
      return;
    }
    if (text.length > 60) {
      showError('Notes can be at most 60 characters');
      return;
    }

    try {
      setLoading(true);
      const res = await noteService.createOrUpdateNote({
        text: text.trim(),
      });
      const note = res?.data || res;
      showSuccess(currentNote ? 'Note updated!' : 'Note shared for 24 hours!');
      if (onNoteUpdated) onNoteUpdated(note);
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      setDeleting(true);
      await noteService.deleteCurrentNote();
      showSuccess('Note deleted');
      if (onNoteUpdated) onNoteUpdated(null);
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to delete note');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentNote ? 'Your Note' : 'New Note'}
      size="sm"
      className="note-modal-dialog"
    >
      <form onSubmit={handleShareNote} className="note-modal-form">
        <div className="note-thought-bubble-preview">
          <div className="note-preview-cloud">
            <span className="note-preview-text">
              {text || 'Share a thought...'}
            </span>
          </div>
          <div className="note-bubble-tail tail-1" />
          <div className="note-bubble-tail tail-2" />
        </div>

        <div className="note-input-container">
          <textarea
            className="note-textarea"
            rows={3}
            placeholder="Share what's on your mind... (up to 60 characters)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={60}
            autoFocus
          />
          <div className="note-character-counter">
            <span className={text.length >= 55 ? 'counter-warning' : ''}>
              {text.length}/60
            </span>
          </div>
        </div>

        <p className="note-visibility-hint">
          Followers you follow back can see your note for 24 hours. They can reply with a direct message.
        </p>

        <div className="note-modal-actions">
          {currentNote && (
            <button
              type="button"
              className="btn btn-secondary note-delete-btn"
              onClick={handleDeleteNote}
              disabled={deleting || loading}
            >
              {deleting ? <LoadingSpinner size="sm" /> : <Trash2 size={16} />}
              <span>Delete</span>
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary note-share-btn"
            disabled={!text.trim() || loading || deleting}
          >
            {loading ? <LoadingSpinner size="sm" /> : <Send size={16} />}
            <span>{currentNote ? 'Update' : 'Share'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NoteModal;
