import React from 'react';
import {
  Film,
  Play,
  Heart,
  MessageCircle,
  Pin,
  MoreHorizontal,
  Trash2,
  Archive,
  Copy,
  RotateCw,
} from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import { formatCount } from '../../utils';

export const ProfileReelsTab = ({
  reels = [],
  activeReelUploads = [],
  isOwnProfile = false,
  isViewerAdmin = false,
  myUserId,
  gridMenuReel,
  setGridMenuReel,
  onTogglePinReel,
  onDeleteReel,
  onToggleArchiveReel,
  navigate,
  showSuccess,
}) => {
  if (reels.length === 0 && activeReelUploads.length === 0) {
    return (
      <EmptyState
        icon={Film}
        title="No Reels Yet"
        description="Videos uploaded by this user will appear here."
      />
    );
  }

  return (
    <div className="profile-reels-grid">
      {/* Optimistic uploading reels */}
      {activeReelUploads.map((up) => {
        const src = up.thumbnail || up.videoUrl || up.mediaUrl;
        return (
          <div
            key={up.id}
            className="profile-reel-item profile-reel-uploading-item"
            onClick={() => navigate?.('/reels')}
            title={`Reel is uploading (${up.progress || 10}%)...`}
          >
            <video src={src} className="profile-reel-media" muted autoPlay loop playsInline />
            <div className="profile-grid-uploading-overlay">
              <RotateCw size={22} className="story-upload-spinning-icon" />
              <span className="profile-grid-uploading-pct">{up.progress || 10}%</span>
              <div className="profile-grid-uploading-track">
                <div
                  className="profile-grid-uploading-bar"
                  style={{ width: `${Math.max(10, up.progress || 10)}%` }}
                />
              </div>
              <span className="profile-grid-uploading-msg">{up.statusMessage || 'Sharing...'}</span>
            </div>
          </div>
        );
      })}

      {reels.map((reel) => {
        const reelUserId = String(
          reel.userId || reel.author?.id || reel.author?.userId || ''
        ).toLowerCase();
        const isReelOwner = Boolean(
          isOwnProfile || isViewerAdmin || (myUserId && reelUserId && myUserId === reelUserId)
        );

        return (
          <div
            key={reel.id}
            className={`profile-reel-item ${gridMenuReel?.id === reel.id ? 'dropdown-active' : ''}`}
            onClick={() => navigate?.(`/reels/${reel.id}`)}
          >
            <video
              src={reel.videoUrl}
              poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
              className="profile-reel-media"
              muted
              playsInline
              preload="none"
            />

            {/* Top-Right Badges Bar: Reel Options & Pin badge */}
            <div className="profile-grid-top-badges" onClick={(e) => e.stopPropagation()}>
              {reel.isPinned && (
                <div className="profile-corner-badge pinned" title="Pinned to profile">
                  <Pin size={13} color="#fff" />
                </div>
              )}
              {isReelOwner && (
                <div className="profile-grid-opts-wrapper" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="profile-grid-item-opts-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGridMenuReel?.((prev) => (prev?.id === reel.id ? null : reel));
                    }}
                    aria-label="Reel options"
                    title="Reel options"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {gridMenuReel?.id === reel.id && (
                    <div
                      className="profile-grid-dropdown-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => onTogglePinReel?.(reel.id)}
                      >
                        <Pin size={14} />
                        <span>
                          {reel.isPinned ? 'Unpin from your profile' : 'Pin to your profile'}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="profile-dropdown-item danger"
                        onClick={() => onDeleteReel?.(reel.id)}
                      >
                        <Trash2 size={14} />
                        <span>Delete reel</span>
                      </button>
                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => onToggleArchiveReel?.(reel.id)}
                      >
                        <Archive size={14} />
                        <span>{reel.isArchived ? 'Show on profile' : 'Archive reel'}</span>
                      </button>
                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => {
                          const url = `${window.location.origin}/reels/${reel.id}`;
                          navigator.clipboard.writeText(url);
                          showSuccess?.('Reel link copied to clipboard!');
                          setGridMenuReel?.(null);
                        }}
                      >
                        <Copy size={14} />
                        <span>Copy link</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="profile-reel-view-count">
              <Play size={11} fill="#fff" strokeWidth={0} />
              <span>{formatCount(reel.viewCount || 0)}</span>
            </div>
            <div className="profile-grid-overlay">
              <div className="overlay-stat">
                <Heart size={20} fill="#fff" />
                <span>{formatCount(reel.likeCount || 0)}</span>
              </div>
              <div className="overlay-stat">
                <MessageCircle size={20} fill="#fff" />
                <span>{formatCount(reel.commentCount || 0)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileReelsTab;
