import React, { useRef } from 'react';
import Modal from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import {
  STORY_ASPECT_RATIOS,
  StoryUploadDropzone,
  StoryMediaPicker,
  StorySubnav,
  StoryCanvasPreview,
  StoryStickerOverlays,
  StoryEditSidebar,
  StoryCropTab,
  StoryFiltersTab,
  StoryStickersTab,
  StoryMusicPicker,
  StorySettingsFooter,
  useStoryMedia,
  useStoryCropZoom,
  useStoryStickers,
  useStorySubmit,
} from '../create-story';
import './CreatePostModal.css';
import './CreateStoryModal.css';

export {
  STORY_ASPECT_RATIOS,
  StoryUploadDropzone,
  StoryMediaPicker,
  StorySubnav,
  StoryCanvasPreview,
  StoryStickerOverlays,
  StoryEditSidebar,
  StoryCropTab,
  StoryFiltersTab,
  StoryStickersTab,
  StoryMusicPicker,
  StorySettingsFooter,
  useStoryMedia,
  useStoryCropZoom,
  useStoryStickers,
  useStorySubmit,
};

export const CreateStoryModal = ({ isOpen, onClose, onStoryCreated }) => {
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();
  const fileInputRef = useRef(null);

  // 1. Media selection and video metadata
  const media = useStoryMedia({ showError });

  // 2. Crop, Zoom, Ratio & Video Duration Trimming
  const cropZoom = useStoryCropZoom({
    file: media.file,
    setFile: media.setFile,
    originalFile: media.originalFile,
    previewUrl: media.previewUrl,
    setPreviewUrl: media.setPreviewUrl,
    originalPreviewUrl: media.originalPreviewUrl,
    setIsCropped: media.setIsCropped,
    showSuccess,
    showError,
  });

  // 3. Sticker overlays, mentions, interactive widgets & music
  const stickers = useStoryStickers();

  // Reset and Close lifecycle
  const resetForm = (keepThumbnailUrl = null) => {
    media.resetMediaState(keepThumbnailUrl);
    cropZoom.resetCropZoomState();
    stickers.resetStickersState();
    submit.resetSubmitState();
  };

  const handleClose = (keepThumbnailUrl = null) => {
    resetForm(keepThumbnailUrl);
    onClose();
  };

  // 4. Story Submission & Background Upload handoff
  const submit = useStorySubmit({
    file: media.file,
    previewUrl: media.previewUrl,
    selectedRatio: cropZoom.selectedRatio,
    videoTrim: cropZoom.videoTrim,
    selectedFilter: cropZoom.selectedFilter,
    stickers,
    uploadCtx,
    showSuccess,
    showError,
    onStoryCreated,
    handleClose,
  });

  const onFileSelect = (selectedFile) => {
    media.handleFileSelect(selectedFile, ({ duration, filmstripFrames }) => {
      cropZoom.setVideoDuration(duration);
      cropZoom.setVideoTrim({
        start: 0,
        end: Math.min(60, duration),
        duration,
        coverTime: 0,
      });
      if (filmstripFrames && filmstripFrames.length > 0) {
        cropZoom.setFilmstripFrames(filmstripFrames);
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={media.previewUrl ? null : 'Add to Story'}
      showCloseButton={!media.previewUrl}
      size={media.previewUrl ? 'lg' : 'md'}
    >
      <div className="create-story-form">
        {!media.previewUrl ? (
          <StoryMediaPicker
            fileInputRef={fileInputRef}
            handleFileSelect={onFileSelect}
          />
        ) : (
          <>
            {/* Wizard Subnav Header with Top-Right Save Button & Close Button */}
            <StorySubnav
              handleBack={() => {
                media.setPreviewUrl('');
                media.setFile(null);
              }}
              handleSaveCrop={cropZoom.handleSaveCrop}
              isSavingCrop={cropZoom.isSavingCrop}
              handleClose={handleClose}
            />

            {/* 2-Column Story Edit Workspace */}
            <div className="story-edit-workspace">
              {/* Left Column: Media Viewport & Canvas Gestures */}
              <StoryCanvasPreview
                canvasRef={stickers.canvasRef}
                isDragging={cropZoom.isDragging}
                selectedRatio={cropZoom.selectedRatio}
                handleMouseDown={cropZoom.handleMouseDown}
                handleMouseMove={cropZoom.handleMouseMove}
                handleMouseUp={cropZoom.handleMouseUp}
                handleWheel={cropZoom.handleWheel}
                handleSaveCrop={cropZoom.handleSaveCrop}
                isSavingCrop={cropZoom.isSavingCrop}
                cropSavedToast={cropZoom.cropSavedToast}
                isVideo={media.isVideo}
                videoPreviewRef={cropZoom.videoPreviewRef}
                previewUrl={media.previewUrl}
                selectedFilter={cropZoom.selectedFilter}
                videoDuration={cropZoom.videoDuration}
                handleVideoMetadataLoaded={cropZoom.handleVideoMetadataLoaded}
                handleVideoTimeUpdate={cropZoom.handleVideoTimeUpdate}
                setIsEditVideoPlaying={cropZoom.setIsEditVideoPlaying}
                isEditVideoPlaying={cropZoom.isEditVideoPlaying}
                handleToggleEditVideoPlay={cropZoom.handleToggleEditVideoPlay}
                videoTrim={cropZoom.videoTrim}
                editVideoCurrentTime={cropZoom.editVideoCurrentTime}
                isEditVideoMuted={cropZoom.isEditVideoMuted}
                handleToggleEditVideoMute={cropZoom.handleToggleEditVideoMute}
                setVideoTrim={cropZoom.setVideoTrim}
                setEditVideoCurrentTime={cropZoom.setEditVideoCurrentTime}
                handleResetVideoTrim={cropZoom.handleResetVideoTrim}
                handleApplyVideoPreset={cropZoom.handleApplyVideoPreset}
                filmstripFrames={cropZoom.filmstripFrames}
                imageStageRef={cropZoom.imageStageRef}
                imgElementRef={cropZoom.imgElementRef}
                isCropped={media.isCropped}
                originalPreviewUrl={media.originalPreviewUrl}
                isCustomCropActive={cropZoom.isCustomCropActive}
                activeCrop={cropZoom.activeCrop}
                customBox={cropZoom.customBox}
                handleStartBoxDrag={cropZoom.handleStartBoxDrag}
                showGrid={cropZoom.showGrid}
                stickerProps={{
                  isMusicActive: stickers.isMusicActive,
                  activeStickerType: stickers.activeStickerType,
                  setActiveStickerType: stickers.setActiveStickerType,
                  draggingStickerKey: stickers.draggingStickerKey,
                  stickerPositions: stickers.stickerPositions,
                  handleStickerPointerDown: stickers.handleStickerPointerDown,
                  setAudioTitle: stickers.setAudioTitle,
                  setAudioArtist: stickers.setAudioArtist,
                  audioTitle: stickers.audioTitle,
                  audioArtist: stickers.audioArtist,
                  showMentionsOnScreen: stickers.showMentionsOnScreen,
                  setShowMentionsOnScreen: stickers.setShowMentionsOnScreen,
                  selectedMentionUsers: stickers.selectedMentionUsers,
                  mentionSearch: stickers.mentionSearch,
                  handleRemoveMentionUser: (id) =>
                    stickers.setSelectedMentionUsers((prev) =>
                      prev.filter((m) => (m.id || m.userId) !== id)
                    ),
                  isInteractiveActive: stickers.isInteractiveActive,
                  interactiveType: stickers.interactiveType,
                  setInteractiveType: stickers.setInteractiveType,
                  questionPrompt: stickers.questionPrompt,
                  setQuestionPrompt: stickers.setQuestionPrompt,
                  pollQuestion: stickers.pollQuestion,
                  setPollQuestion: stickers.setPollQuestion,
                  pollOptionA: stickers.pollOptionA,
                  setPollOptionA: stickers.setPollOptionA,
                  pollOptionB: stickers.pollOptionB,
                  setPollOptionB: stickers.setPollOptionB,
                  quizQuestion: stickers.quizQuestion,
                  setQuizQuestion: stickers.setQuizQuestion,
                  quizOptionA: stickers.quizOptionA,
                  setQuizOptionA: stickers.setQuizOptionA,
                  quizOptionB: stickers.quizOptionB,
                  setQuizOptionB: stickers.setQuizOptionB,
                  quizOptionC: stickers.quizOptionC,
                  setQuizOptionC: stickers.setQuizOptionC,
                  quizCorrectIndex: stickers.quizCorrectIndex,
                  setQuizCorrectIndex: stickers.setQuizCorrectIndex,
                  sliderQuestion: stickers.sliderQuestion,
                  setSliderQuestion: stickers.setSliderQuestion,
                  sliderEmoji: stickers.sliderEmoji,
                  countdownTitle: stickers.countdownTitle,
                  countdownDate: stickers.countdownDate,
                  isLinkActive: stickers.isLinkActive,
                  linkUrl: stickers.linkUrl,
                  setLinkUrl: stickers.setLinkUrl,
                  linkText: stickers.linkText,
                  setLinkText: stickers.setLinkText,
                  isLocationActive: stickers.isLocationActive,
                  locationName: stickers.locationName,
                  setLocationName: stickers.setLocationName,
                  isHashtagActive: stickers.isHashtagActive,
                  hashtagTag: stickers.hashtagTag,
                  setHashtagTag: stickers.setHashtagTag,
                }}
              />

              {/* Right Column: Tools Sidebar & Sticky Footer */}
              <StoryEditSidebar
                editTab={cropZoom.editTab}
                setEditTab={cropZoom.setEditTab}
                selectedRatio={cropZoom.selectedRatio}
                setSelectedRatio={cropZoom.setSelectedRatio}
                setIsCustomCropActive={cropZoom.setIsCustomCropActive}
                isCustomCropActive={cropZoom.isCustomCropActive}
                isVideo={media.isVideo}
                activeCrop={cropZoom.activeCrop}
                handleResetCrop={cropZoom.handleResetCrop}
                setShowGrid={cropZoom.setShowGrid}
                handleZoomChange={cropZoom.handleZoomChange}
                handleRotate={cropZoom.handleRotate}
                handleSaveCrop={cropZoom.handleSaveCrop}
                isSavingCrop={cropZoom.isSavingCrop}
                videoTrim={cropZoom.videoTrim}
                handleResetVideoTrim={cropZoom.handleResetVideoTrim}
                handleTrimStartChange={cropZoom.handleTrimStartChange}
                handleTrimEndChange={cropZoom.handleTrimEndChange}
                handleApplyVideoPreset={cropZoom.handleApplyVideoPreset}
                selectedFilter={cropZoom.selectedFilter}
                setSelectedFilter={cropZoom.setSelectedFilter}
                previewUrl={media.previewUrl}
                attachedCount={stickers.attachedCount}
                activeStickerType={stickers.activeStickerType}
                setActiveStickerType={stickers.setActiveStickerType}
                setInteractiveType={stickers.setInteractiveType}
                interactiveType={stickers.interactiveType}
                isMusicActive={stickers.isMusicActive}
                isMentionActive={stickers.isMentionActive}
                audioTitle={stickers.audioTitle}
                setAudioTitle={stickers.setAudioTitle}
                audioArtist={stickers.audioArtist}
                setAudioArtist={stickers.setAudioArtist}
                selectedMentionUsers={stickers.selectedMentionUsers}
                setSelectedMentionUsers={stickers.setSelectedMentionUsers}
                handleRemoveCurrentSticker={stickers.handleRemoveCurrentSticker}
                handleSetPresetPosition={stickers.handleSetPresetPosition}
                stickerPos={stickers.stickerPos}
                showMentionsOnScreen={stickers.showMentionsOnScreen}
                setShowMentionsOnScreen={stickers.setShowMentionsOnScreen}
                mentionSearch={stickers.mentionSearch}
                setMentionSearch={stickers.setMentionSearch}
                isSearchingMention={stickers.isSearchingMention}
                mentionUserResults={stickers.mentionUserResults}
                setMentionUserResults={stickers.setMentionUserResults}
                questionPrompt={stickers.questionPrompt}
                setQuestionPrompt={stickers.setQuestionPrompt}
                pollQuestion={stickers.pollQuestion}
                setPollQuestion={stickers.setPollQuestion}
                pollOptionA={stickers.pollOptionA}
                setPollOptionA={stickers.setPollOptionA}
                pollOptionB={stickers.pollOptionB}
                setPollOptionB={stickers.setPollOptionB}
                quizQuestion={stickers.quizQuestion}
                setQuizQuestion={stickers.setQuizQuestion}
                quizOptionA={stickers.quizOptionA}
                setQuizOptionA={stickers.setQuizOptionA}
                quizOptionB={stickers.quizOptionB}
                setQuizOptionB={stickers.setQuizOptionB}
                quizOptionC={stickers.quizOptionC}
                setQuizOptionC={stickers.setQuizOptionC}
                quizCorrectIndex={stickers.quizCorrectIndex}
                setQuizCorrectIndex={stickers.setQuizCorrectIndex}
                sliderQuestion={stickers.sliderQuestion}
                setSliderQuestion={stickers.setSliderQuestion}
                sliderEmoji={stickers.sliderEmoji}
                setSliderEmoji={stickers.setSliderEmoji}
                countdownTitle={stickers.countdownTitle}
                setCountdownTitle={stickers.setCountdownTitle}
                countdownDate={stickers.countdownDate}
                setCountdownDate={stickers.setCountdownDate}
                isLinkActive={stickers.isLinkActive}
                linkUrl={stickers.linkUrl}
                setLinkUrl={stickers.setLinkUrl}
                linkText={stickers.linkText}
                setLinkText={stickers.setLinkText}
                isLocationActive={stickers.isLocationActive}
                locationName={stickers.locationName}
                setLocationName={stickers.setLocationName}
                isHashtagActive={stickers.isHashtagActive}
                hashtagTag={stickers.hashtagTag}
                setHashtagTag={stickers.setHashtagTag}
                handleClose={handleClose}
                loading={submit.loading}
                isCloseFriendsOnly={submit.isCloseFriendsOnly}
                doSubmit={submit.doSubmit}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateStoryModal;
