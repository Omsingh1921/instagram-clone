import React, { useState, useEffect } from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';
import Modal from '../common/Modal';
import { SkeletonMediaGrid } from '../ui/Skeleton';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './CreateHighlightModal.css';

const HIGHLIGHT_CATEGORY_PRESETS = [
  'Travel 🌄',
  'Coding 💻',
  'Food 🍲',
  'Nature 🌅',
  'Life ✨',
];

export const CreateHighlightModal = ({
  isOpen,
  onClose,
  onHighlightCreated,
  initialStory = null,
}) => {
  const [title, setTitle] = useState('');
  const [availableStories, setAvailableStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = select stories, 2 = title & cover
  const [coverUrl, setCoverUrl] = useState('');

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;

    const loadStories = async () => {
      try {
        setLoadingStories(true);
        const [activeRes, archiveRes] = await Promise.all([
          storyService.getUserStories(currentUser.id).catch(() => null),
          storyService.getStoryArchive(0, 30).catch(() => null),
        ]);
        const activeList = activeRes?.data?.stories || activeRes?.stories || activeRes?.data || [];
        const archiveList = archiveRes?.data?.content || archiveRes?.content || archiveRes?.data || [];
        const merged = [];
        const seen = new Set();

        if (initialStory?.id) {
          seen.add(initialStory.id);
          merged.push(initialStory);
        }

        [...(Array.isArray(activeList) ? activeList : []), ...(Array.isArray(archiveList) ? archiveList : [])].forEach(
          (item) => {
            if (item?.id && !seen.has(item.id)) {
              seen.add(item.id);
              merged.push(item);
            }
          }
        );
        setAvailableStories(merged);
      } catch {
        setAvailableStories(initialStory?.id ? [initialStory] : []);
      } finally {
        setLoadingStories(false);
      }
    };

    loadStories();
    setTitle('');
    if (initialStory?.id) {
      setSelectedStoryIds([initialStory.id]);
      setCoverUrl(initialStory.mediaUrl || '');
      setStep(2);
    } else {
      setSelectedStoryIds([]);
      setCoverUrl('');
      setStep(1);
    }
  }, [isOpen, currentUser, initialStory]);

  const toggleSelectStory = (id) => {
    setSelectedStoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selectedStoryIds.length === 0) {
      showError('Please select at least one story for your highlight');
      return;
    }
    const firstSelected = availableStories.find((s) => s.id === selectedStoryIds[0]);
    if (firstSelected?.mediaUrl && !coverUrl) {
      setCoverUrl(firstSelected.mediaUrl);
    }
    setStep(2);
  };

  const handleCreateHighlight = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showError('Please enter a title for the highlight');
      return;
    }

    try {
      setSubmitting(true);
      await storyService.createHighlight({
        title: title.trim(),
        coverImageUrl: coverUrl || undefined,
        storyIds: selectedStoryIds,
      });

      showSuccess(`Highlight "${title.trim()}" created!`);
      if (onHighlightCreated) onHighlightCreated();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to create highlight');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={false}>
      <div className="create-highlight-container">
        {/* Header */}
        <div className="highlight-modal-header">
          {step === 2 && (
            <button
              type="button"
              className="highlight-header-btn"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          )}
          <span className="highlight-modal-title">
            {step === 1 ? 'Select Stories' : 'New Highlight'}
          </span>
          {step === 1 ? (
            <button
              type="button"
              className="highlight-header-btn next"
              onClick={handleNext}
              disabled={selectedStoryIds.length === 0}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="highlight-header-btn next"
              onClick={handleCreateHighlight}
              disabled={!title.trim() || submitting}
            >
              {submitting ? 'Saving...' : 'Done'}
            </button>
          )}
        </div>

        {/* Step 1: Select stories */}
        {step === 1 && (
          <div className="highlight-step-select">
            {loadingStories ? (
              <SkeletonMediaGrid count={6} />
            ) : availableStories.length === 0 ? (
              <div className="highlight-empty-stories">
                <ImageIcon size={48} />
                <p>No active stories found</p>
                <span>You can create a story first, then add it to your profile highlights!</span>
              </div>
            ) : (
              <div className="highlight-stories-grid">
                {availableStories.map((s) => {
                  const isSelected = selectedStoryIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`highlight-story-tile ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSelectStory(s.id)}
                    >
                      {s.mediaType === 'VIDEO' ? (
                        <video src={s.mediaUrl} className="highlight-tile-media" />
                      ) : (
                        <img src={s.mediaUrl} alt="Story" className="highlight-tile-media" />
                      )}
                      <div className="highlight-tile-checkbox">
                        {isSelected && <Check size={14} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Name & Cover */}
        {step === 2 && (
          <div className="highlight-step-details">
            <div className="highlight-cover-preview">
              <img src={coverUrl} alt="Highlight Cover" className="highlight-cover-img" />
              <div className="highlight-cover-ring" />
            </div>

            <div className="highlight-input-group">
              <input
                type="text"
                className="highlight-title-input"
                placeholder="Highlight name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={30}
                autoFocus
              />
            </div>

            <div className="highlight-category-presets" aria-label="Highlight category presets">
              {HIGHLIGHT_CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`highlight-preset-chip ${title === preset ? 'active' : ''}`}
                  onClick={() => setTitle(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateHighlightModal;
