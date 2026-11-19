import React from 'react';
import {
  RotateCw,
  Eye,
  Sparkles,
  Edit2,
  Plus,
  Heart,
} from 'lucide-react';

export const DEFAULT_QUICK_EMOJIS = ['😂', '😮', '😍', '😢', '👏', '🔥', '🎉', '💯'];

export const StoryViewerFooter = ({
  isMyStory,
  currentStory,
  currentGroup,
  isHighlight,
  handleOpenViewers,
  setIsPaused,
  setShowAddToHighlight,
  setShowEditHighlight,
  isMentionedInCurrentStory,
  sharedStoriesMap = {},
  handleShareMentionedStory,
  sharingMention = false,
  quickEmojis = DEFAULT_QUICK_EMOJIS,
  handleReactEmoji,
  replyText = '',
  setReplyText,
  showViewers,
  showMoreMenu,
  handleSendReply,
  likedStory = false,
  handleLikeStory,
}) => {
  return (
    <div
      className={`story-viewer-footer ${!isMyStory ? 'other-user-footer' : ''}`}
      style={{ flexDirection: 'column', alignItems: 'stretch' }}
    >
      {currentStory.isUploading ? (
        <div className="story-viewer-uploading-card">
          <div className="story-viewer-uploading-header">
            <div className="story-viewer-uploading-left">
              <RotateCw size={14} className="story-upload-spinning-icon" />
              <span className="story-viewer-uploading-title">
                Uploading your story...
              </span>
            </div>
            <span className="story-viewer-uploading-pct">
              {currentStory.uploadProgress || 10}%
            </span>
          </div>
          <div className="story-viewer-uploading-progress-track">
            <div
              className="story-viewer-uploading-progress-bar"
              style={{ width: `${Math.max(8, currentStory.uploadProgress || 10)}%` }}
            />
          </div>
        </div>
      ) : isMyStory ? (
        <div className="story-viewer-owner-bar">
          <button
            type="button"
            className="story-seen-badge-btn"
            onClick={handleOpenViewers}
            title="View story activity and viewers"
          >
            <div className="story-seen-icon-stack">
              <Eye size={18} />
            </div>
            <span className="story-seen-count">
              {currentStory.viewCount > 0
                ? `Seen by ${currentStory.viewCount}`
                : '0 views'}
            </span>
          </button>

          {!isHighlight ? (
            <button
              type="button"
              className="story-highlight-trigger-btn"
              onClick={() => {
                setIsPaused?.(true);
                setShowAddToHighlight?.(true);
              }}
              title="Add to Highlight"
            >
              <div className="story-highlight-icon-bubble">
                <Sparkles size={16} />
              </div>
              <span className="story-highlight-label">Highlight</span>
            </button>
          ) : (
            <button
              type="button"
              className="story-highlight-trigger-btn"
              onClick={() => {
                setIsPaused?.(true);
                setShowEditHighlight?.(true);
              }}
              title="Edit Highlight"
            >
              <div className="story-highlight-icon-bubble">
                <Edit2 size={15} />
              </div>
              <span className="story-highlight-label">Edit Highlight</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Add Mentioned Story to Your Story */}
          {isMentionedInCurrentStory && (
            <div className="story-add-mention-wrapper">
              <button
                type="button"
                className={`story-add-mention-btn ${sharedStoriesMap[currentStory.id] ? 'is-shared' : ''}`}
                onClick={handleShareMentionedStory}
                disabled={sharingMention || sharedStoriesMap[currentStory.id]}
                aria-label={sharedStoriesMap[currentStory.id] ? 'Added to your story' : 'Add this to your story'}
              >
                {sharedStoriesMap[currentStory.id] ? (
                  <>
                    <span className="story-add-mention-check">✓</span>
                    <span>Added to your story</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>
                      {sharingMention ? 'Adding to story...' : 'Add this to your story'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Emoji Reactions Bar */}
          <div className="story-quick-reactions">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="story-reaction-btn"
                onClick={() => handleReactEmoji?.(emoji)}
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Box and Like Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div className="story-reply-box">
              <input
                type="text"
                placeholder={`Reply to ${currentGroup.author?.username || 'user'}...`}
                className="story-reply-input"
                value={replyText}
                onChange={(e) => setReplyText?.(e.target.value)}
                onFocus={() => setIsPaused?.(true)}
                onBlur={() => !showViewers && !showMoreMenu && setIsPaused?.(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendReply?.();
                }}
              />
              {replyText.trim() && (
                <button
                  type="button"
                  className="story-reply-send-btn"
                  onClick={handleSendReply}
                >
                  Send
                </button>
              )}
            </div>
            <button
              type="button"
              className={`story-like-btn ${likedStory ? 'liked' : ''}`}
              onClick={handleLikeStory}
              title="Like story"
            >
              <Heart
                size={24}
                fill={likedStory ? '#ef4444' : 'none'}
                color={likedStory ? '#ef4444' : '#fff'}
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StoryViewerFooter;
