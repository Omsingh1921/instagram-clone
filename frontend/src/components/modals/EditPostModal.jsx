import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import postService from '../../services/post.service';
import Avatar from '../common/Avatar';
import { useToast } from '../../context/ToastContext';
import './EditPostModal.css';

export const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '');
      setLocation(post.location || '');
      setCommentsDisabled(Boolean(post.commentsDisabled));
      setHideLikeCount(Boolean(post.hideLikeCount));
    }
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!post?.id) return;

    try {
      setLoading(true);
      const res = await postService.updatePost(post.id, {
        caption: caption.trim(),
        location: location.trim() || null,
        commentsDisabled,
        hideLikeCount,
      });

      showSuccess('Post updated successfully');
      if (onPostUpdated) {
        onPostUpdated(res?.data || res);
      }
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const mediaItem = post?.media?.[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit info" size="md">
      <form onSubmit={handleSubmit} className="ig-edit-post-form">
        <div className="ig-edit-post-layout">
          {/* Media Preview Thumbnail */}
          <div className="ig-edit-media-preview">
            {mediaItem?.mediaType === 'VIDEO' ? (
              <video src={mediaItem?.mediaUrl} className="ig-edit-thumb" muted />
            ) : (
              <img src={mediaItem?.mediaUrl} alt="Post preview" className="ig-edit-thumb" />
            )}
            {post?.media?.length > 1 && (
              <span className="ig-edit-carousel-badge">1/{post.media.length}</span>
            )}
          </div>

          {/* Form Fields */}
          <div className="ig-edit-fields-column">
            {/* Author info */}
            <div className="ig-edit-author-row">
              <Avatar
                src={post?.author?.avatarUrl}
                username={post?.author?.username}
                size="sm"
              />
              <span className="ig-edit-author-username">{post?.author?.username}</span>
            </div>

            {/* Caption */}
            <div className="ig-edit-field-group">
              <textarea
                className="ig-edit-caption-input"
                rows={4}
                maxLength={2200}
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <div className="ig-edit-caption-count">{caption.length}/2,200</div>
            </div>

            {/* Location */}
            <div className="ig-edit-field-group">
              <div className="ig-edit-input-wrapper">
                <MapPin size={16} className="ig-edit-input-icon" />
                <input
                  type="text"
                  className="ig-edit-text-input"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="ig-edit-settings-section">
              <h4 className="ig-edit-settings-title">Advanced Settings</h4>

              {/* Hide Like Count */}
              <label className="ig-edit-switch-row">
                <div className="ig-edit-switch-info">
                  <span className="ig-edit-switch-label">Hide like and view counts</span>
                  <span className="ig-edit-switch-desc">
                    Only you will see the total number of likes and views on this post.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="ig-switch-checkbox"
                  checked={hideLikeCount}
                  onChange={(e) => setHideLikeCount(e.target.checked)}
                />
              </label>

              {/* Turn Off Commenting */}
              <label className="ig-edit-switch-row">
                <div className="ig-edit-switch-info">
                  <span className="ig-edit-switch-label">Turn off commenting</span>
                  <span className="ig-edit-switch-desc">
                    You can turn this on or off anytime from the post options menu.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="ig-switch-checkbox"
                  checked={commentsDisabled}
                  onChange={(e) => setCommentsDisabled(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="ig-edit-footer-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Done'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPostModal;
