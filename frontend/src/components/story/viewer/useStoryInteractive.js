import { useState, useEffect, useCallback } from 'react';
import storyService from '../../../services/story.service';
import { useToast } from '../../../context/ToastContext';

export const useStoryInteractive = ({
  currentStory,
  currentGroup,
  setIsPaused,
  showSuccess: customShowSuccess,
  showError: customShowError,
} = {}) => {
  const toast = useToast();
  const showSuccess = customShowSuccess || toast?.showSuccess || console.log;
  const showError = customShowError || toast?.showError || console.error;

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

  // Sync interactive state when currentStory changes
  useEffect(() => {
    setQuestionAnswer('');
    setHasAnsweredQuestion(false);
    setShowQuestionResponses(false);
    setQuestionResponses([]);
    setPollState(currentStory?.poll || null);
    setQuizState(currentStory?.quiz || null);
    setSliderState(currentStory?.slider || null);
    setSliderValue(
      currentStory?.slider?.userVote ?? currentStory?.slider?.averageRating ?? 50
    );
    setCountdownState(currentStory?.countdown || null);
  }, [currentStory]);

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

  const handleOpenQuestionResponses = useCallback(async () => {
    if (!currentStory?.id) return;
    if (setIsPaused) setIsPaused(true);
    setShowQuestionResponses(true);
    setLoadingQuestionResponses(true);
    try {
      const res = await storyService.getStoryQuestionResponses(currentStory.id);
      setQuestionResponses(res?.data || res || []);
    } catch {
      showError('Failed to load question responses');
    } finally {
      setLoadingQuestionResponses(false);
    }
  }, [currentStory?.id, setIsPaused, showError]);

  const handleCloseQuestionResponses = useCallback(() => {
    setShowQuestionResponses(false);
    if (setIsPaused) setIsPaused(false);
  }, [setIsPaused]);

  const handleSubmitQuestionAnswer = useCallback(async () => {
    if (!questionAnswer.trim() || !currentStory?.id) return;
    try {
      await storyService.answerStoryQuestion(currentStory.id, questionAnswer.trim());
      showSuccess('Response sent to ' + (currentGroup?.author?.username || 'user'));
      setHasAnsweredQuestion(true);
      setQuestionAnswer('');
      if (setIsPaused) setIsPaused(false);
    } catch (err) {
      showError(err.message || 'Failed to send response');
    }
  }, [questionAnswer, currentStory?.id, currentGroup, setIsPaused, showSuccess, showError]);

  const handleVotePoll = useCallback(
    async (optionNumber) => {
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
    },
    [currentStory?.id, votingPoll, pollState, showSuccess, showError]
  );

  const handleVoteQuiz = useCallback(
    async (optionIndex) => {
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
    },
    [currentStory?.id, votingQuiz, quizState, showSuccess, showError]
  );

  const handleVoteSlider = useCallback(
    async (val) => {
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
    },
    [currentStory?.id, votingSlider, sliderState, showSuccess, showError]
  );

  const handleToggleCountdownReminder = useCallback(async () => {
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
  }, [currentStory?.id, togglingReminder, showSuccess, showError]);

  return {
    questionAnswer,
    setQuestionAnswer,
    hasAnsweredQuestion,
    setHasAnsweredQuestion,
    showQuestionResponses,
    setShowQuestionResponses,
    questionResponses,
    setQuestionResponses,
    loadingQuestionResponses,
    pollState,
    votingPoll,
    quizState,
    votingQuiz,
    sliderState,
    sliderValue,
    setSliderValue,
    votingSlider,
    countdownState,
    timeLeft,
    togglingReminder,
    handleOpenQuestionResponses,
    handleCloseQuestionResponses,
    handleSubmitQuestionAnswer,
    handleVotePoll,
    handleVoteQuiz,
    handleVoteSlider,
    handleToggleCountdownReminder,
  };
};

export default useStoryInteractive;
