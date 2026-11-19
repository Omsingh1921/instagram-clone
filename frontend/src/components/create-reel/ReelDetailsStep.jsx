import React from 'react';
import { MapPin, X, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatTime, TrimmedVideoPlayer } from '../create-post';
import { getFilterStyle } from '../../utils/instagramFilters';

export const ReelDetailsStep = ({
  previewUrl,
  videoTrim,
  selectedFilter,
  selectedRatio,
  currentUser,
  caption,
  setCaption,
  location,
  setLocation,
  POPULAR_LOCATIONS = [],
  customThumbnailUrl,
  showAdvanced,
  setShowAdvanced,
  hideLikeCount,
  setHideLikeCount,
  commentsDisabled,
  setCommentsDisabled,
  onSubmit,
  loading,
}) => {
  return (
    <form onSubmit={(e) => onSubmit(e, false)} className="ig-details-workspace">
      {/* Left: Trimmed Reel Video Player */}
      <div className="ig-details-media-pane">
        <TrimmedVideoPlayer
          src={previewUrl}
          videoTrim={videoTrim}
          filterStyle={getFilterStyle(selectedFilter)}
          aspectRatio={selectedRatio.ratio || '9 / 16'}
          fitMode={selectedRatio.id === 'ORIGINAL' ? 'contain' : 'cover'}
        />
      </div>

      {/* Right: Caption, Location, Advanced Settings & Buttons */}
      <div className="ig-details-form-pane">
        {/* User Identity Header */}
        <div className="ig-details-author-row">
          <Avatar
            user={currentUser}
            size="sm"
            src={currentUser?.profilePictureUrl || currentUser?.avatarUrl}
          />
          <span className="ig-details-author-username">{currentUser?.username || 'user'}</span>
        </div>

        {/* Caption Area */}
        <div className="ig-details-caption-box">
          <textarea
            rows={4}
            className="ig-details-caption-textarea"
            placeholder="Write a caption for your reel... (use #hashtags and @mentions)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2200}
          />
          <span className="ig-details-char-count">{caption.length}/2,200</span>
        </div>

        {/* Location Input with quick pill suggestions */}
        <div className="ig-details-form-group">
          <label className="ig-details-field-label">
            <MapPin size={15} />
            <span>Add Location</span>
          </label>
          <div className="ig-location-input-wrapper">
            <input
              type="text"
              className="ig-details-input"
              placeholder="Add location (e.g. Mumbai, India)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
            />
            {location && (
              <button
                type="button"
                className="ig-clear-btn"
                onClick={() => setLocation('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {!location && (
            <div className="ig-location-pills">
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className="ig-location-pill"
                  onClick={() => setLocation(loc)}
                >
                  {loc.split(',')[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cover Frame Thumbnail Preview */}
        {customThumbnailUrl && (
          <div
            className="ig-cover-preview-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <img
              src={customThumbnailUrl}
              alt="Cover preview"
              style={{
                width: '40px',
                height: '56px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Cover Frame
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Frame at {formatTime(videoTrim.coverTime || videoTrim.start)}
              </span>
            </div>
          </div>
        )}

        {/* Advanced Settings Accordion */}
        <div className="ig-details-accordion">
          <button
            type="button"
            className="ig-accordion-header"
            onClick={() => setShowAdvanced((p) => !p)}
          >
            <div className="ig-accordion-title-wrap">
              <span className="ig-accordion-title">Advanced Settings</span>
              <span className="ig-accordion-desc">Manage comments and view counts</span>
            </div>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="ig-accordion-content">
              <label className="ig-setting-switch-row">
                <div className="ig-switch-text">
                  <span className="ig-switch-main-text">Hide like and view counts</span>
                  <span className="ig-switch-sub-text">
                    Only you will see total likes/views on this reel
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="ig-switch-box"
                  checked={hideLikeCount}
                  onChange={(e) => setHideLikeCount(e.target.checked)}
                />
              </label>

              <label className="ig-setting-switch-row">
                <div className="ig-switch-text">
                  <span className="ig-switch-main-text">Turn off commenting</span>
                  <span className="ig-switch-sub-text">Disable comments on this reel</span>
                </div>
                <input
                  type="checkbox"
                  className="ig-switch-box"
                  checked={commentsDisabled}
                  onChange={(e) => setCommentsDisabled(e.target.checked)}
                />
              </label>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons: Save Draft & Share Reel */}
        <div
          className="ig-details-bottom-actions"
          style={{
            display: 'flex',
            gap: '10px',
            padding: '14px',
            marginTop: 'auto',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onSubmit(null, true)}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Save Draft
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Share Reel'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ReelDetailsStep;
