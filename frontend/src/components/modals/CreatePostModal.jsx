import React, { useState, useRef } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import './CreatePostModal.css';

import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  generateCroppedImage,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
  PostUploadStep,
  PostCanvasPreview,
  PostEditSidebar,
  PostDetailsStep,
  POPULAR_LOCATIONS,
  usePostMediaState,
  usePostCropZoom,
  usePostDetails,
} from '../create-post';

export {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  generateCroppedImage,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
  PostUploadStep,
  PostCanvasPreview,
  PostEditSidebar,
  PostDetailsStep,
  POPULAR_LOCATIONS,
  usePostMediaState,
  usePostCropZoom,
  usePostDetails,
};

const WIZARD_STEPS = {
  UPLOAD: 'UPLOAD',
  EDIT: 'EDIT', // Crop, filters, aspect ratio
  DETAILS: 'DETAILS', // Caption, tags, location, alt-text, settings
};

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [currentStep, setCurrentStep] = useState(WIZARD_STEPS.UPLOAD);

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();

  // 1. Media state management & Carousel handling
  const mediaState = usePostMediaState({ showError });

  // 2. Crop, Zoom, Pan, Aspect Ratio & Video Trim synchronizer
  const cropZoom = usePostCropZoom({
    activeItem: mediaState.activeItem,
    activeCrop: mediaState.activeCrop,
    isVideo: mediaState.isVideo,
    updateActiveCrop: mediaState.updateActiveCrop,
    updateActiveVideoTrim: mediaState.updateActiveVideoTrim,
    mediaItems: mediaState.mediaItems,
    setMediaItems: mediaState.setMediaItems,
    activeMediaIdx: mediaState.activeMediaIdx,
    showSuccess,
    showError,
  });

  const resetForm = (keepThumbnailUrl = null, preserveObjectUrls = false) => {
    mediaState.resetMediaState(keepThumbnailUrl, preserveObjectUrls);
    cropZoom.resetCropZoomState();
    details.resetDetailsState();
    setCurrentStep(WIZARD_STEPS.UPLOAD);
  };

  const handleClose = (keepThumbnailUrl = null, preserveObjectUrls = false) => {
    resetForm(keepThumbnailUrl, preserveObjectUrls);
    onClose();
  };

  // 3. Post Details, User Tagging, Collaborators & Final Submission
  const details = usePostDetails({
    mediaItems: mediaState.mediaItems,
    setMediaItems: mediaState.setMediaItems,
    activeMediaIdx: mediaState.activeMediaIdx,
    selectedRatio: cropZoom.selectedRatio,
    currentUser,
    uploadCtx,
    showSuccess,
    showError,
    onPostCreated,
    handleClose,
  });

  const onFilesAdded = (files) => {
    mediaState.handleFilesAdded(files, () => {
      if (currentStep === WIZARD_STEPS.UPLOAD) {
        setCurrentStep(WIZARD_STEPS.EDIT);
      }
    });
  };

  const onRemoveMedia = (index) => {
    mediaState.handleRemoveMedia(index, () => {
      resetForm();
    });
  };

  const onProceedToDetails = () => {
    cropZoom.handleProceedToDetails(() => {
      setCurrentStep(WIZARD_STEPS.DETAILS);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === WIZARD_STEPS.UPLOAD
          ? 'Create new post'
          : currentStep === WIZARD_STEPS.EDIT
          ? 'Crop & Filters'
          : 'Create new post'
      }
      size={currentStep === WIZARD_STEPS.UPLOAD ? 'md' : 'lg'}
    >
      <div className="ig-wizard-container">
        {/* Wizard Navigation Header */}
        {currentStep !== WIZARD_STEPS.UPLOAD && (
          <div className="ig-wizard-subnav">
            <button
              type="button"
              className="ig-subnav-btn"
              onClick={() => {
                if (currentStep === WIZARD_STEPS.DETAILS) {
                  setCurrentStep(WIZARD_STEPS.EDIT);
                } else if (currentStep === WIZARD_STEPS.EDIT) {
                  setCurrentStep(WIZARD_STEPS.UPLOAD);
                }
              }}
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <span className="ig-subnav-title">
              {currentStep === WIZARD_STEPS.EDIT ? 'Edit' : 'Create new post'}
            </span>

            {currentStep === WIZARD_STEPS.EDIT ? (
              <div className="ig-subnav-right-actions">
                <button
                  type="button"
                  className="ig-subnav-save-crop-btn"
                  onClick={cropZoom.handleSaveCrop}
                  disabled={cropZoom.isSavingCrop || cropZoom.processingCrop}
                  title="Save Crop & Changes (✓)"
                  aria-label="Save Crop & Changes"
                >
                  <Check size={16} strokeWidth={2.8} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  className="ig-subnav-action-btn next"
                  onClick={onProceedToDetails}
                  disabled={cropZoom.processingCrop || cropZoom.isSavingCrop}
                >
                  {cropZoom.processingCrop ? 'Cropping...' : 'Next'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ig-subnav-action-btn share"
                onClick={details.handleSubmit}
                disabled={details.loading}
              >
                {details.loading ? <LoadingSpinner size="sm" /> : 'Share'}
              </button>
            )}
          </div>
        )}

        {/* STEP 1: INITIAL UPLOAD SELECTOR */}
        {currentStep === WIZARD_STEPS.UPLOAD && (
          <PostUploadStep
            fileInputRef={fileInputRef}
            handleFilesAdded={onFilesAdded}
          />
        )}

        {/* STEP 2: CROP, ASPECT RATIO & 12 FILTERS */}
        {currentStep === WIZARD_STEPS.EDIT && mediaState.activeItem && (
          <div className="ig-edit-workspace">
            <PostCanvasPreview
              selectedRatio={cropZoom.selectedRatio}
              isDragging={cropZoom.isDragging}
              handleMouseDown={cropZoom.handleMouseDown}
              handleMouseMove={cropZoom.handleMouseMove}
              handleMouseUp={cropZoom.handleMouseUp}
              handleWheel={cropZoom.handleWheel}
              handleSaveCrop={cropZoom.handleSaveCrop}
              isSavingCrop={cropZoom.isSavingCrop}
              cropSavedToast={cropZoom.cropSavedToast}
              isVideo={mediaState.isVideo}
              videoPlayerRef={cropZoom.videoPlayerRef}
              activeItem={mediaState.activeItem}
              handleVideoMetadataLoaded={cropZoom.handleVideoMetadataLoaded}
              handleVideoTimeUpdate={cropZoom.handleVideoTimeUpdate}
              isEditVideoPlaying={cropZoom.isEditVideoPlaying}
              setIsEditVideoPlaying={cropZoom.setIsEditVideoPlaying}
              handleToggleEditVideoPlay={cropZoom.handleToggleEditVideoPlay}
              videoTrim={mediaState.videoTrim}
              editVideoCurrentTime={cropZoom.editVideoCurrentTime}
              setEditVideoCurrentTime={cropZoom.setEditVideoCurrentTime}
              isEditVideoMuted={cropZoom.isEditVideoMuted}
              handleToggleEditVideoMute={cropZoom.handleToggleEditVideoMute}
              updateActiveVideoTrim={mediaState.updateActiveVideoTrim}
              handleResetVideoTrim={cropZoom.handleResetVideoTrim}
              handleApplyVideoPreset={cropZoom.handleApplyVideoPreset}
              imageStageRef={cropZoom.imageStageRef}
              imgElementRef={cropZoom.imgElementRef}
              isCustomCropActive={cropZoom.isCustomCropActive}
              activeCrop={mediaState.activeCrop}
              customBox={mediaState.customBox}
              handleStartBoxDrag={cropZoom.handleStartBoxDrag}
              showGrid={cropZoom.showGrid}
              showRatioMenu={cropZoom.showRatioMenu}
              setShowRatioMenu={cropZoom.setShowRatioMenu}
              showZoomMenu={cropZoom.showZoomMenu}
              setShowZoomMenu={cropZoom.setShowZoomMenu}
              handleSelectRatio={cropZoom.handleSelectRatio}
              handleZoomChange={cropZoom.handleZoomChange}
              mediaItems={mediaState.mediaItems}
              activeMediaIdx={mediaState.activeMediaIdx}
              setActiveMediaIdx={mediaState.setActiveMediaIdx}
            />

            <PostEditSidebar
              editTab={cropZoom.editTab}
              setEditTab={cropZoom.setEditTab}
              activeItem={mediaState.activeItem}
              isVideo={mediaState.isVideo}
              handleApplyFilter={mediaState.handleApplyFilter}
              selectedRatio={cropZoom.selectedRatio}
              handleSelectRatio={cropZoom.handleSelectRatio}
              activeCrop={mediaState.activeCrop}
              handleResetCrop={cropZoom.handleResetCrop}
              setShowGrid={cropZoom.setShowGrid}
              handleZoomChange={cropZoom.handleZoomChange}
              isCustomCropActive={cropZoom.isCustomCropActive}
              handleToggleCustomCrop={cropZoom.handleToggleCustomCrop}
              handleRotate={cropZoom.handleRotate}
              handleSaveCrop={cropZoom.handleSaveCrop}
              isSavingCrop={cropZoom.isSavingCrop}
              videoTrim={mediaState.videoTrim}
              handleResetVideoTrim={cropZoom.handleResetVideoTrim}
              handleTrimStartChange={cropZoom.handleTrimStartChange}
              handleTrimEndChange={cropZoom.handleTrimEndChange}
              handleApplyVideoPreset={cropZoom.handleApplyVideoPreset}
              handleCoverTimeChange={cropZoom.handleCoverTimeChange}
              mediaItems={mediaState.mediaItems}
              activeMediaIdx={mediaState.activeMediaIdx}
              setActiveMediaIdx={mediaState.setActiveMediaIdx}
              handleRemoveMedia={onRemoveMedia}
              addMoreInputRef={addMoreInputRef}
              handleFilesAdded={onFilesAdded}
            />
          </div>
        )}

        {/* STEP 3: DETAILS, TAGS, ALT-TEXT & ADVANCED SETTINGS */}
        {currentStep === WIZARD_STEPS.DETAILS && mediaState.activeItem && (
          <PostDetailsStep
            imagePreviewRef={details.imagePreviewRef}
            handleImageClick={details.handleImageClick}
            selectedRatio={cropZoom.selectedRatio}
            isVideo={mediaState.isVideo}
            activeItem={mediaState.activeItem}
            videoTrim={mediaState.videoTrim}
            handleRemoveTag={details.handleRemoveTag}
            taggingPos={details.taggingPos}
            setTaggingPos={details.setTaggingPos}
            userSearchQuery={details.userSearchQuery}
            handleSearchUsers={details.handleSearchUsers}
            userSearchResults={details.userSearchResults}
            handleSelectTaggedUser={details.handleSelectTaggedUser}
            mediaItems={mediaState.mediaItems}
            activeMediaIdx={mediaState.activeMediaIdx}
            setActiveMediaIdx={mediaState.setActiveMediaIdx}
            currentUser={currentUser}
            caption={details.caption}
            setCaption={details.setCaption}
            location={details.location}
            setLocation={details.setLocation}
            collaborator={details.collaborator}
            setCollaborator={details.setCollaborator}
            collabQuery={details.collabQuery}
            setCollabQuery={details.setCollabQuery}
            handleSearchCollab={details.handleSearchCollab}
            showCollabSearch={details.showCollabSearch}
            setShowCollabSearch={details.setShowCollabSearch}
            collabResults={details.collabResults}
            setCollabResults={details.setCollabResults}
            showAltTextSection={details.showAltTextSection}
            setShowAltTextSection={details.setShowAltTextSection}
            handleAltTextChange={mediaState.handleAltTextChange}
            showAdvanced={details.showAdvanced}
            setShowAdvanced={details.setShowAdvanced}
            hideLikeCount={details.hideLikeCount}
            setHideLikeCount={details.setHideLikeCount}
            commentsDisabled={details.commentsDisabled}
            setCommentsDisabled={details.setCommentsDisabled}
          />
        )}

        {/* Global Loading Overlay */}
        {details.loading && (
          <div className="ig-loading-overlay">
            <LoadingSpinner size="lg" />
            <p className="ig-loading-status-text">
              {details.uploadProgress || 'Processing...'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreatePostModal;
