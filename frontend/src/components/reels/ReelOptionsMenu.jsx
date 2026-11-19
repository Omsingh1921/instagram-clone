import React from 'react';
import {
  Trash2,
  Archive,
  Flag,
  EyeOff,
  Bookmark,
  Folder,
  Copy,
} from 'lucide-react';

export const ReelOptionsMenu = ({
  isOpen = false,
  currentReel,
  menuState,
  menuPosition = { placement: 'beside-right', style: {} },
  isMobileViewport = false,
  menuRef,
  canDeleteReel = false,
  isReelAuthor = false,
  isSaved = false,
  onDeleteReel,
  onArchiveReel,
  onReportReel,
  onNotInterested,
  onSaveToggle,
  onSaveToCollection,
  onCopyLink,
  onClose,
}) => {
  if (!isOpen || !currentReel || !menuState) return null;

  return (
    <>
      {isMobileViewport && (
        <div
          className="reel-options-mobile-scrim"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={menuRef}
        role="menu"
        aria-label="Reel actions"
        data-reel-id={currentReel.id}
        data-anchor={menuState.anchor}
        data-placement={menuPosition.placement}
        className={`reel-options-popover ${isMobileViewport ? 'mobile-sheet' : ''}`}
        style={isMobileViewport ? undefined : menuPosition.style}
      >
        {canDeleteReel && (
          <button
            type="button"
            role="menuitem"
            className="reel-option-item danger"
            onClick={() => onDeleteReel?.(menuState.reelId)}
          >
            <Trash2 size={16} />
            <span>Delete reel</span>
          </button>
        )}
        {isReelAuthor && (
          <button
            type="button"
            role="menuitem"
            className="reel-option-item"
            onClick={() => onArchiveReel?.(menuState.reelId)}
          >
            <Archive size={16} />
            <span>{currentReel.isArchived ? 'Show on profile' : 'Archive reel'}</span>
          </button>
        )}
        {!isReelAuthor && (
          <>
            <button
              type="button"
              role="menuitem"
              className="reel-option-item danger"
              onClick={() => onReportReel?.(menuState.reelId)}
            >
              <Flag size={16} />
              <span>Report reel</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="reel-option-item"
              onClick={() => onNotInterested?.(menuState.reelId)}
            >
              <EyeOff size={16} />
              <span>Not interested</span>
            </button>
          </>
        )}
        <button
          type="button"
          role="menuitem"
          className="reel-option-item"
          onClick={() => onSaveToggle?.(menuState.reelId)}
        >
          <Bookmark
            size={16}
            fill={isSaved ? 'currentColor' : 'none'}
          />
          <span>{isSaved ? 'Remove from saved' : 'Save reel'}</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="reel-option-item"
          onClick={() => onSaveToCollection?.(menuState.reelId)}
        >
          <Folder size={16} />
          <span>Save to collection...</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="reel-option-item"
          onClick={() => onCopyLink?.(menuState.reelId)}
        >
          <Copy size={16} />
          <span>Copy link</span>
        </button>
        <div className="reel-option-divider" aria-hidden="true" />
        <button
          type="button"
          role="menuitem"
          className="reel-option-item cancel"
          onClick={onClose}
        >
          <span>Cancel</span>
        </button>
      </div>
    </>
  );
};

export default ReelOptionsMenu;
