import React from 'react';
import { Sliders, Sparkles, Smile } from 'lucide-react';
import StoryCropTab, { STORY_ASPECT_RATIOS } from './StoryCropTab';
import StoryFiltersTab from './StoryFiltersTab';
import StoryStickersTab from './StoryStickersTab';
import StorySettingsFooter from './StorySettingsFooter';

export { STORY_ASPECT_RATIOS };

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
      <div className="ig-edit-sidebar story-edit-sidebar">
        {/* Story Edit Tab Bar */}
        <div className="ig-edit-tabs-bar">
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

        {/* Tab 1: Crop & Trim */}
        {editTab === 'RATIO' && (
          <StoryCropTab
            selectedRatio={selectedRatio}
            setSelectedRatio={setSelectedRatio}
            setIsCustomCropActive={setIsCustomCropActive}
            isCustomCropActive={isCustomCropActive}
            isVideo={isVideo}
            activeCrop={activeCrop}
            handleResetCrop={handleResetCrop}
            setShowGrid={setShowGrid}
            handleZoomChange={handleZoomChange}
            handleRotate={handleRotate}
            handleSaveCrop={handleSaveCrop}
            isSavingCrop={isSavingCrop}
            videoTrim={videoTrim}
            handleResetVideoTrim={handleResetVideoTrim}
            handleTrimStartChange={handleTrimStartChange}
            handleTrimEndChange={handleTrimEndChange}
            handleApplyVideoPreset={handleApplyVideoPreset}
          />
        )}

        {/* Tab 2: Filters */}
        {editTab === 'FILTERS' && (
          <StoryFiltersTab
            isVideo={isVideo}
            previewUrl={previewUrl}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
          />
        )}

        {/* Tab 3: Stickers */}
        {editTab === 'STICKERS' && (
          <StoryStickersTab
            attachedCount={attachedCount}
            activeStickerType={activeStickerType}
            setActiveStickerType={setActiveStickerType}
            interactiveType={interactiveType}
            setInteractiveType={setInteractiveType}
            isMusicActive={isMusicActive}
            isMentionActive={isMentionActive}
            audioTitle={audioTitle}
            setAudioTitle={setAudioTitle}
            audioArtist={audioArtist}
            setAudioArtist={setAudioArtist}
            selectedMentionUsers={selectedMentionUsers}
            setSelectedMentionUsers={setSelectedMentionUsers}
            handleRemoveCurrentSticker={handleRemoveCurrentSticker}
            handleSetPresetPosition={handleSetPresetPosition}
            stickerPos={stickerPos}
            showMentionsOnScreen={showMentionsOnScreen}
            setShowMentionsOnScreen={setShowMentionsOnScreen}
            mentionSearch={mentionSearch}
            setMentionSearch={setMentionSearch}
            isSearchingMention={isSearchingMention}
            mentionUserResults={mentionUserResults}
            setMentionUserResults={setMentionUserResults}
            questionPrompt={questionPrompt}
            setQuestionPrompt={setQuestionPrompt}
            pollQuestion={pollQuestion}
            setPollQuestion={setPollQuestion}
            pollOptionA={pollOptionA}
            setPollOptionA={setPollOptionA}
            pollOptionB={pollOptionB}
            setPollOptionB={setPollOptionB}
            quizQuestion={quizQuestion}
            setQuizQuestion={setQuizQuestion}
            quizOptionA={quizOptionA}
            setQuizOptionA={setQuizOptionA}
            quizOptionB={quizOptionB}
            setQuizOptionB={setQuizOptionB}
            quizOptionC={quizOptionC}
            setQuizOptionC={setQuizOptionC}
            quizCorrectIndex={quizCorrectIndex}
            setQuizCorrectIndex={setQuizCorrectIndex}
            sliderQuestion={sliderQuestion}
            setSliderQuestion={setSliderQuestion}
            sliderEmoji={sliderEmoji}
            setSliderEmoji={setSliderEmoji}
            countdownTitle={countdownTitle}
            setCountdownTitle={setCountdownTitle}
            countdownDate={countdownDate}
            setCountdownDate={setCountdownDate}
            isLinkActive={isLinkActive}
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            linkText={linkText}
            setLinkText={setLinkText}
            isLocationActive={isLocationActive}
            locationName={locationName}
            setLocationName={setLocationName}
            isHashtagActive={isHashtagActive}
            hashtagTag={hashtagTag}
            setHashtagTag={setHashtagTag}
          />
        )}
      </div>

      {/* Sticky Action Footer */}
      <StorySettingsFooter
        handleClose={handleClose}
        loading={loading}
        isCloseFriendsOnly={isCloseFriendsOnly}
        doSubmit={doSubmit}
      />
    </>
  );
};

export default StoryEditSidebar;
