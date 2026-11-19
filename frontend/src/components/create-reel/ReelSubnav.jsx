import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

export const ReelSubnav = ({
  currentStep,
  WIZARD_STEPS,
  onBack,
  onSaveCrop,
  isSavingCrop,
  onProceedToDetails,
  onSubmit,
  loading,
}) => {
  if (currentStep === WIZARD_STEPS.UPLOAD) return null;

  return (
    <div className="ig-wizard-subnav">
      <button
        type="button"
        className="ig-subnav-btn"
        onClick={onBack}
        title="Back"
      >
        <ArrowLeft size={20} />
      </button>

      <span className="ig-subnav-title">
        {currentStep === WIZARD_STEPS.EDIT ? 'Edit Reel' : 'New Reel'}
      </span>

      {currentStep === WIZARD_STEPS.EDIT ? (
        <div className="ig-subnav-right-actions">
          <button
            type="button"
            className="ig-subnav-save-crop-btn"
            onClick={onSaveCrop}
            disabled={isSavingCrop}
            title="Save Reel Trim & Edits (✓)"
            aria-label="Save Reel Trim & Edits"
          >
            <Check size={16} strokeWidth={2.8} />
            <span>Save</span>
          </button>
          <button
            type="button"
            className="ig-subnav-action-btn next"
            onClick={onProceedToDetails}
            disabled={isSavingCrop}
          >
            Next
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="ig-subnav-action-btn share"
          onClick={(e) => onSubmit(e, false)}
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Share'}
        </button>
      )}
    </div>
  );
};

export default ReelSubnav;
