import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { shouldPrefetchMedia } from '../../utils/mediaUrl';
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
};

const STORY_DURATION = 5000; // 5 seconds per story
const QUICK_EMOJIS = ['😂', '😮', '😍', '😢', '👏', '🔥', '🎉', '💯'];

export const StoryViewerModal = ({
  isOpen,
  storyGroups = [],
  initialGroupIdx = 0,
  initialStoryIdx = 0,
  onClose,
  onHighlightUpdated,
}) => {
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(initialStoryIdx);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [likedStory, setLikedStory] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState(null);

  const [questionAnswer, setQuestionAnswer] = useState('');
  const [hasAnsweredQuestion, setHasAnsweredQuestion] = useState(false);
  const [showQuestionResponses, setShowQuestionResponses] = useState(false);
  const [questionResponses, setQuestionResponses] = useState([]);
  const [loadingQuestionResponses, setLoadingQuestionResponses] = useState(false);

  const [pollState, setPollState] = useState(null);
  const [votingPoll, setVotingPoll] = useState(false);

  const [quizState, setQuizState] = useState(null);
  const [votingQuiz, setVotingQuiz] = useState(false);

  const [sliderState, setSliderState] = useState(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [votingSlider, setVotingSlider] = useState(false);

  const [countdownState, setCountdownState] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [togglingReminder, setTogglingReminder] = useState(false);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('INAPPROPRIATE');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [showInsights, setShowInsights] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [showAddToHighlight, setShowAddToHighlight] = useState(false);
  const [showEditHighlight, setShowEditHighlight] = useState(false);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);
  const [initialStoryForCreate, setInitialStoryForCreate] = useState(null);
  const [sharingMention, setSharingMention] = useState(false);
  const [sharedStoriesMap, setSharedStoriesMap] = useState({});

  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const viewedStoriesRef = useRef(new Set());
  const videoRef = useRef(null);
  const pressStartTimeRef = useRef(0);
  const isHoldTriggeredRef = useRef(false);
  const holdTimerRef = useRef(null);

  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const { user: currentUser, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const safeGroupIdx = Math.min(Math.max(0, groupIdx), Math.max(0, storyGroups.length - 1));
  const currentGroup = storyGroups[safeGroupIdx];
  const safeStoryIdx = Math.min(Math.max(0, storyIdx), Math.max(0, (currentGroup?.stories?.length || 1) - 1));
  const currentStory = currentGroup?.stories?.[safeStoryIdx];
  const isVideoStory = Boolean(
    currentStory?.mediaType === 'VIDEO' ||
    (currentStory?.mediaUrl && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(currentStory.mediaUrl)) ||
    (currentStory?.mediaUrl?.startsWith('blob:') && currentStory?.mediaType !== 'IMAGE')
  );
  const isMyStory =
    String(currentUser?.id || '') === String(currentGroup?.author?.id || '') ||
    currentGroup?.author?.id === 'current-user' ||
    Boolean(currentStory?.isUploading);
  const isHighlight = Boolean(currentGroup?.isHighlight);
  const highlightId = currentGroup?.highlightId;
  const highlightTitle = currentGroup?.highlightTitle;

  const isMentionedInCurrentStory = Boolean(
    !isMyStory &&
    currentUser &&
    (currentStory?.mentions || []).some((m) => {
      const myId = String(currentUser.id || currentUser.userId || '');
      const myUsername = (currentUser.username || '').toLowerCase();
      const mId = String(m.id || m.userId || m.user?.id || '');
      const mUsername = (m.username || m.user?.username || '').toLowerCase();
      return (myId && mId && myId === mId) || (myUsername && mUsername && myUsername === mUsername);
    })
  );

  // Reset states when active story changes
  useEffect(() => {
    setShowViewers(false);
    setViewers([]);
    setReplyText('');
    setLikedStory(false);
    setQuestionAnswer('');
    setHasAnsweredQuestion(false);
    setShowQuestionResponses(false);
    setQuestionResponses([]);
    setShowMoreMenu(false);
    setShowReportModal(false);
    setShowInsights(false);
    setInsightsData(null);
    setShowAddToHighlight(false);
    setShowEditHighlight(false);
    setShowCreateHighlight(false);
    setPollState(currentStory?.poll || null);
    setQuizState(currentStory?.quiz || null);
    setSliderState(currentStory?.slider || null);
    setSliderValue(currentStory?.slider?.userVote ?? currentStory?.slider?.averageRating ?? 50);
    setCountdownState(currentStory?.countdown || null);
  }, [storyIdx, groupIdx, currentStory]);

  // Live countdown timer calculation
  useEffect(() => {
    if (!countdownState?.targetDate) return;
    const calculateTime = () => {
      const diff = new Date(countdownState.targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        ended: false,
      });
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [countdownState?.targetDate]);

  // Mark viewed on load (only once per story, never for story owner)
  useEffect(() => {
    if (currentStory?.id && !viewedStoriesRef.current.has(currentStory.id)) {
      if (currentStory.isUploading) return;
      if (isMyStory) return; // Story author must never be marked as a viewer of their own story!
      viewedStoriesRef.current.add(currentStory.id);
      if (!currentStory.viewed) {
        currentStory.viewed = true;
        storyService.markStoryViewed(currentStory.id).catch(() => { });
      }
    }
  }, [currentStory?.id, currentStory?.isUploading, isMyStory]);

  // Preload next story asset for instant snappy playback (only on normal/low ping networks)
  useEffect(() => {
    if (!currentGroup?.stories || !shouldPrefetchMedia()) return;
    const nextStory = currentGroup.stories[storyIdx + 1];
    if (nextStory?.mediaUrl) {
      if (nextStory.mediaType === 'VIDEO') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = getAdaptiveVideoUrl(nextStory.mediaUrl);
        document.head.appendChild(link);
        return () => {
          if (document.head.contains(link)) document.head.removeChild(link);
        };
      } else {
        const img = new Image();
        img.src = nextStory.mediaUrl;
      }
    }
  }, [storyIdx, currentGroup]);

  const goToNextStory = () => {
    if (showViewers) return;
    if (!currentGroup) return;
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      } catch { }
    }
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (groupIdx < storyGroups.length - 1) {
      setGroupIdx((prev) => prev + 1);
      setStoryIdx(0);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else {
      onClose();
    }
  };

  const goToPrevStory = () => {
    if (showViewers) return;
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      } catch { }
    }
    if (storyIdx > 0) {
      setStoryIdx((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (groupIdx > 0) {
      const prevGroup = storyGroups[groupIdx - 1];
      setGroupIdx((prev) => prev - 1);
      setStoryIdx((prevGroup?.stories?.length || 1) - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showViewers) {
          setShowViewers(false);
          setIsPaused(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && !showViewers) {
        goToNextStory();
      } else if (e.key === 'ArrowLeft' && !showViewers) {
        goToPrevStory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, groupIdx, storyIdx, currentGroup, showViewers]);

  // Timer loop for IMAGE stories
  useEffect(() => {
    if (!isOpen || isPaused || isHolding || showViewers || !currentStory || currentStory.isUploading) return;
    if (isVideoStory) return; // Handled directly by video playback synchronization

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= STORY_DURATION) {
        clearInterval(interval);
        goToNextStory();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isHolding, showViewers, currentStory, groupIdx, storyIdx, isVideoStory]);

  // Synchronize progress line directly with VIDEO playback (60fps requestAnimationFrame)
  useEffect(() => {
    if (!isOpen || !isVideoStory || !currentStory || currentStory.isUploading) return;

    let animId;
    const syncProgress = () => {
      const video = videoRef.current;
      if (video && video.duration && !video.paused && !video.ended) {
        const pct = (video.currentTime / video.duration) * 100;
        setProgress(Math.min(pct, 100));
      }
      animId = requestAnimationFrame(syncProgress);
    };

    animId = requestAnimationFrame(syncProgress);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isVideoStory, currentStory, storyIdx, groupIdx]);

  // Video playback & pause state synchronization (holds, modals, menus)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoStory) return;

    const shouldPause =
      !isOpen ||
      isPaused ||
      isHolding ||
      showViewers ||
      showMoreMenu ||
      showReportModal ||
      showInsights ||
      showQuestionResponses ||
      showAddToHighlight ||
      showEditHighlight ||
      showCreateHighlight;

    if (shouldPause) {
      video.pause();
    } else {
      video.play().catch(() => { });
    }
  }, [
    isOpen,
    isPaused,
    isHolding,
    showViewers,
    showMoreMenu,
    showReportModal,
    showInsights,
    showQuestionResponses,
    showAddToHighlight,
    showEditHighlight,
    showCreateHighlight,
    isVideoStory,
    storyIdx,
    groupIdx,
  ]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(Math.min(pct, 100));
    }
  };

  const handleVideoEnded = () => {
    if (currentStory?.isUploading) return;
    setProgress(100);
    goToNextStory();
  };

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      if (
        isPaused ||
        isHolding ||
        showViewers ||
        showMoreMenu ||
        showReportModal ||
        showInsights ||
        showQuestionResponses ||
        showAddToHighlight ||
        showEditHighlight ||
        showCreateHighlight
      ) {
        video.pause();
      } else {
        video.play().catch(() => { });
      }
    }
  };

  // Hold-to-pause & Quick-tap Gesture Handlers (matching Instagram mobile & web)
  const handlePointerDown = (e, side) => {
    if (
      showViewers ||
      showMoreMenu ||
      showReportModal ||
      showInsights ||
      showQuestionResponses ||
      showAddToHighlight ||
      showEditHighlight ||
      showCreateHighlight
    ) return;
    if (
      e.target.closest('.story-viewer-footer') ||
      e.target.closest('.story-viewer-controls') ||
      e.target.closest('.story-more-menu') ||
      e.target.closest('.story-sticker-interactive')
    ) {
      return;
    }

    pressStartTimeRef.current = Date.now();
    isHoldTriggeredRef.current = false;

    // Trigger hold after 160ms
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      isHoldTriggeredRef.current = true;
      setIsHolding(true);
      setIsPaused(true);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch { }
      }
      if (!isVideoStory) {
        elapsedBeforePauseRef.current = (progress / 100) * STORY_DURATION;
      }
    }, 160);
  };

  const handlePointerUp = (e, side) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const pressDuration = Date.now() - pressStartTimeRef.current;

    // If held for >= 160ms, it was a HOLD: release resumes playback without navigating!
    if (isHoldTriggeredRef.current || pressDuration >= 200) {
      isHoldTriggeredRef.current = false;
      setIsHolding(false);
      setIsPaused(false);
      if (videoRef.current && isVideoStory) {
        videoRef.current.play().catch(() => { });
      }
      return;
    }

    // Otherwise it was a quick TAP: navigate stories!
    setIsHolding(false);
    if (side === 'left') {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isHoldTriggeredRef.current) {
      isHoldTriggeredRef.current = false;
      setIsHolding(false);
      setIsPaused(false);
      if (videoRef.current && isVideoStory) {
        videoRef.current.play().catch(() => { });
      }
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    try {
      await storyService.deleteStory(currentStory.id);
      showSuccess('Story deleted');
      if (onHighlightUpdated) onHighlightUpdated();
      if (currentGroup.stories.length <= 1) {
        if (groupIdx < storyGroups.length - 1) {
          setGroupIdx((prev) => prev + 1);
          setStoryIdx(0);
          setProgress(0);
        } else if (groupIdx > 0) {
          setGroupIdx((prev) => prev - 1);
          setStoryIdx(0);
          setProgress(0);
        } else {
          onClose();
        }
      } else {
        currentGroup.stories.splice(storyIdx, 1);
        if (storyIdx >= currentGroup.stories.length) {
          setStoryIdx(Math.max(0, currentGroup.stories.length - 1));
        }
        setProgress(0);
        elapsedBeforePauseRef.current = 0;
      }
    } catch (err) {
      showError(err.message || 'Failed to delete story');
    }
  };

  const handleRemoveFromHighlight = async () => {
    if (!highlightId || !currentStory?.id) return;
    try {
      await storyService.removeStoryFromHighlight(highlightId, currentStory.id);
      showSuccess('Removed from highlight');
      if (onHighlightUpdated) onHighlightUpdated();
      if (currentGroup.stories.length <= 1) {
        onClose();
      } else {
        currentGroup.stories.splice(safeStoryIdx, 1);
        if (storyIdx >= currentGroup.stories.length) {
          setStoryIdx(Math.max(0, currentGroup.stories.length - 1));
        }
        setProgress(0);
        elapsedBeforePauseRef.current = 0;
      }
    } catch (err) {
      showError(err?.message || 'Failed to remove from highlight');
    }
  };

  const handleDeleteHighlight = async () => {
    if (!highlightId) return;
    const ok = window.confirm('Are you sure you want to delete this highlight?');
    if (!ok) return;
    try {
      await storyService.deleteHighlight(highlightId);
      showSuccess('Highlight deleted');
      if (onHighlightUpdated) onHighlightUpdated();
      onClose();
    } catch (err) {
      showError(err?.message || 'Failed to delete highlight');
    }
  };

  const handleOpenViewers = async () => {
    setIsPaused(true);
    setShowViewers(true);
    if (!currentStory?.id) return;

    try {
      setLoadingViewers(true);
      const res = await storyService.getStoryViewers(currentStory.id);
      let list = [];
      if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      }
      const authorId = String(currentGroup?.author?.id || currentUser?.id || '');
      const authorUsername = currentGroup?.author?.username || currentUser?.username;
      const filteredList = list.filter((v) => {
        const vId = String(v.id || v.userId || '');
        if (vId && authorId && vId === authorId) return false;
        if (v.username && authorUsername && v.username === authorUsername) return false;
        return true;
      });
      setViewers(filteredList);
    } catch (err) {
      console.error('[StoryViewer] Failed to load story viewers:', err);
      setViewers([]);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleCloseViewers = () => {
    setShowViewers(false);
    setIsPaused(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory?.id) return;
    const sentText = replyText.trim();
    try {
      await storyService.replyToStory(currentStory.id, sentText);
      showSuccess(`Reply sent to ${currentGroup?.author?.username || 'user'}`);
      setReplyText('');
      setIsPaused(false);
      window.dispatchEvent(new CustomEvent('story:dm-sent', {
        detail: {
          storyId: currentStory.id,
          recipientUsername: currentGroup?.author?.username,
          content: sentText,
          mediaUrl: currentStory.mediaUrl
        }
      }));
    } catch (err) {
      showError(err.message || 'Failed to send reply');
    }
  };

  const handleLikeStory = async () => {
    if (!currentStory?.id) return;
    try {
      const res = await storyService.toggleLikeStory(currentStory.id);
      const isLiked = res?.data?.liked ?? !likedStory;
      setLikedStory(isLiked);
      if (isLiked) {
        showSuccess('Liked story');
      }
    } catch (err) {
      setLikedStory(!likedStory);
    }
  };

  const handleReactEmoji = async (emoji) => {
    if (!currentStory?.id) return;
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1200);
    try {
      await storyService.reactToStory(currentStory.id, emoji);
      showSuccess(`Sent ${emoji} reaction!`);
      window.dispatchEvent(new CustomEvent('story:dm-sent', {
        detail: {
          storyId: currentStory.id,
          recipientUsername: currentGroup?.author?.username,
          content: emoji,
          mediaUrl: currentStory.mediaUrl
        }
      }));
    } catch (err) {
      // Graceful fallback
    }
  };

  const handleOpenQuestionResponses = async () => {
    if (!currentStory?.id) return;
    setIsPaused(true);
    setShowQuestionResponses(true);
    setLoadingQuestionResponses(true);
    try {
      const res = await storyService.getStoryQuestionResponses(currentStory.id);
      setQuestionResponses(res?.data || res || []);
    } catch (err) {
      showError('Failed to load question responses');
    } finally {
      setLoadingQuestionResponses(false);
    }
  };

  const handleCloseQuestionResponses = () => {
    setShowQuestionResponses(false);
    setIsPaused(false);
  };

  const handleSubmitQuestionAnswer = async () => {
    if (!questionAnswer.trim() || !currentStory?.id) return;
    try {
      await storyService.answerStoryQuestion(currentStory.id, questionAnswer.trim());
      showSuccess('Response sent to ' + (currentGroup?.author?.username || 'user'));
      setHasAnsweredQuestion(true);
      setQuestionAnswer('');
      setIsPaused(false);
    } catch (err) {
      showError(err.message || 'Failed to send response');
    }
  };

  const handleVotePoll = async (optionNumber) => {
    if (!currentStory?.id || votingPoll || pollState?.userVote) return;
    try {
      setVotingPoll(true);
      const res = await storyService.voteOnPoll(currentStory.id, optionNumber);
      const updated = res?.data || res;
      setPollState(updated);
      showSuccess('Vote recorded!');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to submit vote');
    } finally {
      setVotingPoll(false);
    }
  };

  const handleVoteQuiz = async (optionIndex) => {
    if (!currentStory?.id || votingQuiz || quizState?.userVote != null) return;
    try {
      setVotingQuiz(true);
      const res = await storyService.voteOnQuiz(currentStory.id, optionIndex);
      const updated = res?.data || res;
      setQuizState(updated);
      showSuccess('Quiz vote recorded!');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to record quiz answer');
    } finally {
      setVotingQuiz(false);
    }
  };

  const handleVoteSlider = async (val) => {
    if (!currentStory?.id || votingSlider || sliderState?.userVote != null) return;
    try {
      setVotingSlider(true);
      const res = await storyService.voteOnSlider(currentStory.id, val);
      const updated = res?.data || res;
      setSliderState(updated);
      showSuccess('Reaction saved!');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to record reaction');
    } finally {
      setVotingSlider(false);
    }
  };

  const handleToggleCountdownReminder = async () => {
    if (!currentStory?.id || togglingReminder) return;
    try {
      setTogglingReminder(true);
      const res = await storyService.toggleCountdownReminder(currentStory.id);
      const updated = res?.data || res;
      setCountdownState(updated);
      showSuccess(updated.isSubscribed ? 'Reminder set! 🔔' : 'Reminder cancelled');
    } catch (err) {
      showError(err.message || 'Failed to update reminder');
    } finally {
      setTogglingReminder(false);
    }
  };

  const handleOpenInsights = async () => {
    if (!currentStory?.id) return;
    setIsPaused(true);
    setShowMoreMenu(false);
    setShowInsights(true);
    setLoadingInsights(true);
    try {
      const res = await storyService.getStoryInsights(currentStory.id);
      setInsightsData(res?.data || res);
    } catch (err) {
      showError(err.message || 'Failed to load insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleReportStory = async () => {
    if (!currentStory?.id || !reportReason) return;
    try {
      setSubmittingReport(true);
      await storyService.reportStory(currentStory.id, reportReason, reportDetails.trim());
      showSuccess('Story reported. We have hidden this story.');
      setShowReportModal(false);
      setShowMoreMenu(false);
      setIsPaused(false);
      goToNextStory();
    } catch (err) {
      showError(err.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleShareMentionedStory = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentStory?.id || sharingMention || sharedStoriesMap[currentStory.id]) return;
    try {
      setSharingMention(true);
      await storyService.shareMentionedStory(currentStory.id);
      setSharedStoriesMap((prev) => ({ ...prev, [currentStory.id]: true }));
      showSuccess('Added to your story!');
      window.dispatchEvent(new CustomEvent('story:refresh'));
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add story to your profile';
      showError(errorMsg);
    } finally {
      setSharingMention(false);
    }
  };

  if (!isOpen || !currentGroup || !currentStory) return null;

  return (
    <div className="story-viewer-overlay" role="dialog" aria-modal="true">
      {/* External Prev Arrow */}
      {groupIdx > 0 && !showViewers && (
        <button
          type="button"
          className="story-nav-arrow prev"
          onClick={goToPrevStory}
          aria-label="Previous user story"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <div
        className={`story-viewer-frame ${isHolding ? 'is-holding' : ''}`}
      >
        {/* Progress Bars */}
        <StoryProgressBars
          stories={currentGroup.stories}
          storyIdx={storyIdx}
          progress={progress}
          isVideoStory={isVideoStory}
          isHolding={isHolding}
        />

        {/* Header */}
        <StoryHeader
          currentGroup={currentGroup}
          currentStory={currentStory}
          isHighlight={isHighlight}
          highlightTitle={highlightTitle}
          isVideoStory={isVideoStory}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          showMoreMenu={showMoreMenu}
          setShowMoreMenu={setShowMoreMenu}
          setIsPaused={setIsPaused}
          onClose={onClose}
          isMyStory={isMyStory}
          isAdmin={isAdmin}
          setShowEditHighlight={setShowEditHighlight}
          handleRemoveFromHighlight={handleRemoveFromHighlight}
          handleDeleteHighlight={handleDeleteHighlight}
          setShowAddToHighlight={setShowAddToHighlight}
          handleOpenInsights={handleOpenInsights}
          handleDeleteStory={handleDeleteStory}
          setShowReportModal={setShowReportModal}
        />

        {/* Content (Media + Interactive Widgets) */}
        <div className="story-viewer-content">
          <StorySlideMedia
            isVideoStory={isVideoStory}
            videoRef={videoRef}
            currentStory={currentStory}
            isMuted={isMuted}
            handleVideoTimeUpdate={handleVideoTimeUpdate}
            handleVideoLoadedMetadata={handleVideoLoadedMetadata}
            handleVideoEnded={handleVideoEnded}
            showViewers={showViewers}
            showQuestionResponses={showQuestionResponses}
            showInsights={showInsights}
            showReportModal={showReportModal}
            handlePointerDown={handlePointerDown}
            handlePointerUp={handlePointerUp}
            handlePointerCancel={handlePointerCancel}
            floatingReaction={floatingReaction}
            onClose={onClose}
            navigate={navigate}
          />

          <StoryInteractiveWidgets
            currentStory={currentStory}
            isMyStory={isMyStory}
            handleOpenQuestionResponses={handleOpenQuestionResponses}
            hasAnsweredQuestion={hasAnsweredQuestion}
            questionAnswer={questionAnswer}
            setQuestionAnswer={setQuestionAnswer}
            setIsPaused={setIsPaused}
            showQuestionResponses={showQuestionResponses}
            showViewers={showViewers}
            handleSubmitQuestionAnswer={handleSubmitQuestionAnswer}
            pollState={pollState}
            votingPoll={votingPoll}
            handleVotePoll={handleVotePoll}
            quizState={quizState}
            votingQuiz={votingQuiz}
            handleVoteQuiz={handleVoteQuiz}
            sliderState={sliderState}
            sliderValue={sliderValue}
            setSliderValue={setSliderValue}
            votingSlider={votingSlider}
            handleVoteSlider={handleVoteSlider}
            countdownState={countdownState}
            timeLeft={timeLeft}
            handleToggleCountdownReminder={handleToggleCountdownReminder}
            togglingReminder={togglingReminder}
            onClose={onClose}
            navigate={navigate}
          />
        </div>

        {/* Footer */}
        <StoryViewerFooter
          isMyStory={isMyStory}
          currentStory={currentStory}
          currentGroup={currentGroup}
          isHighlight={isHighlight}
          handleOpenViewers={handleOpenViewers}
          setIsPaused={setIsPaused}
          setShowAddToHighlight={setShowAddToHighlight}
          setShowEditHighlight={setShowEditHighlight}
          isMentionedInCurrentStory={isMentionedInCurrentStory}
          sharedStoriesMap={sharedStoriesMap}
          handleShareMentionedStory={handleShareMentionedStory}
          sharingMention={sharingMention}
          quickEmojis={QUICK_EMOJIS}
          handleReactEmoji={handleReactEmoji}
          replyText={replyText}
          setReplyText={setReplyText}
          showViewers={showViewers}
          showMoreMenu={showMoreMenu}
          handleSendReply={handleSendReply}
          likedStory={likedStory}
          handleLikeStory={handleLikeStory}
        />

        {/* Viewers & Activity Sheet */}
        <StoryViewersSheet
          showViewers={showViewers}
          showQuestionResponses={showQuestionResponses}
          showInsights={showInsights}
          isMyStory={isMyStory}
          handleCloseViewers={handleCloseViewers}
          handleCloseQuestionResponses={handleCloseQuestionResponses}
          setShowInsights={setShowInsights}
          setIsPaused={setIsPaused}
          loadingViewers={loadingViewers}
          viewers={viewers}
          loadingQuestionResponses={loadingQuestionResponses}
          questionResponses={questionResponses}
          loadingInsights={loadingInsights}
          insightsData={insightsData}
          onClose={onClose}
          navigate={navigate}
        />

        {/* Report Story Sheet */}
        <StoryReportModal
          showReportModal={showReportModal}
          isMyStory={isMyStory}
          setShowReportModal={setShowReportModal}
          setIsPaused={setIsPaused}
          reportReason={reportReason}
          setReportReason={setReportReason}
          reportDetails={reportDetails}
          setReportDetails={setReportDetails}
          handleReportStory={handleReportStory}
          submittingReport={submittingReport}
        />

        {/* Add to Highlight Modal */}
        {showAddToHighlight && currentStory && (
          <AddToHighlightModal
            isOpen={showAddToHighlight}
            onClose={() => {
              setShowAddToHighlight(false);
              setIsPaused(false);
            }}
            story={currentStory}
            onHighlightAdded={() => {
              if (onHighlightUpdated) onHighlightUpdated();
            }}
            onCreateNewRequested={(story) => {
              setShowAddToHighlight(false);
              setInitialStoryForCreate(story);
              setShowCreateHighlight(true);
            }}
          />
        )}

        {/* Edit Highlight Modal */}
        {showEditHighlight && highlightId && (
          <EditHighlightModal
            isOpen={showEditHighlight}
            onClose={() => {
              setShowEditHighlight(false);
              setIsPaused(false);
            }}
            highlightId={highlightId}
            onHighlightUpdated={(updatedHl) => {
              if (onHighlightUpdated) onHighlightUpdated();
              if (updatedHl?.stories) {
                currentGroup.stories = updatedHl.stories;
                if (safeStoryIdx >= updatedHl.stories.length) {
                  setStoryIdx(Math.max(0, updatedHl.stories.length - 1));
                }
              }
            }}
          />
        )}

        {/* Create Highlight Modal (e.g. from active story) */}
        {showCreateHighlight && (
          <CreateHighlightModal
            isOpen={showCreateHighlight}
            onClose={() => {
              setShowCreateHighlight(false);
              setInitialStoryForCreate(null);
              setIsPaused(false);
            }}
            initialStory={initialStoryForCreate}
            onHighlightCreated={() => {
              if (onHighlightUpdated) onHighlightUpdated();
            }}
          />
        )}
      </div>

      {/* External Next Arrow */}
      {groupIdx < storyGroups.length - 1 && !showViewers && (
        <button
          type="button"
          className="story-nav-arrow next"
          onClick={goToNextStory}
          aria-label="Next user story"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};

export default StoryViewerModal;
