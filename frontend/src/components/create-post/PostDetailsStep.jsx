import React from 'react';
import {
  Search,
  X,
  User,
  MapPin,
  Users,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { TrimmedVideoPlayer } from './TrimmedVideoPlayer';
import { getFilterStyle } from '../../utils/instagramFilters';

export const POPULAR_LOCATIONS = [
  'New York, NY',
  'Tokyo, Japan',
  'London, UK',
  'Paris, France',
  'Mumbai, India',
  'Dubai, UAE',
  'Los Angeles, CA',
  'Bali, Indonesia',
];

export const PostDetailsStep = ({
  imagePreviewRef,
  handleImageClick,
  selectedRatio,
  isVideo,
  activeItem,
  videoTrim,
  handleRemoveTag,
  taggingPos,
  setTaggingPos,
  userSearchQuery,
  handleSearchUsers,
  userSearchResults,
  handleSelectTaggedUser,
  mediaItems,
  activeMediaIdx,
  setActiveMediaIdx,
  currentUser,
  caption,
  setCaption,
  location,
  setLocation,
  collaborator,
  setCollaborator,
  collabQuery,
  setCollabQuery,
  handleSearchCollab,
  showCollabSearch,
  setShowCollabSearch,
  collabResults,
  setCollabResults,
  showAltTextSection,
  setShowAltTextSection,
  handleAltTextChange,
  showAdvanced,
  setShowAdvanced,
  hideLikeCount,
  setHideLikeCount,
  commentsDisabled,
  setCommentsDisabled,
}) => {
  return (
    <div className="ig-details-workspace">
      {/* Left: Tagging & Preview Canvas */}
      <div className="ig-details-media-pane">
        <div
          className="ig-tagging-canvas"
          ref={imagePreviewRef}
          onClick={handleImageClick}
          style={{ aspectRatio: selectedRatio.ratio || '1 / 1' }}
          title="Click on the photo to tag someone"
        >
          {isVideo ? (
            <TrimmedVideoPlayer
              src={activeItem.previewUrl}
              videoTrim={videoTrim}
              filterStyle={getFilterStyle(activeItem.filterName)}
              aspectRatio={selectedRatio.ratio || '1 / 1'}
              fitMode={selectedRatio.id === 'original' ? 'contain' : 'cover'}
            />
          ) : (
            <img
              src={activeItem.previewUrl}
              alt="Active slide"
              className="ig-canvas-media"
              style={getFilterStyle(activeItem.filterName)}
            />
          )}

          {/* Tag Pins on active slide */}
          {activeItem.tags.map((t) => (
            <div
              key={t.userId}
              className="ig-tag-pin"
              style={{ left: `${t.xPercent}%`, top: `${t.yPercent}%` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ig-tag-bubble">
                <span>@{t.username}</span>
                <button
                  type="button"
                  className="ig-tag-delete-btn"
                  onClick={() => handleRemoveTag(t.userId)}
                  title="Remove tag"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ))}

          {/* Active Tag placement search popup */}
          {taggingPos && (
            <div
              className="ig-tag-search-popup"
              style={{ left: `${taggingPos.xPercent}%`, top: `${taggingPos.yPercent}%` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ig-tag-search-box">
                <Search size={14} className="ig-tag-search-icon" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search user to tag..."
                  value={userSearchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="ig-tag-search-input"
                />
                <button
                  type="button"
                  className="ig-tag-cancel-btn"
                  onClick={() => setTaggingPos(null)}
                >
                  <X size={14} />
                </button>
              </div>
              {userSearchResults.length > 0 && (
                <div className="ig-tag-search-dropdown">
                  {userSearchResults.map((u) => (
                    <div
                      key={u.id}
                      className="ig-tag-result-row"
                      onClick={() => handleSelectTaggedUser(u)}
                    >
                      <Avatar src={u.avatarUrl} username={u.username} size="sm" />
                      <div className="ig-tag-result-info">
                        <span className="ig-tag-result-username">{u.username}</span>
                        {u.displayName && (
                          <span className="ig-tag-result-name">{u.displayName}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Carousel thumbnail bar at bottom of canvas */}
          {mediaItems.length > 1 && (
            <div className="ig-details-carousel-strip">
              {mediaItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`ig-strip-thumb ${idx === activeMediaIdx ? 'active' : ''}`}
                  onClick={() => setActiveMediaIdx(idx)}
                >
                  <img src={item.previewUrl} alt={`Slide ${idx + 1}`} />
                  {item.tags.length > 0 && (
                    <span className="ig-strip-tag-badge">
                      <User size={8} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Metadata Form */}
      <div className="ig-details-form-pane">
        {/* Author Row */}
        <div className="ig-details-author-row">
          <Avatar
            src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
            username={currentUser?.username}
            size="sm"
          />
          <span className="ig-details-author-username">{currentUser?.username}</span>
        </div>

        {/* Caption with hashtag suggestion */}
        <div className="ig-details-caption-box">
          <textarea
            className="ig-details-caption-textarea"
            rows={4}
            maxLength={2200}
            placeholder="Write a caption... (use #hashtags and @mentions)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="ig-details-char-count">{caption.length}/2,200</div>
        </div>

        {/* Add Location */}
        <div className="ig-details-form-group">
          <label className="ig-details-field-label">
            <MapPin size={16} />
            <span>Add location</span>
          </label>
          <div className="ig-location-input-wrapper">
            <input
              type="text"
              className="ig-details-input"
              placeholder="Where was this taken?"
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
            <div className="ig-popular-locations-row">
              {POPULAR_LOCATIONS.slice(0, 4).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className="ig-location-chip"
                  onClick={() => setLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Invite Collaborator */}
        <div className="ig-details-form-group">
          <label className="ig-details-field-label">
            <Users size={16} />
            <span>Invite collaborator</span>
          </label>
          {collaborator ? (
            <div className="ig-collab-selected-card">
              <Avatar
                src={collaborator.avatarUrl}
                username={collaborator.username}
                size="sm"
              />
              <div className="ig-collab-selected-info">
                <span className="ig-collab-username">@{collaborator.username}</span>
                <span className="ig-collab-subtext">Will be invited as co-author</span>
              </div>
              <button
                type="button"
                className="ig-clear-btn"
                onClick={() => setCollaborator(null)}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="ig-collab-search-wrapper">
              <input
                type="text"
                className="ig-details-input"
                placeholder="Search username to collaborate..."
                value={collabQuery}
                onChange={(e) => {
                  handleSearchCollab(e.target.value);
                  setShowCollabSearch(true);
                }}
                onFocus={() => setShowCollabSearch(true)}
              />
              {showCollabSearch && collabResults.length > 0 && (
                <div className="ig-collab-dropdown">
                  {collabResults.map((u) => (
                    <div
                      key={u.id}
                      className="ig-collab-row"
                      onClick={() => {
                        setCollaborator(u);
                        setCollabQuery('');
                        setCollabResults([]);
                        setShowCollabSearch(false);
                      }}
                    >
                      <Avatar src={u.avatarUrl} username={u.username} size="sm" />
                      <div className="ig-collab-row-info">
                        <span className="ig-collab-row-username">@{u.username}</span>
                        {u.displayName && (
                          <span className="ig-collab-row-name">{u.displayName}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accessibility (Alt Text) Section */}
        <div className="ig-details-accordion">
          <button
            type="button"
            className="ig-accordion-header"
            onClick={() => setShowAltTextSection(!showAltTextSection)}
          >
            <div className="ig-accordion-title-wrap">
              <span className="ig-accordion-title">Accessibility (Alt Text)</span>
              <span className="ig-accordion-desc">
                Describe your photos for people with visual impairments.
              </span>
            </div>
            {showAltTextSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showAltTextSection && (
            <div className="ig-accordion-content">
              {mediaItems.map((item, idx) => (
                <div key={idx} className="ig-alt-text-field">
                  <div className="ig-alt-text-header">
                    <img
                      src={item.previewUrl}
                      alt="Slide thumbnail"
                      className="ig-alt-thumb"
                    />
                    <span className="ig-alt-slide-label">
                      Slide {idx + 1} of {mediaItems.length}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="ig-details-input"
                    placeholder="Write alt text..."
                    maxLength={500}
                    value={item.altText}
                    onChange={(e) => handleAltTextChange(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Settings (Hide likes & Turn off comments) */}
        <div className="ig-details-accordion">
          <button
            type="button"
            className="ig-accordion-header"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <div className="ig-accordion-title-wrap">
              <span className="ig-accordion-title">Advanced Settings</span>
            </div>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showAdvanced && (
            <div className="ig-accordion-content">
              {/* Hide Like Count */}
              <label className="ig-switch-control-row">
                <div className="ig-switch-text">
                  <span className="ig-switch-main-text">Hide like and view counts</span>
                  <span className="ig-switch-sub-text">
                    Only you will see the total number of likes and views on this post.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="ig-switch-box"
                  checked={hideLikeCount}
                  onChange={(e) => setHideLikeCount(e.target.checked)}
                />
              </label>

              {/* Turn Off Commenting */}
              <label className="ig-switch-control-row">
                <div className="ig-switch-text">
                  <span className="ig-switch-main-text">Turn off commenting</span>
                  <span className="ig-switch-sub-text">
                    You can change this anytime from the post menu.
                  </span>
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
      </div>
    </div>
  );
};

export default PostDetailsStep;
