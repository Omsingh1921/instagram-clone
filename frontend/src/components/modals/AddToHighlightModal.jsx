import React, { useState, useEffect } from 'react';
import { Plus, Check, Camera, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './AddToHighlightModal.css';

export const AddToHighlightModal = ({
  isOpen,
  onClose,
  story,
  onHighlightAdded,
  onCreateNewRequested,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let isMounted = true;
    const fetchUserHighlights = async () => {
      try {
        setLoading(true);
        const res = await storyService.getUserHighlights(user.id);
        const list = res?.data || res || [];
        if (isMounted) {
          setHighlights(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (isMounted) {
          setHighlights([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserHighlights();
    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.id]);

  const handleSelectHighlight = async (hl) => {
    if (!story?.id || !hl?.id || addingId) return;

    try {
      setAddingId(hl.id);
      await storyService.addStoriesToHighlight(hl.id, [story.id]);
      showSuccess(`Added to "${hl.title || 'Highlight'}"`);
      if (onHighlightAdded) onHighlightAdded(hl);
      onClose();
    } catch (err) {
      showError(err?.message || 'Failed to add story to highlight');
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateNew = () => {
    onClose();
    if (onCreateNewRequested) {
      onCreateNewRequested(story);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={true}>
      <div className="add-to-highlight-modal">
        <div className="add-to-highlight-header">
          <Sparkles size={18} className="add-to-highlight-icon" />
          <h3>Add to Highlight</h3>
        </div>

        <div className="add-to-highlight-body">
          {loading ? (
            <div className="add-to-highlight-loading">
              <div className="add-to-highlight-spinner" />
              <span>Loading highlights...</span>
            </div>
          ) : (
            <div className="add-to-highlight-tray">
              {/* + New Highlight Option */}
              <button
                type="button"
                className="add-to-highlight-card new-card"
                onClick={handleCreateNew}
                title="Create new highlight"
              >
                <div className="add-to-highlight-bubble new-bubble">
                  <Plus size={24} strokeWidth={2} />
                </div>
                <span className="add-to-highlight-name">New</span>
              </button>

              {/* Existing Highlights */}
              {highlights.map((hl) => {
                const isAdding = addingId === hl.id;
                return (
                  <button
                    key={hl.id}
                    type="button"
                    className={`add-to-highlight-card ${isAdding ? 'is-adding' : ''}`}
                    onClick={() => handleSelectHighlight(hl)}
                    disabled={Boolean(addingId)}
                    title={`Add to ${hl.title}`}
                  >
                    <div className="add-to-highlight-bubble">
                      {hl.coverImageUrl ? (
                        <img
                          src={hl.coverImageUrl}
                          alt={hl.title}
                          className="add-to-highlight-img"
                        />
                      ) : (
                        <div className="add-to-highlight-placeholder">
                          <Camera size={20} color="var(--text-secondary)" />
                        </div>
                      )}
                      {isAdding && (
                        <div className="add-to-highlight-overlay">
                          <Check size={18} color="#fff" />
                        </div>
                      )}
                    </div>
                    <span className="add-to-highlight-name" title={hl.title}>
                      {hl.title || 'Highlight'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddToHighlightModal;

