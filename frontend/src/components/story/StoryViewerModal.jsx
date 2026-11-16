import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Heart,
  MoreVertical,
  Flag,
  BarChart2,
  Star,
  Music,
  Sparkles,
  ExternalLink,
  MapPin,
  Hash,
  Camera,
  Bell,
  BellRing,
  Send,
  RotateCw,
  Volume2,
  VolumeX,
  Edit2,
  MinusCircle,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl, getAdaptiveVideoUrl, shouldPrefetchMedia } from '../../utils/mediaUrl';
import { AddToHighlightModal } from '../modals/AddToHighlightModal';
import { EditHighlightModal } from '../modals/EditHighlightModal';
import { CreateHighlightModal } from '../modals/CreateHighlightModal';
import './StoryViewerModal.css';

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
        <div className="story-progress-container">
          {currentGroup.stories.map((s, idx) => {
            let width = '0%';
            if (idx < storyIdx) width = '100%';
            else if (idx === storyIdx) {
              width = s.isUploading
                ? `${Math.max(8, s.uploadProgress || 10)}%`
                : `${progress}%`;
            }

            const isCurrentVideo = idx === storyIdx && isVideoStory;

            return (
              <div key={s.id} className={`story-progress-bar ${s.isUploading ? 'uploading-story-progress' : ''}`}>
                <div
                  className={`story-progress-fill ${s.isUploading ? 'uploading-story-fill' : ''} ${isCurrentVideo ? 'video-sync-fill' : ''}`}
                  style={{
                    width,
                    transition: isCurrentVideo || isHolding ? 'none' : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-author">
            <Avatar
              src={(currentGroup.author?.avatarUrl || currentGroup.author?.profilePictureUrl)}
              alt={currentGroup.author?.username}
              size="sm"
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="story-viewer-username">{currentGroup.author?.username}</span>
                {isHighlight && (
                  <span className="story-viewer-highlight-badge" title={highlightTitle}>
                    {highlightTitle || 'Highlight'}
                  </span>
                )}
                {currentStory.isUploading ? (
                  <span className="story-uploading-tag">
                    <RotateCw size={10} className="story-upload-spinning-icon" />
                    <span>Uploading {currentStory.uploadProgress ? `${currentStory.uploadProgress}%` : ''}</span>
                  </span>
                ) : (
                  <span className="story-viewer-time">{timeAgo(currentStory.createdAt)}</span>
                )}
                {currentStory.isCloseFriends && (
                  <span className="story-close-friends-badge">
                    <Star size={10} fill="#fff" /> Close Friends
                  </span>
                )}
              </div>
              {(currentStory.audioTitle || currentStory.filterName) && (
                <div className="story-meta-pill">
                  {currentStory.audioTitle ? (
                    <>
                      <Music size={10} />
                      <span>{currentStory.audioTitle}{currentStory.audioArtist ? ` • ${currentStory.audioArtist}` : ''}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={10} />
                      <span>{currentStory.filterName}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="story-viewer-controls">
            {isVideoStory && (
              <button
                type="button"
                className="story-ctrl-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}
            <button
              type="button"
              className="story-ctrl-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(!showMoreMenu);
                setIsPaused(!showMoreMenu);
              }}
              aria-label="Story options"
            >
              <MoreVertical size={18} />
            </button>
            <button
              type="button"
              className="story-ctrl-btn"
              onClick={onClose}
              aria-label="Close stories"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* More Options Menu Dropdown */}
        {showMoreMenu && (
          <div className="story-more-menu" onClick={(e) => e.stopPropagation()}>
            {currentStory.isUploading ? (
              <button
                type="button"
                className="story-more-item"
                onClick={() => {
                  setShowMoreMenu(false);
                  onClose();
                }}
              >
                <X size={16} />
                <span>Close Viewer</span>
              </button>
            ) : isMyStory ? (
              <>
                {isHighlight ? (
                  <>
                    <button
                      type="button"
                      className="story-more-item"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setIsPaused(true);
                        setShowEditHighlight(true);
                      }}
                    >
                      <Edit2 size={16} />
                      <span>Edit Highlight</span>
                    </button>
                    <button
                      type="button"
                      className="story-more-item danger"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleRemoveFromHighlight();
                      }}
                    >
                      <MinusCircle size={16} />
                      <span>Remove from Highlight</span>
                    </button>
                    <button
                      type="button"
                      className="story-more-item danger"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleDeleteHighlight();
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Delete Highlight</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="story-more-item"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setIsPaused(true);
                        setShowAddToHighlight(true);
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Add to Highlight</span>
                    </button>
                    <button
                      type="button"
                      className="story-more-item"
                      onClick={handleOpenInsights}
                    >
                      <BarChart2 size={16} />
                      <span>Story Insights</span>
                    </button>
                    <button
                      type="button"
                      className="story-more-item danger"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleDeleteStory();
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Delete Story</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {isAdmin && isHighlight && (
                  <button
                    type="button"
                    className="story-more-item danger"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDeleteHighlight();
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Highlight (Admin)</span>
                  </button>
                )}
                {isAdmin && !isHighlight && (
                  <button
                    type="button"
                    className="story-more-item danger"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDeleteStory();
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Story (Admin)</span>
                  </button>
                )}
                <button
                  type="button"
                  className="story-more-item danger"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowReportModal(true);
                    setIsPaused(true);
                  }}
                >
                  <Flag size={16} />
                  <span>Report Story</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="story-viewer-content">
          {isVideoStory ? (
            <video
              ref={videoRef}
              key={currentStory.id || currentStory.mediaUrl}
              src={currentStory.mediaUrl?.startsWith('blob:') ? currentStory.mediaUrl : getAdaptiveVideoUrl(currentStory.mediaUrl)}
              poster={currentStory.mediaUrl?.startsWith('blob:') ? undefined : getVideoPosterUrl(currentStory.mediaUrl)}
              autoPlay
              muted={isMuted}
              playsInline
              loop={Boolean(currentStory.isUploading)}
              className="story-viewer-media"
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onEnded={handleVideoEnded}
            />
          ) : (
            <ProgressiveImage
              src={currentStory.mediaUrl}
              alt="Story"
              className="story-viewer-media"
              objectFit="contain"
              loading="eager"
            />
          )}

          {/* Tap & Hold Zones */}
          {!showViewers && !showQuestionResponses && !showInsights && !showReportModal && (
            <>
              <div
                className="story-nav-tap left"
                onPointerDown={(e) => handlePointerDown(e, 'left')}
                onPointerUp={(e) => handlePointerUp(e, 'left')}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
              />
              <div
                className="story-nav-tap right"
                onPointerDown={(e) => handlePointerDown(e, 'right')}
                onPointerUp={(e) => handlePointerUp(e, 'right')}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
              />
            </>
          )}

          {/* Floating Reaction Micro-Animation */}
          {floatingReaction && (
            <div className="floating-reaction-badge">
              <span>{floatingReaction}</span>
              <span>Reaction sent</span>
            </div>
          )}

          {/* Shared Content Preview Cards */}
          {currentStory.sharedPostId && (
            <div
              className="story-shared-preview-pill"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                navigate(`/post/${currentStory.sharedPostId}`);
              }}
            >
              <span>📷 View Post</span>
              <ExternalLink size={12} />
            </div>
          )}

          {currentStory.sharedReelId && (
            <div
              className="story-shared-preview-pill"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                navigate(`/reels/${currentStory.sharedReelId}`);
              }}
            >
              <span>🎬 View Reel</span>
              <ExternalLink size={12} />
            </div>
          )}

          {/* Question Sticker Overlay */}
          {currentStory?.question && (
            <div
              style={{
                position: 'absolute',
                top: '38%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '260px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                overflow: 'hidden',
                textAlign: 'center',
                zIndex: 25,
                border: '1px solid rgba(0,0,0,0.08)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ background: '#f5f5f7', padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8e8e8e', fontWeight: 600 }}>
                  Question
                </span>
                <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#1a1a1a', fontSize: '14px', wordBreak: 'break-word' }}>
                  {currentStory.question.prompt || 'Ask me a question'}
                </p>
              </div>

              <div style={{ padding: '12px 14px', background: '#ffffff' }}>
                {isMyStory ? (
                  <button
                    type="button"
                    onClick={handleOpenQuestionResponses}
                    style={{
                      width: '100%',
                      background: '#0095f6',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    View Responses ({currentStory.question.totalResponses || 0})
                  </button>
                ) : hasAnsweredQuestion ? (
                  <div style={{ color: '#00ba7c', fontSize: '13px', fontWeight: 600, padding: '4px 0' }}>
                    ✓ Response sent!
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Type something..."
                      value={questionAnswer}
                      onChange={(e) => setQuestionAnswer(e.target.value)}
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => !showQuestionResponses && !showViewers && setIsPaused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmitQuestionAnswer();
                      }}
                      style={{
                        flex: 1,
                        background: '#f0f2f5',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        outline: 'none',
                        color: '#1a1a1a'
                      }}
                    />
                    <button
                      type="button"
                      disabled={!questionAnswer.trim()}
                      onClick={handleSubmitQuestionAnswer}
                      style={{
                        background: questionAnswer.trim() ? '#0095f6' : '#cccccc',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: questionAnswer.trim() ? 'pointer' : 'default'
                      }}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Story Poll Sticker */}
          {pollState && (
            <div
              className="story-poll-sticker"
              style={{
                position: 'absolute',
                top: currentStory.question ? '68%' : '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '260px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                overflow: 'hidden',
                textAlign: 'center',
                zIndex: 25,
                border: '1px solid rgba(0,0,0,0.08)',
                padding: '14px 16px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#1a1a1a', fontSize: '15px', wordBreak: 'break-word', lineHeight: 1.3 }}>
                {pollState.question || 'Poll'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Option A */}
                <button
                  type="button"
                  disabled={votingPoll || pollState.userVote != null || isMyStory}
                  onClick={() => handleVotePoll(1)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: pollState.userVote === 1 ? '2px solid #0095f6' : '1px solid rgba(0,0,0,0.1)',
                    background: '#f8f9fa',
                    overflow: 'hidden',
                    cursor: (pollState.userVote != null || isMyStory) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#1a1a1a'
                  }}
                >
                  {(pollState.userVote != null || isMyStory) && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${Math.round(pollState.percentA || 0)}%`,
                        background: pollState.userVote === 1 ? 'rgba(0,149,246,0.22)' : 'rgba(0,0,0,0.07)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {pollState.userVote === 1 ? '✓ ' : ''}{pollState.optionA || 'Yes'}
                  </span>
                  {(pollState.userVote != null || isMyStory) && (
                    <span style={{ position: 'relative', zIndex: 1, fontWeight: 700 }}>
                      {Math.round(pollState.percentA || 0)}%
                    </span>
                  )}
                </button>

                {/* Option B */}
                <button
                  type="button"
                  disabled={votingPoll || pollState.userVote != null || isMyStory}
                  onClick={() => handleVotePoll(2)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: pollState.userVote === 2 ? '2px solid #0095f6' : '1px solid rgba(0,0,0,0.1)',
                    background: '#f8f9fa',
                    overflow: 'hidden',
                    cursor: (pollState.userVote != null || isMyStory) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#1a1a1a'
                  }}
                >
                  {(pollState.userVote != null || isMyStory) && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${Math.round(pollState.percentB || 0)}%`,
                        background: pollState.userVote === 2 ? 'rgba(0,149,246,0.22)' : 'rgba(0,0,0,0.07)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {pollState.userVote === 2 ? '✓ ' : ''}{pollState.optionB || 'No'}
                  </span>
                  {(pollState.userVote != null || isMyStory) && (
                    <span style={{ position: 'relative', zIndex: 1, fontWeight: 700 }}>
                      {Math.round(pollState.percentB || 0)}%
                    </span>
                  )}
                </button>
              </div>

              {(pollState.userVote != null || isMyStory) && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#8e8e8e', fontWeight: 500 }}>
                  {pollState.totalVotes || 0} {pollState.totalVotes === 1 ? 'vote' : 'votes'}
                </div>
              )}
            </div>
          )}

          {/* Interactive Quiz Sticker */}
          {quizState && (
            <div
              className="story-interactive-sticker story-quiz-sticker"
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8e8e8e', fontWeight: 700, marginBottom: '4px' }}>
                Quiz
              </div>
              <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#1a1a1a', fontSize: '14px', lineHeight: 1.3 }}>
                {quizState.question || 'Guess the answer!'}
              </p>

              {[
                { idx: 0, text: quizState.optionA, pct: quizState.percentA },
                { idx: 1, text: quizState.optionB, pct: quizState.percentB },
                { idx: 2, text: quizState.optionC, pct: quizState.percentC },
                { idx: 3, text: quizState.optionD, pct: quizState.percentD },
              ].filter(opt => Boolean(opt.text)).map((opt) => {
                const hasVoted = quizState.userVote != null || isMyStory;
                const isSelected = quizState.userVote === opt.idx;
                const isCorrect = opt.idx === quizState.correctOptionIndex;
                let optClass = 'story-quiz-option';
                if (hasVoted) {
                  if (isCorrect) optClass += ' correct';
                  else if (isSelected) optClass += ' selected-wrong';
                }

                return (
                  <button
                    key={opt.idx}
                    type="button"
                    className={optClass}
                    disabled={hasVoted || votingQuiz}
                    onClick={() => handleVoteQuiz(opt.idx)}
                  >
                    {hasVoted && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${Math.round(opt.pct || 0)}%`,
                          background: isCorrect ? 'rgba(0,186,124,0.18)' : 'rgba(0,0,0,0.06)',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {hasVoted && isCorrect ? '✓ ' : ''}{opt.text}
                    </span>
                    {hasVoted && (
                      <span style={{ position: 'relative', zIndex: 1, fontWeight: 700 }}>
                        {Math.round(opt.pct || 0)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Interactive Emoji Slider Sticker */}
          {sliderState && (
            <div
              className="story-interactive-sticker story-slider-sticker"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="story-slider-emoji">{sliderState.emoji || '🔥'}</span>
              <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#1a1a1a', fontSize: '14px' }}>
                {sliderState.question || 'How hot is this?'}
              </p>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                disabled={sliderState.userVote != null || isMyStory || votingSlider}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                onMouseUp={() => handleVoteSlider(sliderValue)}
                onTouchEnd={() => handleVoteSlider(sliderValue)}
                className="story-slider-input"
              />
              {(sliderState.userVote != null || isMyStory) && (
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#0095f6' }}>
                  Average: {Math.round(sliderState.averageRating || 0)}% ({sliderState.totalVotes || 0} votes)
                </div>
              )}
            </div>
          )}

          {/* Interactive Countdown Sticker */}
          {countdownState && (
            <div
              className="story-interactive-sticker story-countdown-sticker"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="story-countdown-title">{countdownState.title || 'Event Countdown'}</div>
              <div className="story-countdown-digits">
                <div className="story-countdown-box">
                  <span className="story-countdown-num">{timeLeft?.days ?? '0'}</span>
                  <span className="story-countdown-unit">Days</span>
                </div>
                <div className="story-countdown-box">
                  <span className="story-countdown-num">{timeLeft?.hours ?? '0'}</span>
                  <span className="story-countdown-unit">Hours</span>
                </div>
                <div className="story-countdown-box">
                  <span className="story-countdown-num">{timeLeft?.minutes ?? '0'}</span>
                  <span className="story-countdown-unit">Mins</span>
                </div>
                <div className="story-countdown-box">
                  <span className="story-countdown-num">{timeLeft?.seconds ?? '0'}</span>
                  <span className="story-countdown-unit">Secs</span>
                </div>
              </div>

              {!isMyStory && (
                <button
                  type="button"
                  className="story-countdown-btn"
                  onClick={handleToggleCountdownReminder}
                  disabled={togglingReminder}
                >
                  {countdownState.isSubscribed ? (
                    <>
                      <BellRing size={14} />
                      <span>Reminder Set</span>
                    </>
                  ) : (
                    <>
                      <Bell size={14} />
                      <span>Remind Me</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Link Sticker */}
          {currentStory?.link && (
            <a
              href={currentStory.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="story-link-pill"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
              <span>{currentStory.link.stickerText || 'Visit Link'}</span>
            </a>
          )}

          {/* Location Sticker */}
          {currentStory?.location && (
            <div className="story-location-badge" onClick={(e) => e.stopPropagation()}>
              <MapPin size={13} color="#ff4d4f" />
              <span>{currentStory.location.name}</span>
            </div>
          )}

          {/* Hashtag Sticker */}
          {currentStory?.hashtag && (
            <div className="story-hashtag-badge" onClick={(e) => e.stopPropagation()}>
              <Hash size={13} />
              <span>{currentStory.hashtag.tag}</span>
            </div>
          )}

          {/* Add Yours Sticker */}
          {currentStory?.addYours && (
            <div className="story-add-yours-sticker" onClick={(e) => e.stopPropagation()}>
              <div className="story-add-yours-header">
                <Camera size={12} />
                <span>Add Yours</span>
              </div>
              <p style={{ margin: '4px 0 6px', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>
                {currentStory.addYours.prompt}
              </p>
              <span style={{ fontSize: '11px', color: '#8e8e8e' }}>
                {currentStory.addYours.totalEntries || 0} responses
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`story-viewer-footer ${!isMyStory ? 'other-user-footer' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {currentStory.isUploading ? (
            <div className="story-viewer-uploading-card">
              <div className="story-viewer-uploading-header">
                <div className="story-viewer-uploading-left">
                  <RotateCw size={14} className="story-upload-spinning-icon" />
                  <span className="story-viewer-uploading-title">
                    Uploading your story...
                  </span>
                </div>
                <span className="story-viewer-uploading-pct">
                  {currentStory.uploadProgress || 10}%
                </span>
              </div>
              <div className="story-viewer-uploading-progress-track">
                <div
                  className="story-viewer-uploading-progress-bar"
                  style={{ width: `${Math.max(8, currentStory.uploadProgress || 10)}%` }}
                />
              </div>
            </div>
          ) : isMyStory ? (
            <div className="story-viewer-owner-bar">
              <button
                type="button"
                className="story-seen-badge-btn"
                onClick={handleOpenViewers}
                title="View story activity and viewers"
              >
                <div className="story-seen-icon-stack">
                  <Eye size={18} />
                </div>
                <span className="story-seen-count">
                  {currentStory.viewCount > 0
                    ? `Seen by ${currentStory.viewCount}`
                    : '0 views'}
                </span>
              </button>

              {!isHighlight ? (
                <button
                  type="button"
                  className="story-highlight-trigger-btn"
                  onClick={() => {
                    setIsPaused(true);
                    setShowAddToHighlight(true);
                  }}
                  title="Add to Highlight"
                >
                  <div className="story-highlight-icon-bubble">
                    <Sparkles size={16} />
                  </div>
                  <span className="story-highlight-label">Highlight</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="story-highlight-trigger-btn"
                  onClick={() => {
                    setIsPaused(true);
                    setShowEditHighlight(true);
                  }}
                  title="Edit Highlight"
                >
                  <div className="story-highlight-icon-bubble">
                    <Edit2 size={15} />
                  </div>
                  <span className="story-highlight-label">Edit Highlight</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Quick Emoji Reactions Bar */}
              <div className="story-quick-reactions">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="story-reaction-btn"
                    onClick={() => handleReactEmoji(emoji)}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Box and Like Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <div className="story-reply-box">
                  <input
                    type="text"
                    placeholder={`Reply to ${currentGroup.author?.username || 'user'}...`}
                    className="story-reply-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => !showViewers && !showMoreMenu && setIsPaused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendReply();
                    }}
                  />
                  {replyText.trim() && (
                    <button
                      type="button"
                      className="story-reply-send-btn"
                      onClick={handleSendReply}
                    >
                      Send
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className={`story-like-btn ${likedStory ? 'liked' : ''}`}
                  onClick={handleLikeStory}
                  title="Like story"
                >
                  <Heart size={24} fill={likedStory ? '#ef4444' : 'none'} color={likedStory ? '#ef4444' : '#fff'} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Viewers Sheet (Instagram Style) */}
        {showViewers && isMyStory && (
          <div className="story-viewers-sheet">
            <div className="story-viewers-sheet-header">
              <div className="story-viewers-sheet-title">
                <Eye size={18} />
                <span>Story Activity</span>
                <span className="story-viewers-sheet-badge">
                  {viewers.length} {viewers.length === 1 ? 'view' : 'views'}
                </span>
              </div>
              <button
                type="button"
                className="story-viewers-sheet-close"
                onClick={handleCloseViewers}
                aria-label="Close viewers"
              >
                <X size={18} />
              </button>
            </div>

            <div className="story-viewers-sheet-body">
              {loadingViewers ? (
                <SkeletonUserRows count={4} compact />
              ) : viewers.length > 0 ? (
                viewers.map((viewer) => (
                  <div key={viewer.id} className="story-viewer-user-row">
                    <div
                      className="story-viewer-user-info"
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${viewer.id}`);
                      }}
                    >
                      <Avatar
                        src={viewer.avatarUrl || viewer.profilePictureUrl}
                        alt={viewer.username}
                        size="sm"
                      />
                      <div className="story-viewer-user-names">
                        <span className="story-viewer-user-uname">{viewer.username}</span>
                        <span className="story-viewer-user-fname">
                          {viewer.displayName || viewer.fullName || ''}
                        </span>
                      </div>
                    </div>
                    {viewer.viewedAt && (
                      <span className="story-viewer-user-time">{timeAgo(viewer.viewedAt)}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="story-viewers-empty-state">
                  <Eye size={36} className="story-viewers-empty-icon" />
                  <h4 className="story-viewers-empty-title">
                    {viewers.length > 0
                      ? `${viewers.length} ${viewers.length === 1 ? 'Account has' : 'Accounts have'} seen your story`
                      : 'No views yet'}
                  </h4>
                  <p className="story-viewers-empty-desc">
                    {viewers.length > 0
                      ? 'People who have seen your story are counted in the views total above.'
                      : 'When other accounts view your story, their profiles and view times will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Question Responses Sheet (Author Only) */}
        {showQuestionResponses && isMyStory && (
          <div className="story-viewers-sheet">
            <div className="story-viewers-sheet-header">
              <div className="story-viewers-sheet-title">
                <span>Question Responses</span>
                <span className="story-viewers-sheet-badge">
                  {questionResponses.length} {questionResponses.length === 1 ? 'response' : 'responses'}
                </span>
              </div>
              <button
                type="button"
                className="story-viewers-sheet-close"
                onClick={handleCloseQuestionResponses}
                aria-label="Close responses"
              >
                <X size={18} />
              </button>
            </div>

            <div className="story-viewers-sheet-body">
              {loadingQuestionResponses ? (
                <SkeletonUserRows count={4} compact />
              ) : questionResponses.length > 0 ? (
                questionResponses.map((item) => (
                  <div key={item.id} className="story-viewer-user-row" style={{ alignItems: 'flex-start' }}>
                    <div
                      className="story-viewer-user-info"
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${item.user?.id}`);
                      }}
                    >
                      <Avatar
                        src={item.user?.avatarUrl}
                        alt={item.user?.username}
                        size="sm"
                      />
                      <div className="story-viewer-user-names">
                        <span className="story-viewer-user-uname">{item.user?.username}</span>
                        <div style={{ background: '#f0f2f5', padding: '6px 10px', borderRadius: '8px', marginTop: '4px', color: '#1a1a1a', fontSize: '13px' }}>
                          {item.answer}
                        </div>
                      </div>
                    </div>
                    {item.createdAt && (
                      <span className="story-viewer-user-time">{timeAgo(item.createdAt)}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="story-viewers-empty-state">
                  <h4 className="story-viewers-empty-title">No responses yet</h4>
                  <p className="story-viewers-empty-desc">
                    When viewers type an answer into your question sticker, their responses will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Story Insights Sheet (Author Only) */}
        {showInsights && isMyStory && (
          <div className="story-viewers-sheet">
            <div className="story-viewers-sheet-header">
              <div className="story-viewers-sheet-title">
                <BarChart2 size={18} />
                <span>Story Insights</span>
              </div>
              <button
                type="button"
                className="story-viewers-sheet-close"
                onClick={() => {
                  setShowInsights(false);
                  setIsPaused(false);
                }}
                aria-label="Close insights"
              >
                <X size={18} />
              </button>
            </div>

            <div className="story-viewers-sheet-body">
              {loadingInsights ? (
                <SkeletonUserRows count={4} compact />
              ) : insightsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 4px' }}>
                  {/* Overview Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'block' }}>
                        {insightsData.impressions || 0}
                      </span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Impressions</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'block' }}>
                        {insightsData.reach || 0}
                      </span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Accounts Reached</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'block' }}>
                        {insightsData.repliesCount || 0}
                      </span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Replies</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'block' }}>
                        {insightsData.sharesCount || 0}
                      </span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Shares</span>
                    </div>
                  </div>

                  {/* Navigation Metrics */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
                    <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Navigation
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Forward Taps</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{insightsData.forwardTaps || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Back Taps</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{insightsData.backTaps || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Next Story Taps</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{insightsData.nextStoryTaps || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Exited</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{insightsData.exitedCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="story-viewers-empty-state">
                  <BarChart2 size={36} className="story-viewers-empty-icon" />
                  <h4 className="story-viewers-empty-title">No insights available</h4>
                  <p className="story-viewers-empty-desc">
                    Metrics appear after accounts begin interacting with your story.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Story Sheet (Viewers Only) */}
        {showReportModal && !isMyStory && (
          <div className="story-viewers-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewers-sheet-header">
              <div className="story-viewers-sheet-title">
                <Flag size={18} color="#ef4444" />
                <span>Report Story</span>
              </div>
              <button
                type="button"
                className="story-viewers-sheet-close"
                onClick={() => {
                  setShowReportModal(false);
                  setIsPaused(false);
                }}
                aria-label="Close report"
              >
                <X size={18} />
              </button>
            </div>

            <div className="story-viewers-sheet-body" style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                Why are you reporting this story?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {[
                  { key: 'INAPPROPRIATE', label: 'Inappropriate or Sensitive' },
                  { key: 'SPAM', label: 'Spam or Scam' },
                  { key: 'HARASSMENT', label: 'Harassment or Bullying' },
                  { key: 'VIOLENCE', label: 'Violence or Dangerous Content' },
                  { key: 'OTHER', label: 'Something else' },
                ].map((reason) => (
                  <label
                    key={reason.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: reportReason === reason.key ? 'rgba(0,149,246,0.18)' : 'rgba(255,255,255,0.04)',
                      border: reportReason === reason.key ? '1px solid #0095f6' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.key}
                      checked={reportReason === reason.key}
                      onChange={() => setReportReason(reason.key)}
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
              </div>

              <textarea
                placeholder="Additional details (optional)..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '8px 10px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: '12px',
                }}
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReportStory}
                disabled={submittingReport}
                style={{ width: '100%', padding: '10px', fontWeight: 600 }}
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}

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
