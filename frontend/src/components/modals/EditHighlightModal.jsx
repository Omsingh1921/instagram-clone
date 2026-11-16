import React, { useState, useEffect } from 'react';
import { Check, Image as ImageIcon, Camera } from 'lucide-react';
import Modal from '../common/Modal';
import { SkeletonMediaGrid } from '../ui/Skeleton';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './EditHighlightModal.css';

export const EditHighlightModal = ({
  isOpen,
  onClose,
  highlightId,
  onHighlightUpdated,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('selected'); // 'selected' | 'add' | 'details'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [selectedStories, setSelectedStories] = useState([]);
  const [archiveStories, setArchiveStories] = useState([]);

  useEffect(() => {
    if (!isOpen || !highlightId || !user?.id) return;

    let isMounted = true;
    const loadHighlightAndArchive = async () => {
      try {
        setLoading(true);
        const [hlRes, activeRes, archiveRes] = await Promise.all([
          storyService.getHighlightById(highlightId),
          storyService.getUserStories(user.id).catch(() => null),
          storyService.getStoryArchive(0, 50).catch(() => null),
        ]);

        if (!isMounted) return;

        const hlData = hlRes?.data || hlRes;
        const existingStories = hlData?.stories || [];
        setTitle(hlData?.title || '');
        setCoverUrl(hlData?.coverImageUrl || '');
        setSelectedStories(existingStories);

        const activeList = activeRes?.data?.stories || activeRes?.stories || activeRes?.data || [];
        const archiveList = archiveRes?.data?.content || archiveRes?.content || archiveRes?.data || [];
        const existingIds = new Set(existingStories.map((s) => s.id));

        const pool = [];
        const seen = new Set();
        [...activeList, ...archiveList].forEach((s) => {
          if (s?.id && !seen.has(s.id) && !existingIds.has(s.id)) {
            seen.add(s.id);
            pool.push(s);
          }
        });

        setArchiveStories(pool);
      } catch (err) {
        if (isMounted) showError(err?.message || 'Failed to load highlight details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHighlightAndArchive();
    setActiveTab('selected');
    return () => {
      isMounted = false;
    };
  }, [isOpen, highlightId, user?.id]);

  const handleToggleRemove = (storyId) => {
    setSelectedStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  const handleAddStory = (story) => {
    setArchiveStories((prev) => prev.filter((s) => s.id !== story.id));
    setSelectedStories((prev) => [...prev, story]);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      showError('Highlight title cannot be empty');
      return;
    }
    if (selectedStories.length === 0) {
      showError('Highlight must contain at least one story');
      return;
    }

    try {
      setSubmitting(true);
      const chosenCover = coverUrl || selectedStories[0]?.mediaUrl || '';
      const storyIds = selectedStories.map((s) => s.id);

      const res = await storyService.updateHighlight(highlightId, {
        title: title.trim(),
        coverImageUrl: (chosenCover && chosenCover.length <= 700) ? chosenCover : undefined,
        storyIds,
      });

      showSuccess('Highlight updated successfully');
      if (onHighlightUpdated) onHighlightUpdated(res?.data || res);
      onClose();
    } catch (err) {
      showError(err?.message || 'Failed to update highlight');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={false}>
      <div className="edit-highlight-modal">
        {/* Header */}
        <div className="edit-highlight-header">
          <button
            type="button"
            className="edit-highlight-cancel-btn"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <span className="edit-highlight-title">Edit Highlight</span>
          <button
            type="button"
            className="edit-highlight-done-btn"
            onClick={handleSave}
            disabled={submitting || loading || selectedStories.length === 0}
          >
            {submitting ? 'Saving...' : 'Done'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="edit-highlight-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'selected'}
            className={`edit-highlight-tab ${activeTab === 'selected' ? 'active' : ''}`}
            onClick={() => setActiveTab('selected')}
          >
            Selected ({selectedStories.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'add'}
            className={`edit-highlight-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add More
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'details'}
            className={`edit-highlight-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Title & Cover
          </button>
        </div>

        {/* Body Content */}
        <div className="edit-highlight-body">
          {loading ? (
            <div className="edit-highlight-loading">
              <SkeletonMediaGrid count={6} />
            </div>
          ) : (
            <>
              {/* Tab 1: Selected Stories */}
              {activeTab === 'selected' && (
                <div className="edit-highlight-grid-container">
                  {selectedStories.length === 0 ? (
                    <div className="edit-highlight-empty">
                      <p>No stories selected.</p>
                      <span>Switch to "Add More" to select stories for this highlight.</span>
                    </div>
                  ) : (
                    <div className="edit-highlight-grid">
                      {selectedStories.map((s) => (
                        <div
                          key={s.id}
                          className="edit-highlight-tile selected"
                          onClick={() => handleToggleRemove(s.id)}
                          title="Click to remove from highlight"
                        >
                          {s.mediaType === 'VIDEO' ? (
                            <video src={s.mediaUrl} className="edit-highlight-media" />
                          ) : (
                            <img src={s.mediaUrl} alt="Story" className="edit-highlight-media" />
                          )}
                          <div className="edit-highlight-checkbox selected">
                            <Check size={14} color="#fff" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Add More from Archive */}
              {activeTab === 'add' && (
                <div className="edit-highlight-grid-container">
                  {archiveStories.length === 0 ? (
                    <div className="edit-highlight-empty">
                      <ImageIcon size={42} />
                      <p>No additional stories found</p>
                      <span>All of your available stories are already in this highlight!</span>
                    </div>
                  ) : (
                    <div className="edit-highlight-grid">
                      {archiveStories.map((s) => (
                        <div
                          key={s.id}
                          className="edit-highlight-tile"
                          onClick={() => handleAddStory(s)}
                          title="Click to add to highlight"
                        >
                          {s.mediaType === 'VIDEO' ? (
                            <video src={s.mediaUrl} className="edit-highlight-media" />
                          ) : (
                            <img src={s.mediaUrl} alt="Story" className="edit-highlight-media" />
                          )}
                          <div className="edit-highlight-checkbox">
                            <span className="add-plus-symbol">+</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Title & Cover Customization */}
              {activeTab === 'details' && (
                <div className="edit-highlight-details-view">
                  <div className="edit-highlight-cover-section">
                    <div className="edit-highlight-cover-preview">
                      {coverUrl ? (
                        <img src={coverUrl} alt="Cover preview" className="edit-highlight-cover-img" />
                      ) : (
                        <div className="edit-highlight-cover-fallback">
                          <Camera size={26} color="var(--text-secondary)" />
                        </div>
                      )}
                    </div>
                    <span className="edit-highlight-cover-hint">Select a cover image below</span>
                  </div>

                  <div className="edit-highlight-input-wrap">
                    <label htmlFor="highlight-title-input" className="edit-highlight-label">
                      Highlight Name
                    </label>
                    <input
                      id="highlight-title-input"
                      type="text"
                      className="edit-highlight-title-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={30}
                      placeholder="Highlight name"
                    />
                  </div>

                  <div className="edit-highlight-cover-picker">
                    <span className="edit-highlight-picker-title">Choose from selected stories</span>
                    <div className="edit-highlight-cover-thumbs">
                      {selectedStories.map((s) => {
                        const isCurrentCover = coverUrl === s.mediaUrl;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={`edit-highlight-thumb-btn ${isCurrentCover ? 'active' : ''}`}
                            onClick={() => setCoverUrl(s.mediaUrl)}
                            title="Set as cover"
                          >
                            <img src={s.mediaUrl} alt="Thumb" className="edit-highlight-thumb-img" />
                            {isCurrentCover && (
                              <div className="edit-highlight-thumb-badge">
                                <Check size={12} color="#fff" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditHighlightModal;

