import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import mediaService from '../../services/media.service';
import storyService from '../../services/story.service';
import userService from '../../services/user.service';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  generateCroppedImage,
} from '../create-post';
import {
  STORY_ASPECT_RATIOS,
  StoryUploadDropzone,
  StorySubnav,
  StoryCanvasPreview,
  StoryStickerOverlays,
  StoryEditSidebar,
} from '../create-story';
import './CreatePostModal.css';
import './CreateStoryModal.css';

export {
  STORY_ASPECT_RATIOS,
  StoryUploadDropzone,
  StorySubnav,
  StoryCanvasPreview,
  StoryStickerOverlays,
  StoryEditSidebar,
};

export const CreateStoryModal = ({ isOpen, onClose, onStoryCreated }) => {
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();

  const [file, setFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState('');
  const [isCropped, setIsCropped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);

  // Aspect ratio & filters
  const [selectedRatio, setSelectedRatio] = useState(STORY_ASPECT_RATIOS[0]);
  const [selectedFilter, setSelectedFilter] = useState('NORMAL');
  const [editTab, setEditTab] = useState('RATIO'); // 'RATIO' | 'FILTERS' | 'STICKERS'

  // Photo Crop State
  const [activeCrop, setActiveCrop] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    customCropBox: { x: 0, y: 0, width: 100, height: 100 },
  });
  const [isCustomCropActive, setIsCustomCropActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Video Duration Trimming State
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoTrim, setVideoTrim] = useState({
    start: 0,
    end: 15,
    duration: 15,
    coverTime: 0,
  });
  const [filmstripFrames, setFilmstripFrames] = useState([]);
  const [editVideoCurrentTime, setEditVideoCurrentTime] = useState(0);
  const [isEditVideoPlaying, setIsEditVideoPlaying] = useState(false);
  const [isEditVideoMuted, setIsEditVideoMuted] = useState(false);

  // Save Crop State
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [cropSavedToast, setCropSavedToast] = useState(false);

  // Sticker types: 'none', 'mention', 'question', 'poll', 'quiz', 'slider', 'countdown', 'link', 'location', 'hashtag', 'music'
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

  const getPositionKeyForType = (type) => {
    if (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(type)) return 'interactive';
    return type;
  };

  const activePositionKey = getPositionKeyForType(activeStickerType);
  const stickerPos = stickerPositions[activePositionKey] || { x: 50, y: 32 };
  const isDraggingSticker = Boolean(draggingStickerKey);

  const setStickerPos = (pos) => {
    const key = getPositionKeyForType(activeStickerType);
    setStickerPositions((prev) => ({
      ...prev,
      [key]: typeof pos === 'function' ? pos(prev[key] || { x: 50, y: 32 }) : pos,
    }));
  };

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

  // Composable Sticker Active States
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

  const fileInputRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });
  const imageStageRef = useRef(null);
  const imgElementRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const resetForm = (keepThumbnailUrl = null) => {
    if (previewUrl && previewUrl !== keepThumbnailUrl && previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    if (
      originalPreviewUrl &&
      originalPreviewUrl !== previewUrl &&
      originalPreviewUrl !== keepThumbnailUrl &&
      originalPreviewUrl.startsWith('blob:')
    ) {
      try {
        URL.revokeObjectURL(originalPreviewUrl);
      } catch {}
    }
    setFile(null);
    setOriginalFile(null);
    setPreviewUrl('');
    setOriginalPreviewUrl('');
    setIsCropped(false);
    setLoading(false);
    setIsCloseFriendsOnly(false);
    setSelectedRatio(STORY_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');
    setEditTab('RATIO');
    setActiveCrop({
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      customCropBox: { x: 0, y: 0, width: 100, height: 100 },
    });
    setIsCustomCropActive(false);
    setIsDragging(false);
    setShowGrid(false);
    setVideoDuration(0);
    setVideoTrim({ start: 0, end: 15, duration: 15, coverTime: 0 });
    setFilmstripFrames([]);
    setEditVideoCurrentTime(0);
    setIsEditVideoPlaying(false);
    setIsEditVideoMuted(false);
    setIsSavingCrop(false);
    setCropSavedToast(false);
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
  };

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
  const handleStickerPointerDown = (e, key = null) => {
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
  };

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

  const handleSetPresetPosition = (preset) => {
    const key = getPositionKeyForType(activeStickerType);
    if (!key) return;
    const yVal = preset === 'top' ? 16 : preset === 'center' ? 45 : 75;
    setStickerPositions((prev) => ({
      ...prev,
      [key]: { x: 50, y: yVal },
    }));
  };

  const handleRemoveCurrentSticker = (type) => {
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
  };

  const handleClose = (keepThumbnailUrl = null) => {
    resetForm(keepThumbnailUrl);
    onClose();
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    const isVid = selectedFile.type.startsWith('video/');
    const isImg = selectedFile.type.startsWith('image/');

    if (!isImg && !isVid) {
      showError('Please select an image or video file.');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      showError('Media exceeds 100MB limit.');
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setOriginalFile(selectedFile);
    setPreviewUrl(url);
    setOriginalPreviewUrl(url);
    setIsCropped(false);
    setSelectedRatio(STORY_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');

    if (isVid) {
      try {
        const info = await extractVideoThumbnail(selectedFile, 0.5);
        const dur = info?.duration || 15;
        setVideoDuration(dur);
        setVideoTrim({
          start: 0,
          end: Math.min(60, dur),
          duration: dur,
          coverTime: 0,
        });
        const frames = await extractFilmstripFrames(selectedFile, dur, 8);
        if (frames && frames.length > 0) {
          setFilmstripFrames(frames);
        }
      } catch (err) {
        console.warn('Story video metadata extraction warning:', err);
      }
    }
  };

  // Video metadata loaded
  const handleVideoMetadataLoaded = (e) => {
    const dur = Math.floor(e.target.duration) || 15;
    if (dur && dur !== videoDuration) {
      setVideoDuration(dur);
      setVideoTrim((prev) => ({
        start: prev.start || 0,
        end: prev.end && prev.end <= dur ? prev.end : Math.min(60, dur),
        duration: dur,
        coverTime: prev.coverTime || 0,
      }));
    }
  };

  // Looping constraint in video
  const handleVideoTimeUpdate = (e) => {
    const cur = e.target.currentTime;
    setEditVideoCurrentTime(cur);
    const start = videoTrim.start || 0;
    const end = videoTrim.end || videoDuration || 15;
    if (cur >= end) {
      e.target.currentTime = start;
    }
  };

  const handleToggleEditVideoPlay = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!videoPreviewRef.current) return;
    if (isEditVideoPlaying) {
      videoPreviewRef.current.pause();
    } else {
      const start = videoTrim.start || 0;
      const end = videoTrim.end || videoDuration || 15;
      if (videoPreviewRef.current.currentTime < start || videoPreviewRef.current.currentTime >= end) {
        videoPreviewRef.current.currentTime = start;
      }
      videoPreviewRef.current.play().catch(() => {});
    }
  };

  const handleToggleEditVideoMute = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!videoPreviewRef.current) return;
    const next = !isEditVideoMuted;
    videoPreviewRef.current.muted = next;
    setIsEditVideoMuted(next);
  };

  // Video Trim Handlers
  const handleTrimStartChange = (val) => {
    const dur = videoTrim.duration || videoDuration || 15;
    const curEnd = videoTrim.end || dur;
    const maxStart = Math.max(0, curEnd - 1);
    const nextStart = Math.min(val, maxStart);
    setVideoTrim((prev) => ({ ...prev, start: nextStart }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = nextStart;
    }
  };

  const handleTrimEndChange = (val) => {
    const curStart = videoTrim.start || 0;
    const minEnd = curStart + 1;
    const nextEnd = Math.max(val, minEnd);
    setVideoTrim((prev) => ({ ...prev, end: nextEnd }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = nextEnd;
    }
  };

  const handleApplyVideoPreset = (seconds) => {
    const dur = videoTrim.duration || videoDuration || 15;
    if (seconds >= dur) {
      setVideoTrim((prev) => ({ ...prev, start: 0, end: dur }));
      if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    } else {
      setVideoTrim((prev) => ({ ...prev, start: 0, end: seconds }));
      if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    }
  };

  const handleResetVideoTrim = () => {
    const dur = videoDuration || 15;
    setVideoTrim({ start: 0, end: dur, duration: dur, coverTime: 0 });
    setSelectedRatio(STORY_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');
    if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    showSuccess('Story trim reset to original.');
  };

  // Photo Panning & Zoom Handlers
  const handleMouseDown = (e) => {
    if (file?.type?.startsWith('video/') || isCustomCropActive) return;
    setIsDragging(true);
    setShowGrid(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: activeCrop.panX || 0,
      initialPanY: activeCrop.panY || 0,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || file?.type?.startsWith('video/') || isCustomCropActive) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setActiveCrop((prev) => ({
      ...prev,
      panX: Math.round(dragStartRef.current.initialPanX + deltaX),
      panY: Math.round(dragStartRef.current.initialPanY + deltaY),
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setShowGrid(false);
  };

  const handleWheel = (e) => {
    if (file?.type?.startsWith('video/') || isCustomCropActive) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setActiveCrop((prev) => ({
      ...prev,
      zoom: Math.max(1, Math.min(3, Math.round((prev.zoom + delta) * 100) / 100)),
    }));
  };

  const handleZoomChange = (val) => {
    setActiveCrop((prev) => ({ ...prev, zoom: parseFloat(val) }));
  };

  const handleRotate = () => {
    setActiveCrop((prev) => ({
      ...prev,
      rotation: ((prev.rotation || 0) + 90) % 360,
    }));
  };

  const handleToggleCustomCrop = () => {
    const next = !isCustomCropActive;
    setIsCustomCropActive(next);
    if (next) {
      setSelectedRatio(STORY_ASPECT_RATIOS.find((r) => r.id === 'CUSTOM') || STORY_ASPECT_RATIOS[0]);
      if (!activeCrop.customCropBox || activeCrop.customCropBox.width === 100) {
        setActiveCrop((prev) => ({
          ...prev,
          customCropBox: { x: 5, y: 5, width: 90, height: 90 },
        }));
      }
    }
  };

  // Custom Crop Box Dragging & Resizing
  const handleStartBoxDrag = (e, action) => {
    e.stopPropagation();
    e.preventDefault();
    setShowGrid(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const stage = imageStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startBox = { ...(activeCrop.customCropBox || { x: 5, y: 5, width: 90, height: 90 }) };

    const onPointerMove = (moveEvt) => {
      const deltaXPercent = ((moveEvt.clientX - startX) / rect.width) * 100;
      const deltaYPercent = ((moveEvt.clientY - startY) / rect.height) * 100;

      let { x, y, width, height } = startBox;
      switch (action) {
        case 'move':
          x = Math.max(0, Math.min(100 - width, startBox.x + deltaXPercent));
          y = Math.max(0, Math.min(100 - height, startBox.y + deltaYPercent));
          break;
        case 'resize-se':
          width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
          height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
          break;
        case 'resize-nw': {
          const nextX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent));
          const nextY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent));
          width = startBox.width - (nextX - startBox.x);
          height = startBox.height - (nextY - startBox.y);
          x = nextX;
          y = nextY;
          break;
        }
        case 'resize-ne': {
          const nextY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent));
          width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
          height = startBox.height - (nextY - startBox.y);
          y = nextY;
          break;
        }
        case 'resize-sw': {
          const nextX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent));
          width = startBox.width - (nextX - startBox.x);
          height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
          x = nextX;
          break;
        }
        case 'resize-n': {
          const nextY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent));
          height = startBox.height - (nextY - startBox.y);
          y = nextY;
          break;
        }
        case 'resize-s':
          height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
          break;
        case 'resize-w': {
          const nextX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent));
          width = startBox.width - (nextX - startBox.x);
          x = nextX;
          break;
        }
        case 'resize-e':
          width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
          break;
        default:
          break;
      }

      setActiveCrop((prev) => ({
        ...prev,
        customCropBox: {
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          width: Math.round(width * 10) / 10,
          height: Math.round(height * 10) / 10,
        },
      }));
    };

    const onPointerUp = () => {
      setShowGrid(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Immediate Save & Commit for Crop or Video Trim (Right Tick Button)
  const handleSaveCrop = async () => {
    if (!file) return;
    setIsSavingCrop(true);
    try {
      if (file.type.startsWith('video/')) {
        const trim = videoTrim;
        const start = trim.start || 0;
        const end = trim.end || trim.duration || videoDuration || 15;
        showSuccess(`Story trim saved! (${formatTime(start)} – ${formatTime(end)}) ✓`);
      } else {
        const croppedFile = await generateCroppedImage(
          {
            file,
            originalFile,
            previewUrl,
            originalPreviewUrl,
            crop: activeCrop,
          },
          selectedRatio
        );
        if (croppedFile) {
          const newPreview = URL.createObjectURL(croppedFile);
          setFile(croppedFile);
          setPreviewUrl(newPreview);
          setIsCropped(true);
          setActiveCrop({
            zoom: 1,
            panX: 0,
            panY: 0,
            rotation: 0,
            customCropBox: { x: 0, y: 0, width: 100, height: 100 },
          });
          setIsCustomCropActive(false);
          showSuccess('Crop applied & saved! ✓');
        } else {
          showSuccess('Crop saved! ✓');
        }
      }
      setCropSavedToast(true);
      setTimeout(() => setCropSavedToast(false), 2400);
    } catch (err) {
      console.error('Failed to save story crop:', err);
      showError('Failed to save crop. Please try again.');
    } finally {
      setIsSavingCrop(false);
    }
  };

  const handleResetCrop = () => {
    if (file?.type?.startsWith('video/')) {
      handleResetVideoTrim();
    } else {
      setFile(originalFile || file);
      setPreviewUrl(originalPreviewUrl || previewUrl);
      setIsCropped(false);
      setActiveCrop({
        zoom: 1,
        panX: 0,
        panY: 0,
        rotation: 0,
        customCropBox: { x: 0, y: 0, width: 100, height: 100 },
      });
      setIsCustomCropActive(false);
      setSelectedRatio(STORY_ASPECT_RATIOS[0]);
      setSelectedFilter('NORMAL');
      showSuccess('Crop reset to original.');
    }
  };

  const doSubmit = async (closeFriends) => {
    if (!file) return;

    // Snapshot parameters for background execution
    const capturedFile = file;
    const capturedPreviewUrl = previewUrl;
    const capturedRatio = selectedRatio;
    const capturedTrim = { ...videoTrim };
    const capturedInteractive = interactiveType;
    const capturedPrompt = questionPrompt;
    const capturedPoll = { question: pollQuestion, optA: pollOptionA, optB: pollOptionB };
    const capturedQuiz = {
      question: quizQuestion,
      optA: quizOptionA,
      optB: quizOptionB,
      optC: quizOptionC,
      correctIdx: quizCorrectIndex,
    };
    const capturedSlider = { question: sliderQuestion, emoji: sliderEmoji };
    const capturedCountdown = { title: countdownTitle, date: countdownDate };
    const capturedLink = { url: linkUrl, text: linkText };
    const capturedLocation = locationName;
    const capturedHashtag = hashtagTag;
    const capturedAudioTitle = audioTitle;
    const capturedAudioArtist = audioArtist;
    const capturedMentionUsers = [...selectedMentionUsers];
    const capturedShowMentionsOnScreen = showMentionsOnScreen;
    const capturedPositions = { ...stickerPositions };
    const capturedFilter = selectedFilter;

    const performStoryUpload = async (updateProgress = () => {}) => {
      updateProgress(25, 'Adding to your story...');
      const uploadRes = await mediaService.uploadMedia(capturedFile, 'stories', (filePct) => {
        const dynamicPct = Math.min(65, Math.round(25 + (filePct / 100) * 40));
        updateProgress(dynamicPct, 'Adding to your story...');
      });
      let mediaUrl =
        uploadRes?.secureUrl ||
        uploadRes?.data?.secureUrl ||
        uploadRes?.url ||
        uploadRes?.data?.url;
      const mediaType = capturedFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

      if (!mediaUrl) {
        throw new Error('Failed to upload story media.');
      }

      // Attach Cloudinary video transformation URL for duration trim & aspect ratio if video
      if (mediaType === 'VIDEO') {
        updateProgress(70, 'Processing story video...');
        const transforms = [];
        if (capturedRatio?.id && capturedRatio.id !== 'ORIGINAL' && capturedRatio.id !== 'CUSTOM') {
          transforms.push(`c_fill,ar_${capturedRatio.id === '9:16' ? '9:16' : capturedRatio.id}`);
        }
        if (capturedTrim) {
          const { start = 0, end = 0, duration = 0 } = capturedTrim;
          if (start > 0 || (end > 0 && end < duration)) {
            transforms.push(`so_${Math.round(start)},eo_${Math.round(end)}`);
          }
        }
        if (transforms.length > 0) {
          const transformPrefix = transforms.join(',') + '/';
          if (mediaUrl.includes('/video/upload/')) {
            mediaUrl = mediaUrl.replace('/video/upload/', `/video/upload/${transformPrefix}`);
          } else if (mediaUrl.includes('/upload/')) {
            mediaUrl = mediaUrl.replace('/upload/', `/upload/${transformPrefix}`);
          }
        }
      }

      updateProgress(88, 'Finishing up...');
      const payload = {
        mediaUrl,
        mediaType,
        closeFriendsOnly: closeFriends,
        caption: null,
        filterName: capturedFilter !== 'NORMAL' ? capturedFilter : null,
        audioTitle: capturedAudioTitle.trim() || null,
        audioArtist: capturedAudioArtist.trim() || null,
        questionPrompt:
          capturedInteractive === 'question' && capturedPrompt.trim()
            ? capturedPrompt.trim()
            : null,
        poll:
          capturedInteractive === 'poll' && capturedPoll.question.trim()
            ? {
                question: capturedPoll.question.trim(),
                optionA: capturedPoll.optA.trim() || 'Yes',
                optionB: capturedPoll.optB.trim() || 'No',
              }
            : null,
        quiz:
          capturedInteractive === 'quiz' && capturedQuiz.question.trim()
            ? {
                question: capturedQuiz.question.trim(),
                optionA: capturedQuiz.optA.trim() || 'Option A',
                optionB: capturedQuiz.optB.trim() || 'Option B',
                optionC: capturedQuiz.optC.trim() || null,
                correctOptionIndex: capturedQuiz.correctIdx,
              }
            : null,
        slider:
          capturedInteractive === 'slider' && capturedSlider.question.trim()
            ? {
                question: capturedSlider.question.trim(),
                emoji: capturedSlider.emoji || '🔥',
              }
            : null,
        countdown:
          capturedInteractive === 'countdown' && capturedCountdown.title.trim()
            ? {
                title: capturedCountdown.title.trim(),
                targetDate: new Date(capturedCountdown.date).toISOString(),
              }
            : null,
        links:
          capturedLink.url.trim()
            ? [
                {
                  url: capturedLink.url.trim(),
                  title: capturedLink.text.trim() || null,
                  xPercent: capturedPositions?.link?.x ?? 50,
                  yPercent: capturedPositions?.link?.y ?? 70,
                },
              ]
            : [],
        locations:
          capturedLocation.trim()
            ? [
                {
                  locationName: capturedLocation.trim(),
                  xPercent: capturedPositions?.location?.x ?? 50,
                  yPercent: capturedPositions?.location?.y ?? 78,
                },
              ]
            : [],
        hashtags:
          capturedHashtag.trim()
            ? [
                {
                  hashtag: capturedHashtag.replace(/^#/, '').trim(),
                  xPercent: capturedPositions?.hashtag?.x ?? 50,
                  yPercent: capturedPositions?.hashtag?.y ?? 85,
                },
              ]
            : [],
        mentions:
          capturedMentionUsers?.length > 0
            ? capturedMentionUsers.map((u, idx) => ({
                userId: u.id || u.userId,
                xPercent: Math.min(85, Math.max(15, Number((capturedPositions?.mention?.x || 50) + idx * 2))),
                yPercent: Math.min(85, Math.max(15, Number((capturedPositions?.mention?.y || 32) + idx * 5))),
              }))
            : [],
      };

      await storyService.createStory(payload);
      if (onStoryCreated) onStoryCreated();
    };

    // 🚀 BACKGROUND UPLOAD: If UploadContext is available, fire in background & close modal immediately!
    if (uploadCtx?.startUpload) {
      uploadCtx.startUpload({
        type: 'story',
        title: closeFriends ? 'Close Friends Story 🟢' : 'Your Story',
        thumbnail: capturedPreviewUrl,
        mediaUrl: capturedPreviewUrl,
        mediaType: capturedFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        isCloseFriends: closeFriends,
        filterName: capturedFilter !== 'NORMAL' ? capturedFilter : null,
        audioTitle: capturedAudioTitle.trim() || null,
        audioArtist: capturedAudioArtist.trim() || null,
        question:
          capturedInteractive === 'question' && capturedPrompt.trim()
            ? capturedPrompt.trim()
            : null,
        poll:
          capturedInteractive === 'poll' && capturedPoll.question.trim()
            ? {
                question: capturedPoll.question.trim(),
                optionA: capturedPoll.optA.trim() || 'Yes',
                optionB: capturedPoll.optB.trim() || 'No',
              }
            : null,
        quiz:
          capturedInteractive === 'quiz' && capturedQuiz.question.trim()
            ? {
                question: capturedQuiz.question.trim(),
                optionA: capturedQuiz.optA.trim() || 'Option A',
                optionB: capturedQuiz.optB.trim() || 'Option B',
                optionC: capturedQuiz.optC.trim() || null,
                correctOptionIndex: capturedQuiz.correctIdx,
              }
            : null,
        slider:
          capturedInteractive === 'slider' && capturedSlider.question.trim()
            ? {
                question: capturedSlider.question.trim(),
                emoji: capturedSlider.emoji || '🔥',
              }
            : null,
        countdown:
          capturedInteractive === 'countdown' && capturedCountdown.title.trim()
            ? {
                title: capturedCountdown.title.trim(),
                targetDate: new Date(capturedCountdown.date).toISOString(),
              }
            : null,
        links:
          capturedLink.url.trim()
            ? [{ url: capturedLink.url.trim(), title: capturedLink.text.trim() || null }]
            : [],
        locations:
          capturedLocation.trim() ? [{ locationName: capturedLocation.trim() }] : [],
        hashtags:
          capturedHashtag.trim()
            ? [{ hashtag: capturedHashtag.replace(/^#/, '').trim() }]
            : [],
        mentions: capturedMentionUsers?.length > 0 ? capturedMentionUsers : [],
        task: performStoryUpload,
      });
      handleClose(capturedPreviewUrl);
      return;
    }

    // Synchronous fallback (e.g. for standalone tests without UploadProvider)
    try {
      setLoading(true);
      setIsCloseFriendsOnly(closeFriends);
      await performStoryUpload();
      showSuccess(
        closeFriends
          ? 'Shared to Close Friends! 🟢'
          : 'Story added! It will be visible for 24 hours. ✓'
      );
      window.dispatchEvent(new CustomEvent('story:refresh'));
      handleClose();
    } catch (err) {
      showError(err.message || 'Failed to upload story');
    } finally {
      setLoading(false);
    }
  };

  const isVideo = file?.type?.startsWith('video/');
  const customBox = activeCrop.customCropBox || { x: 5, y: 5, width: 90, height: 90 };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={previewUrl ? null : 'Add to Story'}
      showCloseButton={!previewUrl}
      size={previewUrl ? 'lg' : 'md'}
    >
      <div className="create-story-form">
        {!previewUrl ? (
          <StoryUploadDropzone
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
          />
        ) : (
          <>
            {/* Wizard Subnav Header with Top-Right Save Button & Close Button */}
            <StorySubnav
              handleBack={() => {
                setPreviewUrl('');
                setFile(null);
              }}
              handleSaveCrop={handleSaveCrop}
              isSavingCrop={isSavingCrop}
              handleClose={handleClose}
            />

            {/* 2-Column Story Edit Workspace */}
            <div className="story-edit-workspace">
              {/* Left Column: Media Viewport */}
              <StoryCanvasPreview
                canvasRef={canvasRef}
                isDragging={isDragging}
                selectedRatio={selectedRatio}
                handleMouseDown={handleMouseDown}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
                handleWheel={handleWheel}
                handleSaveCrop={handleSaveCrop}
                isSavingCrop={isSavingCrop}
                cropSavedToast={cropSavedToast}
                isVideo={isVideo}
                videoPreviewRef={videoPreviewRef}
                previewUrl={previewUrl}
                selectedFilter={selectedFilter}
                videoDuration={videoDuration}
                handleVideoMetadataLoaded={handleVideoMetadataLoaded}
                handleVideoTimeUpdate={handleVideoTimeUpdate}
                setIsEditVideoPlaying={setIsEditVideoPlaying}
                isEditVideoPlaying={isEditVideoPlaying}
                handleToggleEditVideoPlay={handleToggleEditVideoPlay}
                videoTrim={videoTrim}
                editVideoCurrentTime={editVideoCurrentTime}
                isEditVideoMuted={isEditVideoMuted}
                handleToggleEditVideoMute={handleToggleEditVideoMute}
                setVideoTrim={setVideoTrim}
                setEditVideoCurrentTime={setEditVideoCurrentTime}
                handleResetVideoTrim={handleResetVideoTrim}
                handleApplyVideoPreset={handleApplyVideoPreset}
                filmstripFrames={filmstripFrames}
                imageStageRef={imageStageRef}
                imgElementRef={imgElementRef}
                isCropped={isCropped}
                originalPreviewUrl={originalPreviewUrl}
                isCustomCropActive={isCustomCropActive}
                activeCrop={activeCrop}
                customBox={customBox}
                handleStartBoxDrag={handleStartBoxDrag}
                showGrid={showGrid}
                stickerProps={{
                  isMusicActive,
                  activeStickerType,
                  setActiveStickerType,
                  draggingStickerKey,
                  stickerPositions,
                  handleStickerPointerDown,
                  setAudioTitle,
                  setAudioArtist,
                  audioTitle,
                  audioArtist,
                  showMentionsOnScreen,
                  setShowMentionsOnScreen,
                  selectedMentionUsers,
                  mentionSearch,
                  handleRemoveMentionUser: (id) =>
                    setSelectedMentionUsers((prev) =>
                      prev.filter((m) => (m.id || m.userId) !== id)
                    ),
                  isInteractiveActive,
                  interactiveType,
                  setInteractiveType,
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
                  countdownTitle,
                  countdownDate,
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
                }}
              />

              {/* Right Column: Tools Sidebar & Sticky Footer */}
              <StoryEditSidebar
                editTab={editTab}
                setEditTab={setEditTab}
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
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                previewUrl={previewUrl}
                attachedCount={attachedCount}
                activeStickerType={activeStickerType}
                setActiveStickerType={setActiveStickerType}
                setInteractiveType={setInteractiveType}
                interactiveType={interactiveType}
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
                handleClose={handleClose}
                loading={loading}
                isCloseFriendsOnly={isCloseFriendsOnly}
                doSubmit={doSubmit}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateStoryModal;
