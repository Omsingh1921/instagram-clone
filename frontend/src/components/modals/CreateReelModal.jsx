import React, { useState, useRef, useCallback } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
} from '../create-post';
import {
  ReelUploadStep,
  ReelSubnav,
  ReelCanvasPreview,
  ReelEditSidebar,
  ReelDetailsStep,
  useReelMedia,
  useReelTrim,
  useReelSubmit,
  REEL_ASPECT_RATIOS,
  POPULAR_LOCATIONS,
} from '../create-reel';
import './CreatePostModal.css';

export {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
};

const WIZARD_STEPS = {
  UPLOAD: 'UPLOAD',
  EDIT: 'EDIT',
  DETAILS: 'DETAILS',
};

export const CreateReelModal = ({ isOpen, onClose, onReelCreated }) => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();

  const [currentStep, setCurrentStep] = useState(WIZARD_STEPS.UPLOAD);
  const submitRef = useRef(null);

  // 1. Video media handling hook
  const media = useReelMedia({
    showError,
    onFileSelected: () => {
      setCurrentStep(WIZARD_STEPS.EDIT);
    },
    onMetadataLoaded: ({ duration, thumbnailUrl }) => {
      trim.setVideoTrim((prev) => ({
        ...prev,
        start: 0,
        end: Math.min(90, duration),
        duration: duration,
        coverTime: 0,
      }));
      if (thumbnailUrl) {
        media.setCustomThumbnailUrl(thumbnailUrl);
      }
    },
  });

  // 2. Video duration trimming, aspect ratio presets & filters hook
  const trim = useReelTrim({
    file: media.file,
    videoPreviewRef: media.videoPreviewRef,
    customThumbnailUrl: media.customThumbnailUrl,
    setCustomThumbnailUrl: media.setCustomThumbnailUrl,
    showSuccess,
    showError,
  });

  // Modal close handler
  const handleClose = useCallback(
    (keepThumbnailUrl = null) => {
      media.resetMedia(keepThumbnailUrl);
      trim.resetTrim();
      submitRef.current?.resetDetails();
      setCurrentStep(WIZARD_STEPS.UPLOAD);
      onClose();
    },
    [media, trim, onClose]
  );

  // 3. Caption, location, advanced settings & background upload hook
  const submit = useReelSubmit({
    file: media.file,
    previewUrl: media.previewUrl,
    selectedRatio: trim.selectedRatio,
    videoTrim: trim.videoTrim,
    videoDuration: media.videoDuration,
    currentUser,
    uploadCtx,
    captureThumbnailBlob: media.captureThumbnailBlob,
    onClose: handleClose,
    onReelCreated,
    showSuccess,
    showError,
  });
  submitRef.current = submit;

  // Proceed to Details Step
  const handleProceedToDetails = async () => {
    if (!media.customThumbnailUrl) {
      const res = await extractVideoThumbnail(
        media.file,
        trim.videoTrim.coverTime || trim.videoTrim.start || 0.5
      );
      if (res?.thumbnailUrl) media.setCustomThumbnailUrl(res.thumbnailUrl);
    }
    setCurrentStep(WIZARD_STEPS.DETAILS);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === WIZARD_STEPS.UPLOAD
          ? 'Create new reel'
          : currentStep === WIZARD_STEPS.EDIT
          ? 'Crop & Trim Reel'
          : 'Create new reel'
      }
      size={currentStep === WIZARD_STEPS.UPLOAD ? 'md' : 'lg'}
    >
      <div className="ig-wizard-container">
        <canvas ref={media.canvasRef} style={{ display: 'none' }} />

        {/* Wizard Navigation Header */}
        <ReelSubnav
          currentStep={currentStep}
          WIZARD_STEPS={WIZARD_STEPS}
          onBack={() => {
            if (currentStep === WIZARD_STEPS.DETAILS) {
              setCurrentStep(WIZARD_STEPS.EDIT);
            } else if (currentStep === WIZARD_STEPS.EDIT) {
              setCurrentStep(WIZARD_STEPS.UPLOAD);
            }
          }}
          onSaveCrop={() => trim.handleSaveCrop(media.videoDuration)}
          isSavingCrop={trim.isSavingCrop}
          onProceedToDetails={handleProceedToDetails}
          onSubmit={submit.handleSubmit}
          loading={submit.loading}
        />

        {/* STEP 1: INITIAL UPLOAD / VIDEO DROPZONE */}
        {currentStep === WIZARD_STEPS.UPLOAD && (
          <ReelUploadStep
            fileInputRef={media.fileInputRef}
            onFileSelect={media.handleFileSelect}
          />
        )}

        {/* STEP 2: EDIT, CROP & PHONE VIDEO TRIMMER */}
        {currentStep === WIZARD_STEPS.EDIT && media.file && (
          <div className="ig-edit-workspace">
            <ReelCanvasPreview
              selectedRatio={trim.selectedRatio}
              onSaveCrop={() => trim.handleSaveCrop(media.videoDuration)}
              isSavingCrop={trim.isSavingCrop}
              cropSavedToast={trim.cropSavedToast}
              videoPreviewRef={media.videoPreviewRef}
              previewUrl={media.previewUrl}
              selectedFilter={trim.selectedFilter}
              videoDuration={media.videoDuration}
              handleVideoMetadataLoaded={(e) => {
                const dur = trim.handleVideoMetadataLoaded(e, media.videoDuration);
                if (dur && dur !== media.videoDuration) {
                  media.setVideoDuration(dur);
                }
              }}
              handleVideoTimeUpdate={(e) => trim.handleVideoTimeUpdate(e, media.videoDuration)}
              isEditVideoPlaying={trim.isEditVideoPlaying}
              setIsEditVideoPlaying={trim.setIsEditVideoPlaying}
              handleToggleEditVideoPlay={(e) => trim.handleToggleEditVideoPlay(e, media.videoDuration)}
              videoTrim={trim.videoTrim}
              editVideoCurrentTime={trim.editVideoCurrentTime}
              isEditVideoMuted={trim.isEditVideoMuted}
              handleToggleEditVideoMute={trim.handleToggleEditVideoMute}
              setVideoTrim={trim.setVideoTrim}
              setEditVideoCurrentTime={trim.setEditVideoCurrentTime}
              handleResetVideoTrim={() => trim.handleResetVideoTrim(media.videoDuration)}
              handleApplyVideoPreset={trim.handleApplyVideoPreset}
              filmstripFrames={media.filmstripFrames}
            />

            <ReelEditSidebar
              editTab={trim.editTab}
              setEditTab={trim.setEditTab}
              selectedFilter={trim.selectedFilter}
              setSelectedFilter={trim.setSelectedFilter}
              customThumbnailUrl={media.customThumbnailUrl}
              REEL_ASPECT_RATIOS={REEL_ASPECT_RATIOS}
              selectedRatio={trim.selectedRatio}
              setSelectedRatio={trim.setSelectedRatio}
              videoTrim={trim.videoTrim}
              videoDuration={media.videoDuration}
              handleResetVideoTrim={() => trim.handleResetVideoTrim(media.videoDuration)}
              handleTrimStartChange={(val) => trim.handleTrimStartChange(val, media.videoDuration)}
              handleTrimEndChange={trim.handleTrimEndChange}
              handleApplyVideoPreset={trim.handleApplyVideoPreset}
              handleSaveCrop={() => trim.handleSaveCrop(media.videoDuration)}
              isSavingCrop={trim.isSavingCrop}
              handleCoverTimeChange={trim.handleCoverTimeChange}
            />
          </div>
        )}

        {/* STEP 3: DETAILS & SHARE */}
        {currentStep === WIZARD_STEPS.DETAILS && media.file && (
          <ReelDetailsStep
            previewUrl={media.previewUrl}
            videoTrim={trim.videoTrim}
            selectedFilter={trim.selectedFilter}
            selectedRatio={trim.selectedRatio}
            currentUser={currentUser}
            caption={submit.caption}
            setCaption={submit.setCaption}
            location={submit.location}
            setLocation={submit.setLocation}
            POPULAR_LOCATIONS={POPULAR_LOCATIONS}
            customThumbnailUrl={media.customThumbnailUrl}
            showAdvanced={submit.showAdvanced}
            setShowAdvanced={submit.setShowAdvanced}
            hideLikeCount={submit.hideLikeCount}
            setHideLikeCount={submit.setHideLikeCount}
            commentsDisabled={submit.commentsDisabled}
            setCommentsDisabled={submit.setCommentsDisabled}
            onSubmit={submit.handleSubmit}
            loading={submit.loading}
          />
        )}
      </div>
    </Modal>
  );
};

export default CreateReelModal;
