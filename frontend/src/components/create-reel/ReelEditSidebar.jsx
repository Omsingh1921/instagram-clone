import React from 'react';
import { Sliders, Sparkles } from 'lucide-react';
import ReelFiltersGallery from './ReelFiltersGallery';
import ReelAdjustTab from './ReelAdjustTab';

export const ReelEditSidebar = ({
  editTab,
  setEditTab,
  selectedFilter,
  setSelectedFilter,
  customThumbnailUrl,
  REEL_ASPECT_RATIOS,
  selectedRatio,
  setSelectedRatio,
  videoTrim,
  videoDuration,
  handleResetVideoTrim,
  handleTrimStartChange,
  handleTrimEndChange,
  handleApplyVideoPreset,
  handleSaveCrop,
  isSavingCrop,
  handleCoverTimeChange,
}) => {
  return (
    <div className="ig-edit-sidebar">
      <div className="ig-edit-tab-headers">
        <button
          type="button"
          className={`ig-edit-tab-btn ${editTab === 'RATIO' ? 'active' : ''}`}
          onClick={() => setEditTab('RATIO')}
        >
          <Sliders size={16} />
          <span>Adjust & Trim</span>
        </button>
        <button
          type="button"
          className={`ig-edit-tab-btn ${editTab === 'FILTERS' ? 'active' : ''}`}
          onClick={() => setEditTab('FILTERS')}
        >
          <Sparkles size={16} />
          <span>Filters</span>
        </button>
      </div>

      {/* Filters Gallery */}
      {editTab === 'FILTERS' && (
        <ReelFiltersGallery
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          customThumbnailUrl={customThumbnailUrl}
        />
      )}

      {/* Aspect Ratio & Trim Controls */}
      {editTab === 'RATIO' && (
        <ReelAdjustTab
          REEL_ASPECT_RATIOS={REEL_ASPECT_RATIOS}
          selectedRatio={selectedRatio}
          setSelectedRatio={setSelectedRatio}
          videoTrim={videoTrim}
          videoDuration={videoDuration}
          handleResetVideoTrim={handleResetVideoTrim}
          handleTrimStartChange={handleTrimStartChange}
          handleTrimEndChange={handleTrimEndChange}
          handleApplyVideoPreset={handleApplyVideoPreset}
          handleSaveCrop={handleSaveCrop}
          isSavingCrop={isSavingCrop}
          handleCoverTimeChange={handleCoverTimeChange}
        />
      )}
    </div>
  );
};

export default ReelEditSidebar;
