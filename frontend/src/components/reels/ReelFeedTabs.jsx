import React from 'react';
import { Volume2, VolumeX, MoreHorizontal } from 'lucide-react';

export const ReelFeedTabs = ({
  feedType,
  onSwitchFeed,
  currentReel,
  isMuted,
  onToggleMute,
  topMenuBtnRef,
  isMenuOpen,
  menuAnchor,
  onToggleMenu,
}) => {
  return (
    <div className="reels-stage-topbar">
      <div className="reels-topbar-spacer" aria-hidden="true" />
      <div className="reels-top-feed-switcher" role="tablist" aria-label="Reels feed filter">
        <button
          type="button"
          role="tab"
          aria-selected={feedType === 'for-you'}
          className={`reels-feed-tab ${feedType === 'for-you' ? 'active' : ''}`}
          onClick={() => onSwitchFeed('for-you')}
        >
          For You
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={feedType === 'following'}
          className={`reels-feed-tab ${feedType === 'following' ? 'active' : ''}`}
          onClick={() => onSwitchFeed('following')}
        >
          Following
        </button>
      </div>
      {currentReel ? (
        <div className="reel-top-right-controls">
          <button
            type="button"
            className="reel-top-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            ref={topMenuBtnRef}
            type="button"
            className={`reel-top-btn ${isMenuOpen && menuAnchor === 'top' ? 'active' : ''}`}
            onClick={() => onToggleMenu(currentReel.id, 'top')}
            aria-label="Reel options"
            aria-haspopup="menu"
            aria-expanded={Boolean(isMenuOpen && menuAnchor === 'top')}
            title="More options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      ) : (
        <div className="reels-topbar-spacer" aria-hidden="true" />
      )}
    </div>
  );
};

export default ReelFeedTabs;
