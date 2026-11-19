import React from 'react';
import {
  RotateCw,
  Star,
  Music,
  Sparkles,
  Volume2,
  VolumeX,
  MoreVertical,
  X,
  Edit2,
  MinusCircle,
  Trash2,
  BarChart2,
  Flag,
} from 'lucide-react';
import Avatar from '../../common/Avatar';
import { timeAgo } from '../../../utils';

export const StoryHeader = ({
  currentGroup,
  currentStory,
  isHighlight = false,
  highlightTitle = '',
  isVideoStory = false,
  isMuted = false,
  setIsMuted,
  showMoreMenu = false,
  setShowMoreMenu,
  setIsPaused,
  onClose,
  isMyStory = false,
  isAdmin = false,
  setShowEditHighlight,
  handleRemoveFromHighlight,
  handleDeleteHighlight,
  setShowAddToHighlight,
  handleOpenInsights,
  handleDeleteStory,
  setShowReportModal,
}) => {
  return (
    <>
      <div className="story-viewer-header">
        <div className="story-viewer-author">
          <Avatar
            src={currentGroup.author?.avatarUrl || currentGroup.author?.profilePictureUrl}
            alt={currentGroup.author?.username}
            size="sm"
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="story-viewer-username">{currentGroup.author?.username}</span>
              {isHighlight && (
                <span className="story-viewer-highlight-badge" title={highlightTitle}>
                  {highlightTitle || 'Highlight'}
                </span>
              )}
              {currentStory.isUploading ? (
                <span className="story-uploading-tag">
                  <RotateCw size={10} className="story-upload-spinning-icon" />
                  <span>
                    Uploading {currentStory.uploadProgress ? `${currentStory.uploadProgress}%` : ''}
                  </span>
                </span>
              ) : (
                <span className="story-viewer-time">{timeAgo(currentStory.createdAt)}</span>
              )}
              {currentStory.isCloseFriends && (
                <span className="story-close-friends-badge">
                  <Star size={10} fill="#fff" /> Close Friends
                </span>
              )}
              {currentStory.caption?.startsWith('Reposted from') && (
                <span className="story-repost-tag" title={currentStory.caption}>
                  {currentStory.caption}
                </span>
              )}
            </div>
            {(currentStory.audioTitle || currentStory.filterName) && (
              <div className="story-meta-pill">
                {currentStory.audioTitle ? (
                  <>
                    <Music size={10} />
                    <span>
                      {currentStory.audioTitle}
                      {currentStory.audioArtist ? ` • ${currentStory.audioArtist}` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} />
                    <span>{currentStory.filterName}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="story-viewer-controls">
          {isVideoStory && (
            <button
              type="button"
              className="story-ctrl-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted?.(!isMuted);
              }}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
          <button
            type="button"
            className="story-ctrl-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu?.(!showMoreMenu);
              setIsPaused?.(!showMoreMenu);
            }}
            aria-label="Story options"
          >
            <MoreVertical size={18} />
          </button>
          <button
            type="button"
            className="story-ctrl-btn"
            onClick={onClose}
            aria-label="Close stories"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* More Options Menu Dropdown */}
      {showMoreMenu && (
        <div className="story-more-menu" onClick={(e) => e.stopPropagation()}>
          {currentStory.isUploading ? (
            <button
              type="button"
              className="story-more-item"
              onClick={() => {
                setShowMoreMenu?.(false);
                onClose?.();
              }}
            >
              <X size={16} />
              <span>Close Viewer</span>
            </button>
          ) : isMyStory ? (
            <>
              {isHighlight ? (
                <>
                  <button
                    type="button"
                    className="story-more-item"
                    onClick={() => {
                      setShowMoreMenu?.(false);
                      setIsPaused?.(true);
                      setShowEditHighlight?.(true);
                    }}
                  >
                    <Edit2 size={16} />
                    <span>Edit Highlight</span>
                  </button>
                  <button
                    type="button"
                    className="story-more-item danger"
                    onClick={() => {
                      setShowMoreMenu?.(false);
                      handleRemoveFromHighlight?.();
                    }}
                  >
                    <MinusCircle size={16} />
                    <span>Remove from Highlight</span>
                  </button>
                  <button
                    type="button"
                    className="story-more-item danger"
                    onClick={() => {
                      setShowMoreMenu?.(false);
                      handleDeleteHighlight?.();
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Highlight</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="story-more-item"
                    onClick={() => {
                      setShowMoreMenu?.(false);
                      setIsPaused?.(true);
                      setShowAddToHighlight?.(true);
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Add to Highlight</span>
                  </button>
                  <button
                    type="button"
                    className="story-more-item"
                    onClick={handleOpenInsights}
                  >
                    <BarChart2 size={16} />
                    <span>Story Insights</span>
                  </button>
                  <button
                    type="button"
                    className="story-more-item danger"
                    onClick={() => {
                      setShowMoreMenu?.(false);
                      handleDeleteStory?.();
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Story</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {isAdmin && isHighlight && (
                <button
                  type="button"
                  className="story-more-item danger"
                  onClick={() => {
                    setShowMoreMenu?.(false);
                    handleDeleteHighlight?.();
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Highlight (Admin)</span>
                </button>
              )}
              {isAdmin && !isHighlight && (
                <button
                  type="button"
                  className="story-more-item danger"
                  onClick={() => {
                    setShowMoreMenu?.(false);
                    handleDeleteStory?.();
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Story (Admin)</span>
                </button>
              )}
              <button
                type="button"
                className="story-more-item danger"
                onClick={() => {
                  setShowMoreMenu?.(false);
                  setShowReportModal?.(true);
                  setIsPaused?.(true);
                }}
              >
                <Flag size={16} />
                <span>Report Story</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StoryHeader;
