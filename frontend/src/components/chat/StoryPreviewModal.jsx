import React from 'react';
import { X } from 'lucide-react';

export const StoryPreviewModal = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div
      className="story-dm-modal-backdrop"
      onClick={onClose}
    >
      <div className="story-dm-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="story-dm-modal-close"
          onClick={onClose}
          aria-label="Close story preview"
        >
          <X size={24} />
        </button>
        {url.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
          <video
            src={url}
            controls
            autoPlay
            className="story-dm-modal-media"
          />
        ) : (
          <img
            src={url}
            alt="Story full view"
            className="story-dm-modal-media"
          />
        )}
      </div>
    </div>
  );
};

export default StoryPreviewModal;
