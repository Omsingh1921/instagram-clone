import { useState, useRef, useEffect, useCallback } from 'react';
import userService from '../../services/user.service';

export const useStoryStickers = () => {
  // Sticker types: 'none', 'mention', 'music', 'question', 'poll', 'quiz', 'slider', 'countdown', 'link', 'location', 'hashtag'
  const [activeStickerType, setActiveStickerType] = useState('none');
  const [interactiveType, setInteractiveType] = useState('none'); // 'none' | 'question' | 'poll' | 'quiz' | 'slider' | 'countdown'

  const [stickerPositions, setStickerPositions] = useState({
    music: { x: 50, y: 15 },
    mention: { x: 50, y: 30 },
    interactive: { x: 50, y: 50 },
    link: { x: 50, y: 70 },
    location: { x: 50, y: 78 },
    hashtag: { x: 50, y: 86 },
  });

  const [draggingStickerKey, setDraggingStickerKey] = useState(null);
  const draggingStickerKeyRef = useRef(null);
  const isDraggingStickerRef = useRef(false);
  const stickerDragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 50, startY: 32 });
  const canvasRef = useRef(null);

  // Mention (@username)
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUserResults, setMentionUserResults] = useState([]);
  const [isSearchingMention, setIsSearchingMention] = useState(false);
  const [selectedMentionUsers, setSelectedMentionUsers] = useState([]);
  const selectedMentionUser = selectedMentionUsers[0] || null;
  const [showMentionsOnScreen, setShowMentionsOnScreen] = useState(true);

  // Question (AMA)
  const [questionPrompt, setQuestionPrompt] = useState('Ask me a question');

  // Poll
  const [pollQuestion, setPollQuestion] = useState('Ask a question...');
  const [pollOptionA, setPollOptionA] = useState('Yes');
  const [pollOptionB, setPollOptionB] = useState('No');

  // Quiz
  const [quizQuestion, setQuizQuestion] = useState('Guess the answer!');
  const [quizOptionA, setQuizOptionA] = useState('Option A');
  const [quizOptionB, setQuizOptionB] = useState('Option B');
  const [quizOptionC, setQuizOptionC] = useState('Option C');
  const [quizCorrectIndex, setQuizCorrectIndex] = useState(0);

  // Slider
  const [sliderQuestion, setSliderQuestion] = useState('How hot is this?');
  const [sliderEmoji, setSliderEmoji] = useState('🔥');

  // Countdown
  const [countdownTitle, setCountdownTitle] = useState('Upcoming Event');
  const [countdownDate, setCountdownDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  });

  // Link
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Location
  const [locationName, setLocationName] = useState('');

  // Hashtag
  const [hashtagTag, setHashtagTag] = useState('');

  // Audio / Music
  const [audioTitle, setAudioTitle] = useState('');
  const [audioArtist, setAudioArtist] = useState('');

  // Active States
  const isMusicActive = Boolean(audioTitle.trim() || audioArtist.trim());
  const isMentionActive = selectedMentionUsers.length > 0;
  const isInteractiveActive = interactiveType !== 'none';
  const isLinkActive = Boolean(linkUrl.trim());
  const isLocationActive = Boolean(locationName.trim());
  const isHashtagActive = Boolean(hashtagTag.trim());

  const attachedCount = [
    isMusicActive,
    isMentionActive,
    isInteractiveActive,
    isLinkActive,
    isLocationActive,
    isHashtagActive,
  ].filter(Boolean).length;

  const getPositionKeyForType = (type) => {
    if (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(type)) return 'interactive';
    return type;
  };

  const activePositionKey = getPositionKeyForType(activeStickerType);
  const stickerPos = stickerPositions[activePositionKey] || { x: 50, y: 32 };
  const isDraggingSticker = Boolean(draggingStickerKey);

  const setStickerPos = useCallback((pos) => {
    const key = getPositionKeyForType(activeStickerType);
    setStickerPositions((prev) => ({
      ...prev,
      [key]: typeof pos === 'function' ? pos(prev[key] || { x: 50, y: 32 }) : pos,
    }));
  }, [activeStickerType]);

  // Mention live user search debounce
  useEffect(() => {
    if (activeStickerType !== 'mention' || !mentionSearch.trim()) {
      setMentionUserResults([]);
      return;
    }
    const clean = mentionSearch.replace(/^@/, '').trim();
    if (!clean) {
      setMentionUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingMention(true);
      try {
        const res = await userService.searchUsers(clean, 0, 6);
        const list = res?.data?.content || res?.data || res || [];
        setMentionUserResults(Array.isArray(list) ? list : []);
      } catch {
        setMentionUserResults([]);
      } finally {
        setIsSearchingMention(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mentionSearch, activeStickerType]);

  // Handle Dragging Any Sticker on Story Canvas
  const handleStickerPointerDown = useCallback(
    (e, key = null) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target?.tagName)) return;
      const resolvedKey = key || getPositionKeyForType(activeStickerType);
      draggingStickerKeyRef.current = resolvedKey;
      setDraggingStickerKey(resolvedKey);
      isDraggingStickerRef.current = true;

      // Bring this sticker into active sidebar editing
      if (resolvedKey === 'interactive') {
        setActiveStickerType(interactiveType !== 'none' ? interactiveType : 'question');
      } else if (resolvedKey) {
        setActiveStickerType(resolvedKey);
      }

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const currentPos = (resolvedKey && stickerPositions[resolvedKey]) || { x: 50, y: 50 };
      stickerDragStartRef.current = {
        mouseX: clientX,
        mouseY: clientY,
        startX: currentPos.x,
        startY: currentPos.y,
      };
    },
    [activeStickerType, interactiveType, stickerPositions]
  );

  // Global mousemove / touchmove for sticker dragging
  useEffect(() => {
    const handlePointerMove = (e) => {
      const activeKey = draggingStickerKeyRef.current;
      if (!activeKey || !canvasRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = canvasRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaX = clientX - stickerDragStartRef.current.mouseX;
      const deltaY = clientY - stickerDragStartRef.current.mouseY;

      const deltaXPct = (deltaX / rect.width) * 100;
      const deltaYPct = (deltaY / rect.height) * 100;

      const newX = Math.min(85, Math.max(15, stickerDragStartRef.current.startX + deltaXPct));
      const newY = Math.min(90, Math.max(10, stickerDragStartRef.current.startY + deltaYPct));

      setStickerPositions((prev) => ({
        ...prev,
        [activeKey]: { x: Math.round(newX), y: Math.round(newY) },
      }));
    };

    const handlePointerUp = () => {
      if (draggingStickerKeyRef.current) {
        draggingStickerKeyRef.current = null;
        setDraggingStickerKey(null);
        isDraggingStickerRef.current = false;
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  const handleSetPresetPosition = useCallback(
    (preset) => {
      const key = getPositionKeyForType(activeStickerType);
      if (!key) return;
      const yVal = preset === 'top' ? 16 : preset === 'center' ? 45 : 75;
      setStickerPositions((prev) => ({
        ...prev,
        [key]: { x: 50, y: yVal },
      }));
    },
    [activeStickerType]
  );

  const handleRemoveCurrentSticker = useCallback((type) => {
    if (type === 'music') {
      setAudioTitle('');
      setAudioArtist('');
    } else if (type === 'mention') {
      setSelectedMentionUsers([]);
      setMentionSearch('');
    } else if (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(type)) {
      setInteractiveType('none');
    } else if (type === 'link') {
      setLinkUrl('');
      setLinkText('');
    } else if (type === 'location') {
      setLocationName('');
    } else if (type === 'hashtag') {
      setHashtagTag('');
    }
    setActiveStickerType('none');
  }, []);

  const resetStickersState = useCallback(() => {
    setActiveStickerType('none');
    setInteractiveType('none');
    setStickerPositions({
      music: { x: 50, y: 15 },
      mention: { x: 50, y: 30 },
      interactive: { x: 50, y: 50 },
      link: { x: 50, y: 70 },
      location: { x: 50, y: 78 },
      hashtag: { x: 50, y: 86 },
    });
    setQuestionPrompt('Ask me a question');
    setPollQuestion('Ask a question...');
    setPollOptionA('Yes');
    setPollOptionB('No');
    setQuizQuestion('Guess the answer!');
    setQuizOptionA('Option A');
    setQuizOptionB('Option B');
    setQuizOptionC('Option C');
    setQuizCorrectIndex(0);
    setSliderQuestion('How hot is this?');
    setSliderEmoji('🔥');
    setCountdownTitle('Upcoming Event');
    setLinkUrl('');
    setLinkText('');
    setLocationName('');
    setHashtagTag('');
    setAudioTitle('');
    setAudioArtist('');
    setMentionSearch('');
    setMentionUserResults([]);
    setIsSearchingMention(false);
    setSelectedMentionUsers([]);
    setShowMentionsOnScreen(true);
  }, []);

  return {
    activeStickerType,
    setActiveStickerType,
    interactiveType,
    setInteractiveType,
    stickerPositions,
    setStickerPositions,
    draggingStickerKey,
    canvasRef,
    isDraggingSticker,
    stickerPos,
    setStickerPos,
    mentionSearch,
    setMentionSearch,
    mentionUserResults,
    setMentionUserResults,
    isSearchingMention,
    selectedMentionUsers,
    setSelectedMentionUsers,
    selectedMentionUser,
    showMentionsOnScreen,
    setShowMentionsOnScreen,
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
    linkUrl,
    setLinkUrl,
    linkText,
    setLinkText,
    locationName,
    setLocationName,
    hashtagTag,
    setHashtagTag,
    audioTitle,
    setAudioTitle,
    audioArtist,
    setAudioArtist,
    isMusicActive,
    isMentionActive,
    isInteractiveActive,
    isLinkActive,
    isLocationActive,
    isHashtagActive,
    attachedCount,
    handleStickerPointerDown,
    handleSetPresetPosition,
    handleRemoveCurrentSticker,
    resetStickersState,
  };
};

export default useStoryStickers;
