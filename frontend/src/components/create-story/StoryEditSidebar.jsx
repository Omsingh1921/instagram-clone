import React from 'react';
import {
  Sliders,
  Sparkles,
  Smile,
  Scissors,
  ZoomOut,
  ZoomIn,
  Crop,
  RotateCw,
  RotateCcw,
  Check,
  Film,
  AtSign,
  Music,
  HelpCircle,
  BarChart2,
  HelpCircle as QuizIcon,
  Flame,
  Clock,
  Link as LinkIcon,
  MapPin,
  Hash,
  Eye,
  EyeOff,
  X,
  Star,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatTime } from '../create-post';
import { INSTAGRAM_FILTERS } from '../../utils/instagramFilters';

export const STORY_ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 (Story)', ratio: '9 / 16' },
  { id: 'ORIGINAL', label: 'Original', ratio: null },
  { id: '1:1', label: '1:1 (Square)', ratio: '1 / 1' },
  { id: '4:5', label: '4:5 (Portrait)', ratio: '4 / 5' },
  { id: 'CUSTOM', label: 'Custom (Free)', ratio: null },
];

export const StoryEditSidebar = ({
  editTab,
  setEditTab,
  selectedRatio,
  setSelectedRatio,
  setIsCustomCropActive,
  isCustomCropActive,
  isVideo,
  activeCrop,
  handleResetCrop,
  setShowGrid,
  handleZoomChange,
  handleRotate,
  handleSaveCrop,
  isSavingCrop,
  videoTrim,
  handleResetVideoTrim,
  handleTrimStartChange,
  handleTrimEndChange,
  handleApplyVideoPreset,
  selectedFilter,
  setSelectedFilter,
  previewUrl,
  attachedCount,
  activeStickerType,
  setActiveStickerType,
  setInteractiveType,
  interactiveType,
  isMusicActive,
  isMentionActive,
  audioTitle,
  setAudioTitle,
  audioArtist,
  setAudioArtist,
  selectedMentionUsers,
  setSelectedMentionUsers,
  handleRemoveCurrentSticker,
  handleSetPresetPosition,
  stickerPos,
  showMentionsOnScreen,
  setShowMentionsOnScreen,
  mentionSearch,
  setMentionSearch,
  isSearchingMention,
  mentionUserResults,
  setMentionUserResults,
  questionPrompt,
  setQuestionPrompt,
  pollQuestion,
  setPollQuestion,
  pollOptionA,
  setPollOptionA,
  pollOptionB,
  setPollOptionB,
  quizQuestion,
  setQuizQuestion,
  quizOptionA,
  setQuizOptionA,
  quizOptionB,
  setQuizOptionB,
  quizOptionC,
  setQuizOptionC,
  quizCorrectIndex,
  setQuizCorrectIndex,
  sliderQuestion,
  setSliderQuestion,
  sliderEmoji,
  setSliderEmoji,
  countdownTitle,
  setCountdownTitle,
  countdownDate,
  setCountdownDate,
  isLinkActive,
  linkUrl,
  setLinkUrl,
  linkText,
  setLinkText,
  isLocationActive,
  locationName,
  setLocationName,
  isHashtagActive,
  hashtagTag,
  setHashtagTag,
  handleClose,
  loading,
  isCloseFriendsOnly,
  doSubmit,
}) => {
  return (
    <>
      <div className="ig-edit-sidebar story-tools-sidebar">
        <div className="ig-edit-tab-headers">
          <button
            type="button"
            className={`ig-edit-tab-btn ${editTab === 'RATIO' ? 'active' : ''}`}
            onClick={() => setEditTab('RATIO')}
          >
            <Sliders size={16} />
            <span>Crop & Trim</span>
          </button>
          <button
            type="button"
            className={`ig-edit-tab-btn ${editTab === 'FILTERS' ? 'active' : ''}`}
            onClick={() => setEditTab('FILTERS')}
          >
            <Sparkles size={16} />
            <span>Filters</span>
          </button>
          <button
            type="button"
            className={`ig-edit-tab-btn ${editTab === 'STICKERS' ? 'active' : ''}`}
            onClick={() => setEditTab('STICKERS')}
          >
            <Smile size={16} />
            <span>Stickers</span>
          </button>
        </div>

        {/* Tab 1: Crop & Ratio */}
        {editTab === 'RATIO' && (
          <div className="ig-ratio-panel" style={{ padding: '14px' }}>
            <h4 className="ig-panel-heading">Aspect Ratio</h4>
            <div className="ig-ratio-options-grid">
              {STORY_ASPECT_RATIOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`ig-ratio-option-btn ${selectedRatio.id === r.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedRatio(r);
                    if (r.id === 'CUSTOM') {
                      setIsCustomCropActive(true);
                    } else {
                      setIsCustomCropActive(false);
                    }
                  }}
                >
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            {/* PHOTO CROP CONTROLS */}
            {!isVideo && (
              <div className="ig-crop-controls-section">
                <div className="ig-crop-section-header">
                  <h4 className="ig-panel-heading" style={{ margin: 0 }}>
                    Crop & Zoom
                  </h4>
                  {(activeCrop.zoom > 1 ||
                    activeCrop.panX !== 0 ||
                    activeCrop.panY !== 0 ||
                    activeCrop.rotation !== 0 ||
                    (activeCrop.customCropBox &&
                      (activeCrop.customCropBox.width < 99.5 ||
                        activeCrop.customCropBox.height < 99.5 ||
                        activeCrop.customCropBox.x > 0.5 ||
                        activeCrop.customCropBox.y > 0.5))) && (
                    <button
                      type="button"
                      className="ig-crop-reset-link"
                      onClick={handleResetCrop}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="ig-crop-slider-row">
                  <div className="ig-slider-label-group">
                    <span className="ig-slider-title">Zoom</span>
                    <span className="ig-slider-val-badge">
                      {Math.round(activeCrop.zoom * 100)}%
                    </span>
                  </div>
                  <div className="ig-slider-input-container">
                    <ZoomOut size={14} className="slider-icon" />
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={activeCrop.zoom}
                      onMouseDown={() => setShowGrid(true)}
                      onMouseUp={() => setShowGrid(false)}
                      onChange={(e) => handleZoomChange(e.target.value)}
                      className="ig-zoom-range-input"
                      aria-label="Zoom Level"
                    />
                    <ZoomIn size={14} className="slider-icon" />
                  </div>
                </div>

                <div className="ig-crop-actions-row">
                  <button
                    type="button"
                    className={`ig-crop-action-pill-btn ${isCustomCropActive ? 'active-crop-tool' : ''}`}
                    onClick={() => setIsCustomCropActive((prev) => !prev)}
                    title="Custom crop: drag corner brackets or edges freely"
                  >
                    <Crop size={14} />
                    <span>{isCustomCropActive ? 'Crop Active' : 'Custom Crop'}</span>
                  </button>
                  <button
                    type="button"
                    className="ig-crop-action-pill-btn"
                    onClick={handleRotate}
                    title="Rotate 90 degrees clockwise"
                  >
                    <RotateCw size={14} />
                    <span>Rotate 90°</span>
                  </button>
                  <button
                    type="button"
                    className="ig-crop-action-pill-btn"
                    onClick={handleResetCrop}
                    title="Reset crop and zoom"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Crop</span>
                  </button>
                  <button
                    type="button"
                    className="ig-crop-action-pill-btn save-crop"
                    onClick={handleSaveCrop}
                    disabled={isSavingCrop}
                    title="Save current crop"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>Save Crop</span>
                  </button>
                </div>

                <p className="ig-crop-drag-hint">
                  {isCustomCropActive
                    ? '✨ Drag corner brackets or edges on the photo to customize crop size freely'
                    : '💡 Drag photo on canvas to reposition, or click "Custom Crop"'}
                </p>
              </div>
            )}

            {/* VIDEO DURATION TRIM CONTROLS */}
            {isVideo && (
              <div className="ig-video-trim-section">
                <div className="ig-crop-section-header">
                  <h4
                    className="ig-panel-heading"
                    style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Scissors size={15} color="#0095f6" />
                    <span>Trim Story Duration</span>
                  </h4>
                  {(videoTrim.start > 0 || (videoTrim.end < videoTrim.duration && videoTrim.end > 0)) && (
                    <button
                      type="button"
                      className="ig-crop-reset-link"
                      onClick={handleResetVideoTrim}
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Duration summary badge */}
                <div className="ig-trim-summary-badge">
                  <span className="ig-trim-time-range">
                    {formatTime(videoTrim.start)} – {formatTime(videoTrim.end || videoTrim.duration)}
                  </span>
                  <span className="ig-trim-duration-pill">
                    Length: {formatTime(Math.max(0, (videoTrim.end || videoTrim.duration) - videoTrim.start))}
                  </span>
                </div>

                {/* Dual Range Sliders for Start & End Time */}
                <div className="ig-trim-slider-block">
                  <div className="ig-trim-row">
                    <div className="ig-trim-label">
                      <span>Start Trim</span>
                      <span className="ig-trim-val">{formatTime(videoTrim.start)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(1, (videoTrim.end || videoTrim.duration) - 1)}
                      step="1"
                      value={videoTrim.start}
                      onChange={(e) => handleTrimStartChange(Number(e.target.value))}
                      className="ig-trim-range-input"
                      aria-label="Story Start Time"
                    />
                  </div>

                  <div className="ig-trim-row">
                    <div className="ig-trim-label">
                      <span>End Trim</span>
                      <span className="ig-trim-val">{formatTime(videoTrim.end || videoTrim.duration)}</span>
                    </div>
                    <input
                      type="range"
                      min={(videoTrim.start || 0) + 1}
                      max={videoTrim.duration || 60}
                      step="1"
                      value={videoTrim.end || videoTrim.duration}
                      onChange={(e) => handleTrimEndChange(Number(e.target.value))}
                      className="ig-trim-range-input"
                      aria-label="Story End Time"
                    />
                  </div>
                </div>

                {/* Quick Duration Preset Pills */}
                <div className="ig-trim-presets-row">
                  <button
                    type="button"
                    className={`ig-trim-preset-btn ${videoTrim.start === 0 && (videoTrim.end === videoTrim.duration || !videoTrim.end) ? 'active' : ''}`}
                    onClick={() => handleApplyVideoPreset(videoTrim.duration)}
                  >
                    Full
                  </button>
                  {videoTrim.duration > 15 && (
                    <button
                      type="button"
                      className={`ig-trim-preset-btn ${videoTrim.end - videoTrim.start === 15 ? 'active' : ''}`}
                      onClick={() => handleApplyVideoPreset(15)}
                    >
                      15s
                    </button>
                  )}
                  {videoTrim.duration > 30 && (
                    <button
                      type="button"
                      className={`ig-trim-preset-btn ${videoTrim.end - videoTrim.start === 30 ? 'active' : ''}`}
                      onClick={() => handleApplyVideoPreset(30)}
                    >
                      30s
                    </button>
                  )}
                  <button
                    type="button"
                    className="ig-trim-preset-btn save-trim"
                    onClick={handleSaveCrop}
                    disabled={isSavingCrop}
                    title="Save current video trim"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    <span>Save Trim</span>
                  </button>
                </div>

                <p className="ig-crop-drag-hint">
                  ✂️ Story video will loop between {formatTime(videoTrim.start)} and{' '}
                  {formatTime(videoTrim.end || videoTrim.duration)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Filters */}
        {editTab === 'FILTERS' && (
          <div className="ig-filters-gallery" style={{ padding: '14px' }}>
            {INSTAGRAM_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`ig-filter-card ${selectedFilter === f.id ? 'active' : ''}`}
                onClick={() => setSelectedFilter(f.id)}
              >
                <div className="ig-filter-thumb-box">
                  {isVideo ? (
                    <div className="ig-filter-thumb-video-fallback" style={{ filter: f.filter }}>
                      <Film size={20} />
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt={f.name}
                      className="ig-filter-thumb-img"
                      style={{ filter: f.filter }}
                    />
                  )}
                </div>
                <span className="ig-filter-name">{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tab 3: Stickers */}
        {editTab === 'STICKERS' && (
          <div className="story-stickers-tab-pane">
            <h4 className="ig-panel-heading" style={{ margin: '14px 14px 6px' }}>
              Interactive Stickers
            </h4>
            {/* Attached Features Chips Strip */}
            {attachedCount > 0 && (
              <div className="story-attached-features-bar">
                <div className="story-attached-header">
                  <span className="story-attached-title">
                    Applied to Story <span className="story-attached-count">({attachedCount})</span>
                  </span>
                  <span className="story-attached-hint">All combined into single story</span>
                </div>
                <div className="story-attached-chips">
                  {isMusicActive && (
                    <div
                      className={`story-feature-chip ${activeStickerType === 'music' ? 'selected' : ''}`}
                      onClick={() => setActiveStickerType('music')}
                      title="Click to edit music"
                    >
                      <span className="story-feature-chip-label">🎵 {audioTitle || 'Music'}</span>
                      <button
                        type="button"
                        className="story-feature-chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudioTitle('');
                          setAudioArtist('');
                          if (activeStickerType === 'music') setActiveStickerType('none');
                        }}
                        title="Remove music"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {selectedMentionUsers.length > 0 && (
                    <div
                      className={`story-feature-chip ${activeStickerType === 'mention' ? 'selected' : ''}`}
                      onClick={() => setActiveStickerType('mention')}
                      title="Click to edit mentions"
                    >
                      <span className="story-feature-chip-label">@ {selectedMentionUsers.length} Tagged</span>
                      <button
                        type="button"
                        className="story-feature-chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMentionUsers([]);
                          if (activeStickerType === 'mention') setActiveStickerType('none');
                        }}
                        title="Remove mentions"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {interactiveType !== 'none' && (
                    <div
                      className={`story-feature-chip ${['question', 'poll', 'quiz', 'slider', 'countdown'].includes(activeStickerType) ? 'selected' : ''}`}
                      onClick={() => setActiveStickerType(interactiveType)}
                      title="Click to edit interactive widget"
                    >
                      <span className="story-feature-chip-label">
                        {interactiveType === 'question' && '❓ Question'}
                        {interactiveType === 'poll' && '📊 Poll'}
                        {interactiveType === 'quiz' && '💡 Quiz'}
                        {interactiveType === 'slider' && '🔥 Slider'}
                        {interactiveType === 'countdown' && '⏱️ Countdown'}
                      </span>
                      <button
                        type="button"
                        className="story-feature-chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInteractiveType('none');
                          if (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(activeStickerType)) {
                            setActiveStickerType('none');
                          }
                        }}
                        title="Remove interactive sticker"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {isLinkActive && (
                    <div
                      className={`story-feature-chip ${activeStickerType === 'link' ? 'selected' : ''}`}
                      onClick={() => setActiveStickerType('link')}
                      title="Click to edit link"
                    >
                      <span className="story-feature-chip-label">🔗 {linkText || 'Link'}</span>
                      <button
                        type="button"
                        className="story-feature-chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLinkUrl('');
                          setLinkText('');
                          if (activeStickerType === 'link') setActiveStickerType('none');
                        }}
                        title="Remove link"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {isLocationActive && (
                    <div
                      className={`story-feature-chip ${activeStickerType === 'location' ? 'selected' : ''}`}
                      onClick={() => setActiveStickerType('location')}
                      title="Click to edit location"
                    >
                      <span className="story-feature-chip-label">📍 {locationName}</span>
                      <button
                        type="button"
                        className="story-feature-chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocationName('');
                          if (activeStickerType === 'location') setActiveStickerType('none');
                        }}
                        title="Remove location"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {isHashtagActive && (
                    <div
                      className={`story-feature-chip ${activeStickerType === 'hashtag' ? 'selected' : ''}`}
                      onClick={() => setActiveStickerType('hashtag')}
                      title="Click to edit hashtag"
                    >
                      <span className="story-feature-chip-label">#{hashtagTag.replace(/^#/, '')}</span>
                      <button
                        type="button"
                        className="story-feature-chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHashtagTag('');
                          if (activeStickerType === 'hashtag') setActiveStickerType('none');
                        }}
                        title="Remove hashtag"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="story-stickers-grid">
              {[
                { type: 'mention', label: 'Mention', icon: AtSign, color: 'linear-gradient(45deg, #f09433, #e6683c)', isAttached: isMentionActive, count: selectedMentionUsers.length },
                { type: 'music', label: 'Music', icon: Music, color: 'linear-gradient(45deg, #dc2743, #cc2366)', isAttached: isMusicActive },
                { type: 'question', label: 'Question', icon: HelpCircle, color: 'linear-gradient(45deg, #8a3ab9, #bc1888)', isAttached: interactiveType === 'question' },
                { type: 'poll', label: 'Poll', icon: BarChart2, color: 'linear-gradient(45deg, #00ba7c, #0095f6)', isAttached: interactiveType === 'poll' },
                { type: 'quiz', label: 'Quiz', icon: QuizIcon, color: 'linear-gradient(45deg, #e95950, #fccc63)', isAttached: interactiveType === 'quiz' },
                { type: 'slider', label: 'Slider', icon: Flame, color: 'linear-gradient(45deg, #ff5e3a, #ff2a68)', isAttached: interactiveType === 'slider' },
                { type: 'countdown', label: 'Countdown', icon: Clock, color: 'linear-gradient(45deg, #ff9500, #ff5e3a)', isAttached: interactiveType === 'countdown' },
                { type: 'link', label: 'Link', icon: LinkIcon, color: 'linear-gradient(45deg, #0095f6, #4c68d7)', isAttached: isLinkActive },
                { type: 'location', label: 'Location', icon: MapPin, color: 'linear-gradient(45deg, #e1306c, #fd1d1d)', isAttached: isLocationActive },
                { type: 'hashtag', label: 'Hashtag', icon: Hash, color: 'linear-gradient(45deg, #5851db, #833ab4)', isAttached: isHashtagActive },
              ].map(({ type, label, icon: Icon, color, isAttached, count }) => {
                const isEditing = activeStickerType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (isEditing) {
                        setActiveStickerType('none');
                      } else {
                        setActiveStickerType(type);
                        if (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(type)) {
                          setInteractiveType(type);
                        }
                      }
                    }}
                    className={`story-sticker-card-btn ${isEditing ? 'active' : ''} ${isAttached ? 'attached' : ''}`}
                  >
                    <span className="story-sticker-icon-badge" style={{ background: color }}>
                      <Icon size={14} />
                    </span>
                    <span className="story-sticker-label-text">{label}</span>
                    {isAttached && (
                      <span className="story-sticker-attached-badge" title="Applied to story">
                        ✓{count ? ` ${count}` : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Sticker Editor Form in Sidebar */}
            <div className="story-sticker-config-form">
              {/* Sticker Position Presets */}
              {activeStickerType !== 'none' && (
                <div className="sticker-pos-presets">
                  <div className="sticker-pos-header">
                    <label>
                      {activeStickerType.charAt(0).toUpperCase() + activeStickerType.slice(1)} Position
                    </label>
                    <button
                      type="button"
                      className="sticker-remove-text-btn"
                      onClick={() => handleRemoveCurrentSticker(activeStickerType)}
                    >
                      Remove from story
                    </button>
                  </div>
                  <div className="ig-pos-btn-group">
                    <button
                      type="button"
                      className={`ig-pos-btn ${stickerPos.y <= 28 ? 'active' : ''}`}
                      onClick={() => handleSetPresetPosition('top')}
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      className={`ig-pos-btn ${stickerPos.y > 28 && stickerPos.y < 60 ? 'active' : ''}`}
                      onClick={() => handleSetPresetPosition('center')}
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      className={`ig-pos-btn ${stickerPos.y >= 60 ? 'active' : ''}`}
                      onClick={() => handleSetPresetPosition('bottom')}
                    >
                      Bottom
                    </button>
                  </div>
                  <p className="sticker-drag-tip-text">
                    💡 You can also drag this sticker anywhere on the story preview.
                  </p>
                </div>
              )}

              {activeStickerType === 'mention' && (
                <div className="sticker-input-group">
                  <div className="mention-visibility-header">
                    <label style={{ margin: 0 }}>Mention Users (@username)</label>
                    <button
                      type="button"
                      className={`ig-mention-vis-toggle-btn ${showMentionsOnScreen ? 'active' : 'hidden-state'}`}
                      onClick={() => setShowMentionsOnScreen((prev) => !prev)}
                      title={showMentionsOnScreen ? 'Click to hide mentions from video screen' : 'Click to show mentions on video screen'}
                    >
                      {showMentionsOnScreen ? (
                        <>
                          <Eye size={13} />
                          <span>Show on screen</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} />
                          <span>Don&apos;t show on screen</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!showMentionsOnScreen && (
                    <div className="mention-invisible-alert">
                      <EyeOff size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Invisible Mentions Active:</strong>
                        <span> Mentioned friends will still receive a notification and DM, but their names will NOT show on the video.</span>
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    value={mentionSearch}
                    onChange={(e) => setMentionSearch(e.target.value)}
                    placeholder="@search username to add..."
                    className="ig-details-input"
                    autoFocus
                  />

                  {/* Selected Mention Chips */}
                  {selectedMentionUsers.length > 0 && (
                    <div className="mention-selected-chips-list">
                      {selectedMentionUsers.map((u) => (
                        <span key={u.id || u.userId} className="mention-user-chip">
                          <Avatar src={u.avatarUrl || u.profilePictureUrl} size="xs" />
                          <span className="chip-username">@{u.username}</span>
                          <button
                            type="button"
                            className="chip-remove-btn"
                            onClick={() => setSelectedMentionUsers((prev) => prev.filter((m) => (m.id || m.userId) !== (u.id || u.userId)))}
                            title={`Remove @${u.username}`}
                            aria-label={`Remove @${u.username}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {isSearchingMention && (
                    <div style={{ padding: '8px', fontSize: '12px', color: '#8e8e8e' }}>
                      Searching users...
                    </div>
                  )}

                  {mentionUserResults.length > 0 && (
                    <div
                      style={{
                        marginTop: '6px',
                        background: '#1c1c1c',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                      }}
                    >
                      {mentionUserResults
                        .filter((u) => !selectedMentionUsers.some((m) => (m.id || m.userId) === (u.id || u.userId)))
                        .map((u) => (
                          <div
                            key={u.id || u.userId}
                            onClick={() => {
                              setSelectedMentionUsers((prev) => [...prev, u]);
                              setMentionSearch('');
                              setMentionUserResults([]);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #262626',
                            }}
                            className="mention-user-row"
                          >
                            <Avatar src={u.avatarUrl || u.profilePictureUrl} size="sm" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                @{u.username}
                              </span>
                              {u.displayName && (
                                <span style={{ fontSize: '11px', color: '#8e8e8e' }}>
                                  {u.displayName}
                                </span>
                              )}
                            </div>
                            <span className="mention-add-pill">+ Add</span>
                          </div>
                        ))}
                    </div>
                  )}
                  <p className="sticker-drag-tip-text">
                    💡 You can mention multiple users. Each will receive an instant notification and auto-DM with &quot;Add to Story&quot;!
                  </p>
                </div>
              )}

              {activeStickerType === 'question' && (
                <div className="sticker-input-group">
                  <label>Question Prompt</label>
                  <input
                    type="text"
                    value={questionPrompt}
                    onChange={(e) => setQuestionPrompt(e.target.value)}
                    placeholder="Ask me a question"
                    maxLength={150}
                    className="ig-details-input"
                  />
                  <p className="sticker-drag-tip-text">
                    💡 Viewers can type answers into the box. You will see all responses in your story viewers list.
                  </p>
                </div>
              )}

              {activeStickerType === 'poll' && (
                <div className="sticker-input-group">
                  <label>Poll Question</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    maxLength={150}
                    className="ig-details-input"
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="text"
                      value={pollOptionA}
                      onChange={(e) => setPollOptionA(e.target.value)}
                      placeholder="Option 1"
                      className="ig-details-input"
                    />
                    <input
                      type="text"
                      value={pollOptionB}
                      onChange={(e) => setPollOptionB(e.target.value)}
                      placeholder="Option 2"
                      className="ig-details-input"
                    />
                  </div>
                </div>
              )}

              {activeStickerType === 'quiz' && (
                <div className="sticker-input-group">
                  <label>Quiz Question & Options</label>
                  <input
                    type="text"
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="Quiz question..."
                    maxLength={150}
                    className="ig-details-input"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {[
                      { val: quizOptionA, set: setQuizOptionA, idx: 0 },
                      { val: quizOptionB, set: setQuizOptionB, idx: 1 },
                      { val: quizOptionC, set: setQuizOptionC, idx: 2 },
                    ].map(({ val, set, idx }) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: quizCorrectIndex === idx ? 'rgba(0, 186, 124, 0.15)' : 'transparent',
                          border: quizCorrectIndex === idx ? '1px solid #00ba7c' : '1px solid #333',
                          borderRadius: '8px',
                          padding: '4px 8px',
                        }}
                      >
                        <input
                          type="radio"
                          name="quizCorrectOption"
                          checked={quizCorrectIndex === idx}
                          onChange={() => setQuizCorrectIndex(idx)}
                          title="Mark as correct option"
                        />
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="ig-details-input"
                          style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="sticker-drag-tip-text">
                    💡 Select the radio button next to the correct answer.
                  </p>
                </div>
              )}

              {activeStickerType === 'slider' && (
                <div className="sticker-input-group">
                  <label>Slider Question</label>
                  <input
                    type="text"
                    value={sliderQuestion}
                    onChange={(e) => setSliderQuestion(e.target.value)}
                    placeholder="How hot is this?"
                    maxLength={100}
                    className="ig-details-input"
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#8e8e8e' }}>Emoji:</span>
                    {['🔥', '❤️', '😍', '😂', '👏', '🎉', '🙌'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSliderEmoji(emoji)}
                        style={{
                          background: sliderEmoji === emoji ? '#333' : 'transparent',
                          border: sliderEmoji === emoji ? '1px solid #0095f6' : '1px solid transparent',
                          borderRadius: '6px',
                          fontSize: '18px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeStickerType === 'countdown' && (
                <div className="sticker-input-group">
                  <label>Countdown Event Name</label>
                  <input
                    type="text"
                    value={countdownTitle}
                    onChange={(e) => setCountdownTitle(e.target.value)}
                    placeholder="Upcoming event..."
                    maxLength={60}
                    className="ig-details-input"
                  />
                  <label style={{ marginTop: '10px' }}>End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={countdownDate}
                    onChange={(e) => setCountdownDate(e.target.value)}
                    className="ig-details-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              )}

              {activeStickerType === 'link' && (
                <div className="sticker-input-group">
                  <label>Link URL</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="ig-details-input"
                  />
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Sticker text (optional)"
                    className="ig-details-input"
                    style={{ marginTop: '6px' }}
                  />
                </div>
              )}

              {activeStickerType === 'location' && (
                <div className="sticker-input-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Add location (e.g. Mumbai, India)"
                    className="ig-details-input"
                  />
                </div>
              )}

              {activeStickerType === 'hashtag' && (
                <div className="sticker-input-group">
                  <label>Hashtag</label>
                  <input
                    type="text"
                    value={hashtagTag}
                    onChange={(e) => setHashtagTag(e.target.value)}
                    placeholder="#travel"
                    className="ig-details-input"
                  />
                </div>
              )}

              {activeStickerType === 'music' && (
                <div className="sticker-input-group">
                  <label>Trending on Instagram</label>
                  <div className="ig-trending-music-chips">
                    {[
                      { title: 'Die With A Smile', artist: 'Lady Gaga, Bruno Mars' },
                      { title: 'Espresso', artist: 'Sabrina Carpenter' },
                      { title: 'Birds of a Feather', artist: 'Billie Eilish' },
                      { title: 'Starboy', artist: 'The Weeknd' },
                      { title: 'Blinding Lights', artist: 'The Weeknd' },
                    ].map((track) => (
                      <button
                        key={track.title}
                        type="button"
                        className="ig-trending-track-btn"
                        onClick={() => {
                          setAudioTitle(track.title);
                          setAudioArtist(track.artist);
                        }}
                      >
                        <Music size={12} />
                        <span className="ig-track-name">{track.title}</span>
                        <span className="ig-track-artist">• {track.artist}</span>
                      </button>
                    ))}
                  </div>

                  <label style={{ marginTop: '10px' }}>Custom Song & Artist</label>
                  <input
                    type="text"
                    value={audioTitle}
                    onChange={(e) => setAudioTitle(e.target.value)}
                    placeholder="Song title..."
                    className="ig-details-input"
                  />
                  <input
                    type="text"
                    value={audioArtist}
                    onChange={(e) => setAudioArtist(e.target.value)}
                    placeholder="Artist name..."
                    className="ig-details-input"
                    style={{ marginTop: '6px' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Action Footer */}
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
    </>
  );
};

export default StoryEditSidebar;
