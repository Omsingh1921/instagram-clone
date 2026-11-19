import React from 'react';
import { RotateCw, Play, Heart, Music } from 'lucide-react';
import Avatar from '../common/Avatar';
import { getVideoPosterUrl, getAdaptiveVideoUrl } from '../../utils/mediaUrl';

export const ReelVideoCard = ({
  currentReel,
  activeIndex,
  videoRef,
  isMuted = true,
  isPlaying = true,
  showHeartAnim = false,
  videoProgress = 0,
  slideDirection = null,
  isDraggingReel = false,
  onTogglePlay,
  onDoubleTap,
  onTouchStart,
  onTimeUpdate,
  onSeekProgress,
  currentUser,
  isFollowing,
  onFollowToggle,
  navigate,
  children,
}) => {
  if (!currentReel) return null;

  return (
    <div
      className={`reel-card-item ${isDraggingReel ? 'is-dragging' : ''} ${
        slideDirection === 'next'
          ? 'reel-slide-in-from-bottom'
          : slideDirection === 'prev'
          ? 'reel-slide-in-from-top'
          : ''
      }`}
    >
      {/* Live Uploading Banner if reel is currently uploading */}
      {currentReel.isUploading && (
        <div className="reel-uploading-header-banner">
          <div className="reel-uploading-banner-top">
            <div className="reel-uploading-banner-title">
              <RotateCw size={14} className="story-upload-spinning-icon" />
              <span>Uploading Reel... {currentReel.uploadProgress || 10}%</span>
            </div>
            <span className="reel-uploading-status-pill">In Progress</span>
          </div>
          <div className="reel-uploading-progress-track">
            <div
              className="reel-uploading-progress-bar"
              style={{ width: `${Math.max(8, currentReel.uploadProgress || 10)}%` }}
            />
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        key={`${currentReel.id}-${activeIndex}`}
        src={
          currentReel.videoUrl?.startsWith('blob:')
            ? currentReel.videoUrl
            : getAdaptiveVideoUrl(currentReel.videoUrl)
        }
        poster={
          currentReel.videoUrl?.startsWith('blob:')
            ? undefined
            : getVideoPosterUrl(currentReel.videoUrl, currentReel.thumbnailUrl)
        }
        className="reel-video-element"
        autoPlay
        loop
        muted={isMuted}
        playsInline
        onClick={onTogglePlay}
        onDoubleClick={() => !currentReel.isUploading && onDoubleTap?.(currentReel.id)}
        onTouchStart={onTouchStart}
        onTimeUpdate={onTimeUpdate}
      />

      {/* Play/Pause Indicator if paused */}
      {!isPlaying && (
        <div className="reel-play-indicator" onClick={onTogglePlay}>
          <Play size={48} fill="#fff" />
        </div>
      )}

      {/* Double Tap Instagram Heart Burst */}
      {showHeartAnim && (
        <div className="reel-heart-burst">
          <div className="reel-heart-burst-glow" />
          <div className="reel-heart-burst-main">
            <Heart size={92} fill="#ff3040" color="#ff3040" />
          </div>
          <div className="reel-heart-particle p1">
            <Heart size={26} fill="#ff3040" color="#ff3040" />
          </div>
          <div className="reel-heart-particle p2">
            <Heart size={22} fill="#ff3040" color="#ff3040" />
          </div>
          <div className="reel-heart-particle p3">
            <Heart size={24} fill="#ff3040" color="#ff3040" />
          </div>
        </div>
      )}

      <div className="reel-overlay-gradient" />

      {/* Instagram Video Scrub Progress Bar */}
      <div
        className="reel-progress-track"
        onClick={onSeekProgress}
        role="progressbar"
        aria-valuenow={Math.round(videoProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Reel video progress"
      >
        <div
          className="reel-progress-bar"
          style={{ width: `${videoProgress}%` }}
        />
      </div>

      {/* Bottom Info: Creator, Caption, Audio */}
      <div className="reel-bottom-info">
        <div className="reel-author-row">
          <Avatar
            src={
              currentReel.author?.avatarUrl ||
              currentReel.author?.profilePictureUrl
            }
            alt={currentReel.author?.username}
            size="sm"
            hasStory={Boolean(currentReel.author?.hasActiveStory || currentReel.author?.hasStory)}
            isUploading={Boolean(currentReel.isUploading)}
            onClick={() => !currentReel.isUploading && navigate?.(`/profile/${currentReel.author?.id}`)}
          />
          <span
            className="reel-author-username"
            onClick={() => navigate?.(`/profile/${currentReel.author?.id}`)}
          >
            {currentReel.author?.username}
          </span>
          {currentUser?.id !== currentReel.author?.id && (
            <button
              type="button"
              className="reel-follow-btn"
              onClick={() => onFollowToggle?.(currentReel.author?.id)}
            >
              {isFollowing?.(currentReel.author?.id)
                ? 'Following'
                : 'Follow'}
            </button>
          )}
        </div>

        {currentReel.caption && (
          <p className="reel-caption-text">{currentReel.caption}</p>
        )}

        <div
          className="reel-audio-track"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            const audioTitle = currentReel.audioTitle || 'Original Audio';
            const audioArtist = currentReel.audioArtist || currentReel.author?.username || 'Artist';
            navigate?.(`/audio?title=${encodeURIComponent(audioTitle)}&artist=${encodeURIComponent(audioArtist)}`);
          }}
        >
          <Music size={12} />
          <span>
            {currentReel.audioTitle || 'Original Audio'} ·{' '}
            {currentReel.audioArtist || currentReel.author?.username || 'Artist'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
};

export default ReelVideoCard;
