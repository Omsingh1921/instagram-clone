import React from 'react';
import {
  Sparkles,
  Sliders,
  Film,
  ZoomOut,
  ZoomIn,
  Crop,
  RotateCw,
  RotateCcw,
  Check,
  Scissors,
  X,
  Plus,
} from 'lucide-react';
import { formatTime } from './videoUtils';
import { INSTAGRAM_FILTERS, ASPECT_RATIOS, getFilterStyle } from '../../utils/instagramFilters';

export const PostEditSidebar = ({
  editTab,
  setEditTab,
  activeItem,
  isVideo,
  handleApplyFilter,
  selectedRatio,
  handleSelectRatio,
  activeCrop,
  handleResetCrop,
  setShowGrid,
  handleZoomChange,
  isCustomCropActive,
  handleToggleCustomCrop,
  handleRotate,
  handleSaveCrop,
  isSavingCrop,
  videoTrim,
  handleResetVideoTrim,
  handleTrimStartChange,
  handleTrimEndChange,
  handleApplyVideoPreset,
  handleCoverTimeChange,
  mediaItems,
  activeMediaIdx,
  setActiveMediaIdx,
  handleRemoveMedia,
  addMoreInputRef,
  handleFilesAdded,
}) => {
  return (
    <div className="ig-edit-sidebar">
      {/* Tabs: Filters vs Ratio */}
      <div className="ig-edit-tab-headers">
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
          className={`ig-edit-tab-btn ${editTab === 'RATIO' ? 'active' : ''}`}
          onClick={() => setEditTab('RATIO')}
        >
          <Sliders size={16} />
          <span>Adjust & Ratio</span>
        </button>
      </div>

      {/* Filters Gallery */}
      {editTab === 'FILTERS' && (
        <div className="ig-filters-gallery">
          {INSTAGRAM_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`ig-filter-card ${activeItem.filterName === f.id ? 'active' : ''}`}
              onClick={() => handleApplyFilter(f.id)}
            >
              <div className="ig-filter-thumb-box">
                {isVideo && (!activeItem.thumbnailUrl || !activeItem.thumbnailUrl.startsWith('data:image')) ? (
                  <div className="ig-filter-thumb-video-fallback" style={{ filter: f.filter }}>
                    <Film size={20} />
                  </div>
                ) : (
                  <img
                    src={isVideo ? activeItem.thumbnailUrl : (activeItem.originalPreviewUrl || activeItem.previewUrl)}
                    alt={f.name}
                    className="ig-filter-thumb-img"
                    style={{ filter: f.filter }}
                  />
                )}
                {isVideo && (
                  <span className="ig-filter-video-badge" title="Video filter">
                    <Film size={10} />
                  </span>
                )}
              </div>
              <span className="ig-filter-name">{f.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Aspect Ratio & Reorder */}
      {editTab === 'RATIO' && (
        <div className="ig-ratio-panel">
          <h4 className="ig-panel-heading">Aspect Ratio</h4>
          <div className="ig-ratio-options-grid">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`ig-ratio-option-btn ${selectedRatio.id === r.id ? 'active' : ''}`}
                onClick={() => handleSelectRatio(r)}
              >
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Interactive Crop & Zoom Controls */}
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
                  onClick={handleToggleCustomCrop}
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
                  title="Save current crop & edits"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>Save Crop</span>
                </button>
              </div>

              <p className="ig-crop-drag-hint">
                {isCustomCropActive
                  ? '✨ Drag corner brackets or edges on the photo to customize crop size freely'
                  : '💡 Click "Custom Crop" to crop any custom area, or drag photo to reposition'}
              </p>
            </div>
          )}

          {/* Video Duration Trimming & Cropping Controls */}
          {isVideo && (
            <div className="ig-video-trim-section">
              <div className="ig-crop-section-header">
                <h4 className="ig-panel-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scissors size={15} color="#0095f6" />
                  <span>Trim Video Duration</span>
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
                    aria-label="Video Start Time"
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
                    aria-label="Video End Time"
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
                    className={`ig-trim-preset-btn ${(videoTrim.end - videoTrim.start) === 15 ? 'active' : ''}`}
                    onClick={() => handleApplyVideoPreset(15)}
                  >
                    15s
                  </button>
                )}
                {videoTrim.duration > 30 && (
                  <button
                    type="button"
                    className={`ig-trim-preset-btn ${(videoTrim.end - videoTrim.start) === 30 ? 'active' : ''}`}
                    onClick={() => handleApplyVideoPreset(30)}
                  >
                    30s
                  </button>
                )}
                {videoTrim.duration > 60 && (
                  <button
                    type="button"
                    className={`ig-trim-preset-btn ${(videoTrim.end - videoTrim.start) === 60 ? 'active' : ''}`}
                    onClick={() => handleApplyVideoPreset(60)}
                  >
                    60s
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

              {/* Video Cover Frame Selector */}
              <div className="ig-trim-cover-block">
                <div className="ig-trim-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Film size={13} />
                    <span>Cover Frame</span>
                  </span>
                  <span className="ig-trim-val">{formatTime(videoTrim.coverTime || videoTrim.start)}</span>
                </div>
                <input
                  type="range"
                  min={videoTrim.start}
                  max={videoTrim.end || videoTrim.duration}
                  step="1"
                  value={videoTrim.coverTime || videoTrim.start}
                  onChange={(e) => handleCoverTimeChange(Number(e.target.value))}
                  className="ig-trim-range-input"
                  aria-label="Video Cover Frame"
                />
              </div>

              <p className="ig-crop-drag-hint">
                ✂️ Video playback will loop between {formatTime(videoTrim.start)} and {formatTime(videoTrim.end || videoTrim.duration)}
              </p>
            </div>
          )}

          <h4 className="ig-panel-heading" style={{ marginTop: '20px' }}>
            Carousel Items ({mediaItems.length}/10)
          </h4>
          <div className="ig-carousel-thumbs-list">
            {mediaItems.map((item, idx) => (
              <div
                key={idx}
                className={`ig-thumb-item ${idx === activeMediaIdx ? 'active' : ''}`}
                onClick={() => setActiveMediaIdx(idx)}
              >
                {item.file?.type?.startsWith('video/') ? (
                  item.thumbnailUrl && item.thumbnailUrl.startsWith('data:image') ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="ig-thumb-preview-img"
                      style={getFilterStyle(item.filterName)}
                    />
                  ) : (
                    <div className="ig-thumb-video-placeholder">
                      <Film size={18} />
                    </div>
                  )
                ) : (
                  <img
                    src={item.previewUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="ig-thumb-preview-img"
                    style={getFilterStyle(item.filterName)}
                  />
                )}
                {item.file?.type?.startsWith('video/') && (
                  <span className="ig-thumb-video-badge" title="Video">
                    <Film size={10} color="#ffffff" />
                  </span>
                )}
                <button
                  type="button"
                  className="ig-thumb-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMedia(idx);
                  }}
                  title="Remove item"
                >
                  <X size={12} />
                </button>
                <span className="ig-thumb-order-badge">{idx + 1}</span>
              </div>
            ))}

            {mediaItems.length < 10 && (
              <button
                type="button"
                className="ig-add-more-thumb-btn"
                onClick={() => addMoreInputRef?.current?.click()}
                title="Add more photos/videos"
              >
                <Plus size={20} />
                <input
                  type="file"
                  ref={addMoreInputRef}
                  onChange={(e) => handleFilesAdded?.(e.target.files)}
                  accept="image/*,video/*"
                  multiple
                  style={{ display: 'none' }}
                />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostEditSidebar;
