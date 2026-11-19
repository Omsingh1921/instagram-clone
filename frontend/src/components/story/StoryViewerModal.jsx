import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AddToHighlightModal } from '../modals/AddToHighlightModal';
import { EditHighlightModal } from '../modals/EditHighlightModal';
import { CreateHighlightModal } from '../modals/CreateHighlightModal';
import {
  StoryProgressBars,
  StoryHeader,
  StorySlideMedia,
  StoryInteractiveWidgets,
  StoryViewerFooter,
  StoryViewersSheet,
  StoryReportModal,
  REPORT_REASONS,
  DEFAULT_QUICK_EMOJIS,
  useStoryNavigation,
  STORY_DURATION,
  useStoryInteractive,
  useStoryReactions,
  useStoryManagement,
} from './viewer';
import './StoryViewerModal.css';

export {
  StoryProgressBars,
  StoryHeader,
  StorySlideMedia,
  StoryInteractiveWidgets,
  StoryViewerFooter,
  StoryViewersSheet,
  StoryReportModal,
  REPORT_REASONS,
  DEFAULT_QUICK_EMOJIS,
  useStoryNavigation,
  STORY_DURATION,
  useStoryInteractive,
  useStoryReactions,
  useStoryManagement,
};

const QUICK_EMOJIS = DEFAULT_QUICK_EMOJIS || ['😂', '😮', '😍', '😢', '👏', '🔥', '🎉', '💯'];

export const StoryViewerModal = ({
  isOpen,
  storyGroups = [],
  initialGroupIdx = 0,
  initialStoryIdx = 0,
  onClose,
  onHighlightUpdated,
}) => {
  const { user: currentUser, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const isBlockedRef = useRef(false);

  // 1. Navigation, timer loops, video synchronization & tap/hold gestures
  const nav = useStoryNavigation({
    storyGroups,
    initialGroupIdx,
    initialStoryIdx,
    isOpen,
    onClose,
    currentUser,
    isBlockedRef,
  });

  // 2. Interactive widgets (Question, Poll, Quiz, Slider, Countdown)
  const interactive = useStoryInteractive({
    currentStory: nav.currentStory,
    currentGroup: nav.currentGroup,
    setIsPaused: nav.setIsPaused,
    showSuccess,
    showError,
  });

  // 3. Reactions, quick replies, likes & mention resharing
  const reactions = useStoryReactions({
    currentStory: nav.currentStory,
    currentGroup: nav.currentGroup,
    setIsPaused: nav.setIsPaused,
    showSuccess,
    showError,
  });

  // 4. Viewers activity sheet, report modal, insights & highlight management
  const mgmt = useStoryManagement({
    currentStory: nav.currentStory,
    currentGroup: nav.currentGroup,
    currentUser,
    highlightId: nav.highlightId,
    safeStoryIdx: nav.safeStoryIdx,
    storyIdx: nav.storyIdx,
    setStoryIdx: nav.setStoryIdx,
    groupIdx: nav.groupIdx,
    setGroupIdx: nav.setGroupIdx,
    storyGroups,
    setProgress: nav.setProgress,
    elapsedBeforePauseRef: nav.elapsedBeforePauseRef,
    setIsPaused: nav.setIsPaused,
    goToNextStory: nav.goToNextStory,
    onHighlightUpdated,
    onClose,
    showSuccess,
    showError,
  });

  // Keep blocked state synchronized without triggering re-render cycles
  isBlockedRef.current = Boolean(mgmt.isModalBlocked || interactive.showQuestionResponses);

  // Lock body scroll and apply in-story-viewer class to hide global mobile headers/bottom navs
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('in-story-viewer');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.classList.remove('in-story-viewer');
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  if (!isOpen || !nav.currentGroup || !nav.currentStory) return null;

  const modalContent = (
    <div
      className="story-viewer-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      {/* External Desktop Close Button */}
      <button
        type="button"
        className="story-desktop-close-btn"
        onClick={onClose}
        aria-label="Close story viewer"
        title="Close (Esc)"
      >
        <X size={26} />
      </button>

      {/* External Prev Arrow */}
      {nav.groupIdx > 0 && !mgmt.showViewers && (
        <button
          type="button"
          className="story-nav-arrow prev"
          onClick={nav.goToPrevStory}
          aria-label="Previous user story"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <div
        className={`story-viewer-frame ${nav.isHolding ? 'is-holding' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bars */}
        <StoryProgressBars
          stories={nav.currentGroup.stories}
          storyIdx={nav.storyIdx}
          progress={nav.progress}
          isVideoStory={nav.isVideoStory}
          isHolding={nav.isHolding}
        />

        {/* Header */}
        <StoryHeader
          currentGroup={nav.currentGroup}
          currentStory={nav.currentStory}
          isHighlight={nav.isHighlight}
          highlightTitle={nav.highlightTitle}
          isVideoStory={nav.isVideoStory}
          isMuted={nav.isMuted}
          setIsMuted={nav.setIsMuted}
          showMoreMenu={mgmt.showMoreMenu}
          setShowMoreMenu={mgmt.setShowMoreMenu}
          setIsPaused={nav.setIsPaused}
          onClose={onClose}
          isMyStory={nav.isMyStory}
          isAdmin={isAdmin}
          setShowEditHighlight={mgmt.setShowEditHighlight}
          handleRemoveFromHighlight={mgmt.handleRemoveFromHighlight}
          handleDeleteHighlight={mgmt.handleDeleteHighlight}
          setShowAddToHighlight={mgmt.setShowAddToHighlight}
          handleOpenInsights={mgmt.handleOpenInsights}
          handleDeleteStory={mgmt.handleDeleteStory}
          setShowReportModal={mgmt.setShowReportModal}
        />

        {/* Content (Media + Interactive Widgets) */}
        <div className="story-viewer-content">
          <StorySlideMedia
            isVideoStory={nav.isVideoStory}
            videoRef={nav.videoRef}
            currentStory={nav.currentStory}
            isMuted={nav.isMuted}
            handleVideoTimeUpdate={nav.handleVideoTimeUpdate}
            handleVideoLoadedMetadata={nav.handleVideoLoadedMetadata}
            handleVideoEnded={nav.handleVideoEnded}
            showViewers={mgmt.showViewers}
            showQuestionResponses={interactive.showQuestionResponses}
            showInsights={mgmt.showInsights}
            showReportModal={mgmt.showReportModal}
            handlePointerDown={nav.handlePointerDown}
            handlePointerUp={nav.handlePointerUp}
            handlePointerCancel={nav.handlePointerCancel}
            floatingReaction={reactions.floatingReaction}
            onClose={onClose}
            navigate={navigate}
          />

          <StoryInteractiveWidgets
            currentStory={nav.currentStory}
            isMyStory={nav.isMyStory}
            handleOpenQuestionResponses={interactive.handleOpenQuestionResponses}
            hasAnsweredQuestion={interactive.hasAnsweredQuestion}
            questionAnswer={interactive.questionAnswer}
            setQuestionAnswer={interactive.setQuestionAnswer}
            setIsPaused={nav.setIsPaused}
            showQuestionResponses={interactive.showQuestionResponses}
            showViewers={mgmt.showViewers}
            handleSubmitQuestionAnswer={interactive.handleSubmitQuestionAnswer}
            pollState={interactive.pollState}
            votingPoll={interactive.votingPoll}
            handleVotePoll={interactive.handleVotePoll}
            quizState={interactive.quizState}
            votingQuiz={interactive.votingQuiz}
            handleVoteQuiz={interactive.handleVoteQuiz}
            sliderState={interactive.sliderState}
            sliderValue={interactive.sliderValue}
            setSliderValue={interactive.setSliderValue}
            votingSlider={interactive.votingSlider}
            handleVoteSlider={interactive.handleVoteSlider}
            countdownState={interactive.countdownState}
            timeLeft={interactive.timeLeft}
            handleToggleCountdownReminder={interactive.handleToggleCountdownReminder}
            togglingReminder={interactive.togglingReminder}
            onClose={onClose}
            navigate={navigate}
          />
        </div>

        {/* Footer */}
        <StoryViewerFooter
          isMyStory={nav.isMyStory}
          currentStory={nav.currentStory}
          currentGroup={nav.currentGroup}
          isHighlight={nav.isHighlight}
          handleOpenViewers={mgmt.handleOpenViewers}
          setIsPaused={nav.setIsPaused}
          setShowAddToHighlight={mgmt.setShowAddToHighlight}
          setShowEditHighlight={mgmt.setShowEditHighlight}
          isMentionedInCurrentStory={nav.isMentionedInCurrentStory}
          sharedStoriesMap={reactions.sharedStoriesMap}
          handleShareMentionedStory={reactions.handleShareMentionedStory}
          sharingMention={reactions.sharingMention}
          quickEmojis={QUICK_EMOJIS}
          handleReactEmoji={reactions.handleReactEmoji}
          replyText={reactions.replyText}
          setReplyText={reactions.setReplyText}
          showViewers={mgmt.showViewers}
          showMoreMenu={mgmt.showMoreMenu}
          handleSendReply={reactions.handleSendReply}
          likedStory={reactions.likedStory}
          handleLikeStory={reactions.handleLikeStory}
        />

        {/* Viewers & Activity Sheet */}
        <StoryViewersSheet
          showViewers={mgmt.showViewers}
          showQuestionResponses={interactive.showQuestionResponses}
          showInsights={mgmt.showInsights}
          isMyStory={nav.isMyStory}
          handleCloseViewers={mgmt.handleCloseViewers}
          handleCloseQuestionResponses={interactive.handleCloseQuestionResponses}
          setShowInsights={mgmt.setShowInsights}
          setIsPaused={nav.setIsPaused}
          loadingViewers={mgmt.loadingViewers}
          viewers={mgmt.viewers}
          loadingQuestionResponses={interactive.loadingQuestionResponses}
          questionResponses={interactive.questionResponses}
          loadingInsights={mgmt.loadingInsights}
          insightsData={mgmt.insightsData}
          onClose={onClose}
          navigate={navigate}
        />

        {/* Report Story Sheet */}
        <StoryReportModal
          showReportModal={mgmt.showReportModal}
          isMyStory={nav.isMyStory}
          setShowReportModal={mgmt.setShowReportModal}
          setIsPaused={nav.setIsPaused}
          reportReason={mgmt.reportReason}
          setReportReason={mgmt.setReportReason}
          reportDetails={mgmt.reportDetails}
          setReportDetails={mgmt.setReportDetails}
          handleReportStory={mgmt.handleReportStory}
          submittingReport={mgmt.submittingReport}
        />

        {/* Add to Highlight Modal */}
        {mgmt.showAddToHighlight && nav.currentStory && (
          <AddToHighlightModal
            isOpen={mgmt.showAddToHighlight}
            onClose={() => {
              mgmt.setShowAddToHighlight(false);
              nav.setIsPaused(false);
            }}
            story={nav.currentStory}
            onHighlightAdded={() => {
              if (onHighlightUpdated) onHighlightUpdated();
            }}
            onCreateNewRequested={(story) => {
              mgmt.setShowAddToHighlight(false);
              mgmt.setInitialStoryForCreate(story);
              mgmt.setShowCreateHighlight(true);
            }}
          />
        )}

        {/* Edit Highlight Modal */}
        {mgmt.showEditHighlight && nav.highlightId && (
          <EditHighlightModal
            isOpen={mgmt.showEditHighlight}
            onClose={() => {
              mgmt.setShowEditHighlight(false);
              nav.setIsPaused(false);
            }}
            highlightId={nav.highlightId}
            onHighlightUpdated={(updatedHl) => {
              if (onHighlightUpdated) onHighlightUpdated();
              if (updatedHl?.stories) {
                nav.currentGroup.stories = updatedHl.stories;
                if (nav.safeStoryIdx >= updatedHl.stories.length) {
                  nav.setStoryIdx(Math.max(0, updatedHl.stories.length - 1));
                }
              }
            }}
          />
        )}

        {/* Create Highlight Modal */}
        {mgmt.showCreateHighlight && (
          <CreateHighlightModal
            isOpen={mgmt.showCreateHighlight}
            onClose={() => {
              mgmt.setShowCreateHighlight(false);
              mgmt.setInitialStoryForCreate(null);
              nav.setIsPaused(false);
            }}
            initialStory={mgmt.initialStoryForCreate}
            onHighlightCreated={() => {
              if (onHighlightUpdated) onHighlightUpdated();
            }}
          />
        )}
      </div>

      {/* External Next Arrow */}
      {nav.groupIdx < storyGroups.length - 1 && !mgmt.showViewers && (
        <button
          type="button"
          className="story-nav-arrow next"
          onClick={nav.goToNextStory}
          aria-label="Next user story"
          title="Next (Right Arrow)"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default StoryViewerModal;
