import React from 'react';
import {
  ZoomOut,
  ZoomIn,
  Crop,
  RotateCw,
  RotateCcw,
  Check,
  Scissors,
} from 'lucide-react';
import { formatTime } from '../create-post';

export const STORY_ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 (Story)', ratio: '9 / 16' },
  { id: 'ORIGINAL', label: 'Original', ratio: null },
  { id: '1:1', label: '1:1 (Square)', ratio: '1 / 1' },
  { id: '4:5', label: '4:5 (Portrait)', ratio: '4 / 5' },
  { id: 'CUSTOM', label: 'Custom (Free)', ratio: null },
];

export const StoryCropTab = ({
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
}) => {
  return (
    <div className="ig-ratio-panel" style={{ padding: '14px' }}>
      <h4 className="ig-panel-heading">Aspect Ratio</h4>
      <div className="ig-ratio-options-grid">
        {STORY_ASPECT_RATIOS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`ig-ratio-option-btn ${selectedRatio?.id === r.id ? 'active' : ''}`}
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
                onMouseDown={() => setShowGrid?.(true)}
                onMouseUp={() => setShowGrid?.(false)}
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
            {(videoTrim.start > 0 ||
              (videoTrim.end < videoTrim.duration && videoTrim.end > 0)) && (
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
                <span className="ig-trim-val">
                  {formatTime(videoTrim.end || videoTrim.duration)}
                </span>
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
              className={`ig-trim-preset-btn ${
                videoTrim.start === 0 &&
                (videoTrim.end === videoTrim.duration || !videoTrim.end)
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleApplyVideoPreset(videoTrim.duration)}
            >
              Full
            </button>
            {videoTrim.duration > 15 && (
              <button
                type="button"
                className={`ig-trim-preset-btn ${
                  videoTrim.end - videoTrim.start === 15 ? 'active' : ''
                }`}
                onClick={() => handleApplyVideoPreset(15)}
              >
                15s
              </button>
            )}
            {videoTrim.duration > 30 && (
              <button
                type="button"
                className={`ig-trim-preset-btn ${
                  videoTrim.end - videoTrim.start === 30 ? 'active' : ''
                }`}
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
  );
};

export default StoryCropTab;
