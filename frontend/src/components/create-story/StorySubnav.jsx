import React from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';

export const StorySubnav = ({
  handleBack,
  handleSaveCrop,
  isSavingCrop,
  handleClose,
}) => {
  return (
    <div className="ig-wizard-subnav">
      <button
        type="button"
        className="ig-subnav-btn"
        onClick={handleBack}
        title="Back to file select"
        aria-label="Back"
      >
        <ArrowLeft size={19} />
      </button>

      <span className="ig-subnav-title">Edit Story</span>

      <div className="ig-subnav-right-actions">
        <button
          type="button"
          className="ig-subnav-save-crop-btn"
          onClick={handleSaveCrop}
          disabled={isSavingCrop}
          title="Save Story Crop & Changes (✓)"
          aria-label="Save Story Crop & Changes"
        >
          <Check size={15} strokeWidth={2.8} />
          <span>Save</span>
        </button>
        <button
          type="button"
          className="ig-subnav-close-btn"
          onClick={handleClose}
          title="Close"
          aria-label="Close"
        >
          <X size={19} />
        </button>
      </div>
    </div>
  );
};

export default StorySubnav;
