import React from 'react';
import { Star } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

export const StorySettingsFooter = ({
  handleClose,
  loading,
  isCloseFriendsOnly,
  doSubmit,
}) => {
  return (
    <div className="story-sticky-footer">
      <button
        type="button"
        className="story-btn-cancel"
        onClick={handleClose}
        disabled={loading}
      >
        Cancel
      </button>
      <div className="story-footer-actions">
        <button
          type="button"
          className="story-btn-close-friends"
          disabled={loading}
          onClick={async () => {
            await doSubmit(true);
          }}
        >
          {loading && isCloseFriendsOnly ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Star size={16} fill="#fff" />
              <span>Close Friends</span>
            </>
          )}
        </button>
        <button
          type="button"
          className="story-btn-share"
          disabled={loading}
          onClick={async () => {
            await doSubmit(false);
          }}
        >
          {loading && !isCloseFriendsOnly ? (
            <LoadingSpinner size="sm" />
          ) : (
            <span>Your Story</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default StorySettingsFooter;
