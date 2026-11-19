import React from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  BarChart2,
  MoreHorizontal,
} from 'lucide-react';
import { formatCount } from '../../utils';

export const ReelActionRail = ({
  currentReel,
  likesMap = {},
  savedMap = {},
  sharesMap = {},
  isMenuOpen = false,
  menuAnchor = null,
  bottomMenuBtnRef,
  onLikeToggle,
  onOpenLikesModal,
  onOpenComments,
  onOpenShare,
  onSaveToggle,
  onOpenInsights,
  onToggleMenu,
  isAuthor = false,
}) => {
  if (!currentReel) return null;

  const reelLikes = likesMap[currentReel.id] || { count: 0, liked: false };
  const isSaved = !!savedMap[currentReel.id];
  const shareCount =
    sharesMap[currentReel.id] !== undefined
      ? sharesMap[currentReel.id]
      : currentReel.shareCount || 0;

  return (
    <div className="reel-actions-column">
      <div className={`reel-action-btn-item ${reelLikes.liked ? 'liked' : ''}`}>
        <button
          type="button"
          className="reel-action-icon-btn"
          onClick={() => onLikeToggle?.(currentReel.id)}
          aria-label="Like reel"
        >
          <span className="reel-action-icon-circle">
            <Heart size={22} />
          </span>
        </button>
        <span
          className="reel-action-count-label"
          onClick={(e) => {
            e.stopPropagation();
            if ((reelLikes.count || 0) > 0) {
              onOpenLikesModal?.(currentReel.id);
            }
          }}
          style={{
            cursor: (reelLikes.count || 0) > 0 ? 'pointer' : 'default',
          }}
          title={(reelLikes.count || 0) > 0 ? 'View likes' : undefined}
        >
          {formatCount(reelLikes.count || 0)}
        </span>
      </div>

      <button
        type="button"
        className="reel-action-btn-item"
        onClick={() => onOpenComments?.(currentReel.id)}
      >
        <span className="reel-action-icon-circle">
          <MessageCircle size={22} />
        </span>
        <span>{formatCount(currentReel.commentCount || 0)}</span>
      </button>

      <button
        type="button"
        className="reel-action-btn-item"
        onClick={() => onOpenShare?.(currentReel)}
        aria-label="Share reel"
      >
        <span className="reel-action-icon-circle">
          <Send size={21} />
        </span>
        <span>{formatCount(shareCount)}</span>
      </button>

      <button
        type="button"
        className={`reel-action-btn-item ${isSaved ? 'saved' : ''}`}
        onClick={() => onSaveToggle?.(currentReel.id)}
        aria-label={isSaved ? 'Remove from saved' : 'Save reel'}
        title={isSaved ? 'Saved' : 'Save'}
      >
        <span className="reel-action-icon-circle">
          <Bookmark size={21} fill={isSaved ? 'currentColor' : 'none'} />
        </span>
      </button>

      {isAuthor && (
        <button
          type="button"
          className="reel-action-btn-item"
          onClick={() => onOpenInsights?.(currentReel)}
          title="View Reel Insights"
        >
          <span className="reel-action-icon-circle">
            <BarChart2 size={21} />
          </span>
          <span>Insights</span>
        </button>
      )}

      {/* Three-Dot Options Button */}
      <button
        ref={bottomMenuBtnRef}
        type="button"
        className={`reel-action-btn-item ${isMenuOpen && menuAnchor === 'bottom' ? 'menu-active' : ''}`}
        onClick={() => onToggleMenu?.(currentReel.id, 'bottom')}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={Boolean(isMenuOpen && menuAnchor === 'bottom')}
        title="More options"
      >
        <span className="reel-action-icon-circle">
          <MoreHorizontal size={21} />
        </span>
      </button>
    </div>
  );
};

export default ReelActionRail;
