import { useState, useEffect, useCallback } from 'react';
import storyService from '../../../services/story.service';
import { useToast } from '../../../context/ToastContext';

export const useStoryManagement = ({
  currentStory,
  currentGroup,
  currentUser,
  highlightId,
  safeStoryIdx,
  storyIdx,
  setStoryIdx,
  groupIdx,
  setGroupIdx,
  storyGroups = [],
  setProgress,
  elapsedBeforePauseRef,
  setIsPaused,
  goToNextStory,
  onHighlightUpdated,
  onClose,
  showSuccess: customShowSuccess,
  showError: customShowError,
} = {}) => {
  const toast = useToast();
  const showSuccess = customShowSuccess || toast?.showSuccess || console.log;
  const showError = customShowError || toast?.showError || console.error;

  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

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

  // Reset sheets & menus when currentStory changes
  useEffect(() => {
    setShowViewers(false);
    setViewers([]);
    setShowMoreMenu(false);
    setShowReportModal(false);
    setShowInsights(false);
    setInsightsData(null);
    setShowAddToHighlight(false);
    setShowEditHighlight(false);
    setShowCreateHighlight(false);
  }, [currentStory]);

  const handleOpenViewers = useCallback(async () => {
    if (setIsPaused) setIsPaused(true);
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
  }, [currentStory?.id, currentGroup, currentUser, setIsPaused]);

  const handleCloseViewers = useCallback(() => {
    setShowViewers(false);
    if (setIsPaused) setIsPaused(false);
  }, [setIsPaused]);

  const handleOpenInsights = useCallback(async () => {
    if (!currentStory?.id) return;
    if (setIsPaused) setIsPaused(true);
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
  }, [currentStory?.id, setIsPaused, showError]);

  const handleReportStory = useCallback(async () => {
    if (!currentStory?.id || !reportReason) return;
    try {
      setSubmittingReport(true);
      await storyService.reportStory(currentStory.id, reportReason, reportDetails.trim());
      showSuccess('Story reported. We have hidden this story.');
      setShowReportModal(false);
      setShowMoreMenu(false);
      if (setIsPaused) setIsPaused(false);
      if (goToNextStory) goToNextStory();
    } catch (err) {
      showError(err.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  }, [
    currentStory?.id,
    reportReason,
    reportDetails,
    setIsPaused,
    goToNextStory,
    showSuccess,
    showError,
  ]);

  const handleDeleteStory = useCallback(async () => {
    if (!currentStory) return;
    try {
      await storyService.deleteStory(currentStory.id);
      showSuccess('Story deleted');
      if (onHighlightUpdated) onHighlightUpdated();
      if (!currentGroup || currentGroup.stories.length <= 1) {
        if (groupIdx < storyGroups.length - 1) {
          if (setGroupIdx) setGroupIdx((prev) => prev + 1);
          if (setStoryIdx) setStoryIdx(0);
          if (setProgress) setProgress(0);
        } else if (groupIdx > 0) {
          if (setGroupIdx) setGroupIdx((prev) => prev - 1);
          if (setStoryIdx) setStoryIdx(0);
          if (setProgress) setProgress(0);
        } else {
          if (onClose) onClose();
        }
      } else {
        currentGroup.stories.splice(storyIdx, 1);
        if (storyIdx >= currentGroup.stories.length) {
          if (setStoryIdx) setStoryIdx(Math.max(0, currentGroup.stories.length - 1));
        }
        if (setProgress) setProgress(0);
        if (elapsedBeforePauseRef) elapsedBeforePauseRef.current = 0;
      }
    } catch (err) {
      showError(err.message || 'Failed to delete story');
    }
  }, [
    currentStory,
    currentGroup,
    groupIdx,
    storyIdx,
    storyGroups.length,
    setGroupIdx,
    setStoryIdx,
    setProgress,
    elapsedBeforePauseRef,
    onHighlightUpdated,
    onClose,
    showSuccess,
    showError,
  ]);

  const handleRemoveFromHighlight = useCallback(async () => {
    if (!highlightId || !currentStory?.id) return;
    try {
      await storyService.removeStoryFromHighlight(highlightId, currentStory.id);
      showSuccess('Removed from highlight');
      if (onHighlightUpdated) onHighlightUpdated();
      if (!currentGroup || currentGroup.stories.length <= 1) {
        if (onClose) onClose();
      } else {
        currentGroup.stories.splice(safeStoryIdx, 1);
        if (storyIdx >= currentGroup.stories.length) {
          if (setStoryIdx) setStoryIdx(Math.max(0, currentGroup.stories.length - 1));
        }
        if (setProgress) setProgress(0);
        if (elapsedBeforePauseRef) elapsedBeforePauseRef.current = 0;
      }
    } catch (err) {
      showError(err?.message || 'Failed to remove from highlight');
    }
  }, [
    highlightId,
    currentStory?.id,
    currentGroup,
    safeStoryIdx,
    storyIdx,
    setStoryIdx,
    setProgress,
    elapsedBeforePauseRef,
    onHighlightUpdated,
    onClose,
    showSuccess,
    showError,
  ]);

  const handleDeleteHighlight = useCallback(async () => {
    if (!highlightId) return;
    const ok = window.confirm('Are you sure you want to delete this highlight?');
    if (!ok) return;
    try {
      await storyService.deleteHighlight(highlightId);
      showSuccess('Highlight deleted');
      if (onHighlightUpdated) onHighlightUpdated();
      if (onClose) onClose();
    } catch (err) {
      showError(err?.message || 'Failed to delete highlight');
    }
  }, [highlightId, onHighlightUpdated, onClose, showSuccess, showError]);

  const isModalBlocked = Boolean(
    showViewers ||
      showMoreMenu ||
      showReportModal ||
      showInsights ||
      showAddToHighlight ||
      showEditHighlight ||
      showCreateHighlight
  );

  return {
    showViewers,
    setShowViewers,
    viewers,
    setViewers,
    loadingViewers,
    showMoreMenu,
    setShowMoreMenu,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason,
    reportDetails,
    setReportDetails,
    submittingReport,
    showInsights,
    setShowInsights,
    insightsData,
    loadingInsights,
    showAddToHighlight,
    setShowAddToHighlight,
    showEditHighlight,
    setShowEditHighlight,
    showCreateHighlight,
    setShowCreateHighlight,
    initialStoryForCreate,
    setInitialStoryForCreate,
    isModalBlocked,
    handleOpenViewers,
    handleCloseViewers,
    handleOpenInsights,
    handleReportStory,
    handleDeleteStory,
    handleRemoveFromHighlight,
    handleDeleteHighlight,
  };
};

export default useStoryManagement;
