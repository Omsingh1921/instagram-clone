import React, { useState, useEffect } from 'react';
import { Grid, Film, Check, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import postService from '../../services/post.service';
import reelService from '../../services/reel.service';
import collectionService from '../../services/collection.service';
import { useToast } from '../../context/ToastContext';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import './AddToCollectionModal.css';

export const AddToCollectionModal = ({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  existingPostIds = [],
  existingReelIds = [],
  initialSavedPosts = [],
  initialSavedReels = [],
  onItemsAdded,
}) => {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels'
  const [savedPosts, setSavedPosts] = useState(initialSavedPosts || []);
  const [savedReels, setSavedReels] = useState(initialSavedReels || []);
  const [selectedPostIds, setSelectedPostIds] = useState(new Set());
  const [selectedReelIds, setSelectedReelIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSelectedPostIds(new Set());
      setSelectedReelIds(new Set());
      return;
    }

    if (Array.isArray(initialSavedPosts) && initialSavedPosts.length > 0) {
      setSavedPosts(initialSavedPosts);
    }
    if (Array.isArray(initialSavedReels) && initialSavedReels.length > 0) {
      setSavedReels(initialSavedReels);
    }

    const loadSavedItems = async () => {
      try {
        setLoading(true);
        const [postsRes, reelsRes] = await Promise.allSettled([
          postService.getSavedPosts(0, 50),
          reelService.getSavedReels(0, 50),
        ]);

        if (postsRes.status === 'fulfilled') {
          const raw = postsRes.value?.data?.content || postsRes.value?.content || postsRes.value?.data || postsRes.value || [];
          const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);
          setSavedPosts(list);
        }

        if (reelsRes.status === 'fulfilled') {
          const raw = reelsRes.value?.data?.content || reelsRes.value?.content || reelsRes.value?.data || reelsRes.value || [];
          const rList = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);
          setSavedReels(rList);
        }
      } catch (err) {
        console.error('Failed to load saved posts/reels for collection', err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedItems();
  }, [isOpen]);

  const togglePost = (postId) => {
    if (existingPostIds.includes(postId)) return;
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const toggleReel = (reelId) => {
    if (existingReelIds.includes(reelId)) return;
    setSelectedReelIds((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) {
        next.delete(reelId);
      } else {
        next.add(reelId);
      }
      return next;
    });
  };

  const totalSelected = selectedPostIds.size + selectedReelIds.size;

  const handleAddItems = async () => {
    if (totalSelected === 0 || !collectionId) return;

    try {
      setSubmitting(true);
      const postPromises = Array.from(selectedPostIds).map((pId) =>
        collectionService.addItem(collectionId, pId, null)
      );
      const reelPromises = Array.from(selectedReelIds).map((rId) =>
        collectionService.addItem(collectionId, null, rId)
      );

      await Promise.all([...postPromises, ...reelPromises]);
      showSuccess(`Added ${totalSelected} item${totalSelected > 1 ? 's' : ''} to "${collectionName}"`);
      onClose();
      if (onItemsAdded) onItemsAdded();
    } catch (err) {
      showError(err.message || 'Failed to add items to collection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add to "${collectionName || 'Collection'}"`}
      size="md"
    >
      <div className="add-to-coll-modal">
        {/* Tab Switcher */}
        <div className="add-to-coll-tabs">
          <button
            type="button"
            className={`add-to-coll-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <Grid size={15} />
            <span>Saved Posts ({savedPosts.length})</span>
          </button>
          <button
            type="button"
            className={`add-to-coll-tab ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => setActiveTab('reels')}
          >
            <Film size={15} />
            <span>Saved Reels ({savedReels.length})</span>
          </button>
        </div>

        {/* Media Grid */}
        <div className="add-to-coll-scroll-area">
          {loading ? (
            <div className="add-to-coll-loading">
              <Loader2 size={28} className="spinner" />
              <span>Loading saved items...</span>
            </div>
          ) : activeTab === 'posts' ? (
            savedPosts.length === 0 ? (
              <div className="add-to-coll-empty">
                <span>No saved posts found. Save posts from your feed first.</span>
              </div>
            ) : (
              <div className="add-to-coll-grid">
                {savedPosts.map((post) => {
                  const media = post.media?.[0];
                  const mediaUrl = media?.mediaUrl || post.mediaUrl || post.thumbnailUrl;
                  const isAlreadyIn = existingPostIds.includes(post.id);
                  const isChecked = selectedPostIds.has(post.id);

                  return (
                    <div
                      key={post.id}
                      className={`add-to-coll-item ${isAlreadyIn ? 'already-added' : ''} ${
                        isChecked ? 'selected' : ''
                      }`}
                      onClick={() => togglePost(post.id)}
                    >
                      <ProgressiveImage
                        src={mediaUrl}
                        alt={post.caption || 'Saved post'}
                        className="add-to-coll-media"
                        loading="lazy"
                      />
                      <div className={`coll-check-circle ${isChecked ? 'checked' : ''}`}>
                        {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                      </div>
                      {isAlreadyIn && (
                        <div className="coll-already-badge">In collection</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : savedReels.length === 0 ? (
            <div className="add-to-coll-empty">
              <span>No saved reels found. Save reels from the Reels tab first.</span>
            </div>
          ) : (
            <div className="add-to-coll-grid">
              {savedReels.map((reel) => {
                const isAlreadyIn = existingReelIds.includes(reel.id);
                const isChecked = selectedReelIds.has(reel.id);

                return (
                  <div
                    key={reel.id}
                    className={`add-to-coll-item ${isAlreadyIn ? 'already-added' : ''} ${
                      isChecked ? 'selected' : ''
                    }`}
                    onClick={() => toggleReel(reel.id)}
                  >
                    <img
                      src={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                      alt={reel.caption || 'Saved reel'}
                      className="add-to-coll-media"
                    />
                    <div className={`coll-check-circle ${isChecked ? 'checked' : ''}`}>
                      {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                    </div>
                    {isAlreadyIn && (
                      <div className="coll-already-badge">In collection</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="add-to-coll-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddItems}
            disabled={totalSelected === 0 || submitting}
          >
            {submitting ? 'Adding...' : `Add to Collection (${totalSelected})`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddToCollectionModal;
