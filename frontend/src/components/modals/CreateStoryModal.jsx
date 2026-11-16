import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  X,
  Star,
  HelpCircle,
  BarChart2,
  HelpCircle as QuizIcon,
  Flame,
  Clock,
  Link as LinkIcon,
  MapPin,
  Hash,
  Music,
  ArrowLeft,
  Check,
  Scissors,
  Play,
  RotateCw,
  RotateCcw,
  Sparkles,
  Sliders,
  Crop,
  Film,
  ZoomIn,
  ZoomOut,
  Smile,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import mediaService from '../../services/media.service';
import storyService from '../../services/story.service';
import { useToast } from '../../context/ToastContext';
import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  generateCroppedImage,
  PhoneVideoTrimmer,
} from './CreatePostModal';
import { INSTAGRAM_FILTERS, getFilterStyle } from '../../utils/instagramFilters';
import { useUpload } from '../../context/UploadContext';
import './CreatePostModal.css';
import './CreateStoryModal.css';

const STORY_ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 (Story)', ratio: '9 / 16' },
  { id: 'ORIGINAL', label: 'Original', ratio: null },
  { id: '1:1', label: '1:1 (Square)', ratio: '1 / 1' },
  { id: '4:5', label: '4:5 (Portrait)', ratio: '4 / 5' },
  { id: 'CUSTOM', label: 'Custom (Free)', ratio: null },
];

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

  // Sticker types: 'none', 'question', 'poll', 'quiz', 'slider', 'countdown', 'link', 'location', 'hashtag', 'music'
  const [activeStickerType, setActiveStickerType] = useState('none');

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
    setLinkUrl('');
    setLinkText('');
    setLocationName('');
    setHashtagTag('');
    setAudioTitle('');
    setAudioArtist('');
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
    const capturedStickerType = activeStickerType;
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
        questionPrompt:
          capturedStickerType === 'question' && capturedPrompt.trim()
            ? capturedPrompt.trim()
            : null,
        poll:
          capturedStickerType === 'poll' && capturedPoll.question.trim()
            ? {
                question: capturedPoll.question.trim(),
                optionA: capturedPoll.optA.trim() || 'Yes',
                optionB: capturedPoll.optB.trim() || 'No',
              }
            : null,
        quiz:
          capturedStickerType === 'quiz' && capturedQuiz.question.trim()
            ? {
                question: capturedQuiz.question.trim(),
                optionA: capturedQuiz.optA.trim() || 'Option A',
                optionB: capturedQuiz.optB.trim() || 'Option B',
                optionC: capturedQuiz.optC.trim() || null,
                correctOptionIndex: capturedQuiz.correctIdx,
              }
            : null,
        slider:
          capturedStickerType === 'slider' && capturedSlider.question.trim()
            ? {
                question: capturedSlider.question.trim(),
                emoji: capturedSlider.emoji || '🔥',
              }
            : null,
        countdown:
          capturedStickerType === 'countdown' && capturedCountdown.title.trim()
            ? {
                title: capturedCountdown.title.trim(),
                targetDate: new Date(capturedCountdown.date).toISOString(),
              }
            : null,
        link:
          capturedStickerType === 'link' && capturedLink.url.trim()
            ? {
                url: capturedLink.url.trim(),
                stickerText: capturedLink.text.trim() || null,
              }
            : null,
        location:
          capturedStickerType === 'location' && capturedLocation.trim()
            ? { name: capturedLocation.trim() }
            : null,
        hashtag:
          capturedStickerType === 'hashtag' && capturedHashtag.trim()
            ? { tag: capturedHashtag.replace(/^#/, '').trim() }
            : null,
        audioTitle: capturedAudioTitle.trim() || null,
        audioArtist: capturedAudioArtist.trim() || null,
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
        question:
          capturedStickerType === 'question' && capturedPrompt.trim()
            ? capturedPrompt.trim()
            : null,
        poll:
          capturedStickerType === 'poll' && capturedPoll.question.trim()
            ? {
                question: capturedPoll.question.trim(),
                optionA: capturedPoll.optA.trim() || 'Yes',
                optionB: capturedPoll.optB.trim() || 'No',
              }
            : null,
        quiz:
          capturedStickerType === 'quiz' && capturedQuiz.question.trim()
            ? {
                question: capturedQuiz.question.trim(),
                optionA: capturedQuiz.optA.trim() || 'Option A',
                optionB: capturedQuiz.optB.trim() || 'Option B',
                optionC: capturedQuiz.optC.trim() || null,
                correctOptionIndex: capturedQuiz.correctIdx,
              }
            : null,
        slider:
          capturedStickerType === 'slider' && capturedSlider.question.trim()
            ? {
                question: capturedSlider.question.trim(),
                emoji: capturedSlider.emoji || '🔥',
              }
            : null,
        countdown:
          capturedStickerType === 'countdown' && capturedCountdown.title.trim()
            ? {
                title: capturedCountdown.title.trim(),
                targetDate: new Date(capturedCountdown.date).toISOString(),
              }
            : null,
        link:
          capturedStickerType === 'link' && capturedLink.url.trim()
            ? {
                url: capturedLink.url.trim(),
                stickerText: capturedLink.text.trim() || null,
              }
            : null,
        location:
          capturedStickerType === 'location' && capturedLocation.trim()
            ? { name: capturedLocation.trim() }
            : null,
        hashtag:
          capturedStickerType === 'hashtag' && capturedHashtag.trim()
            ? { tag: capturedHashtag.replace(/^#/, '').trim() }
            : null,
        audioTitle: capturedAudioTitle.trim() || null,
        audioArtist: capturedAudioArtist.trim() || null,
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
      title={previewUrl ? 'Edit Story' : 'Add to Story'}
      size={previewUrl ? 'lg' : 'md'}
    >
      <div className="create-story-form">
        {!previewUrl ? (
          <div className="story-dropzone" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
            <div className="story-dropzone-circle">
              <UploadCloud size={38} />
            </div>
            <h3 className="story-dropzone-title">Upload a Story</h3>
            <p className="story-dropzone-desc">Photos and videos that expire in 24 hours</p>
            <button type="button" className="story-dropzone-btn">
              Select Photo or Video
            </button>
          </div>
        ) : (
          <>
            {/* Wizard Subnav Header with Top-Right Save Button */}
            <div className="ig-wizard-subnav">
              <button
                type="button"
                className="ig-subnav-btn"
                onClick={() => {
                  setPreviewUrl('');
                  setFile(null);
                }}
                title="Back to file select"
              >
                <ArrowLeft size={20} />
              </button>

              <span className="ig-subnav-title">Edit Story</span>

              <div className="ig-subnav-right-actions">
                <button
                  type="button"
                  className="ig-subnav-save-crop-btn"
                  onClick={handleSaveCrop}
                  disabled={isSavingCrop}
                  title="Save Story Crop & Changes (✓)"
                  aria-label="Save Story Crop & Changes"
                >
                  <Check size={16} strokeWidth={2.8} />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* 2-Column Story Edit Workspace */}
            <div className="story-edit-workspace">
              {/* Left Column: Media Viewport */}
              <div
                className={`ig-edit-canvas story-canvas ${isDragging ? 'dragging' : ''}`}
                style={{ aspectRatio: selectedRatio.ratio || '9 / 16' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* Floating Top-Right Save Button */}
                <button
                  type="button"
                  className="ig-canvas-corner-save-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveCrop();
                  }}
                  disabled={isSavingCrop}
                  title="Save current crop/trim (✓)"
                  aria-label="Save current crop/trim"
                >
                  <Check size={15} strokeWidth={2.8} />
                  <span>Save</span>
                </button>

                {/* Floating Green Toast Banner */}
                {cropSavedToast && (
                  <div className="ig-crop-saved-banner" role="status">
                    <Check size={14} strokeWidth={3} />
                    <span>{isVideo ? 'Story trim saved! ✓' : 'Crop applied & saved! ✓'}</span>
                  </div>
                )}

                {isVideo ? (
                  <div className="ig-video-viewport">
                    <video
                      ref={videoPreviewRef}
                      src={previewUrl}
                      className="ig-canvas-media"
                      style={{
                        ...getFilterStyle(selectedFilter),
                        objectFit: selectedRatio.id === 'ORIGINAL' ? 'contain' : 'cover',
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                      onLoadedMetadata={handleVideoMetadataLoaded}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPlay={() => setIsEditVideoPlaying(true)}
                      onPause={() => setIsEditVideoPlaying(false)}
                      onClick={handleToggleEditVideoPlay}
                    />

                    {/* Center Play Icon Overlay */}
                    {!isEditVideoPlaying && (
                      <div className="ig-video-center-play-overlay" onClick={handleToggleEditVideoPlay}>
                        <div className="ig-video-center-play-circle">
                          <Play size={32} fill="#ffffff" color="#ffffff" style={{ marginLeft: '4px' }} />
                        </div>
                      </div>
                    )}

                    {/* Indicator Pill: Full Story vs Trimmed */}
                    {videoTrim.start > 0 || (videoTrim.end < (videoTrim.duration || videoDuration) && videoTrim.end > 0) ? (
                      <div className="ig-video-trim-indicator-pill">
                        <Scissors size={12} color="#ffcc00" />
                        <span>
                          Trim: {formatTime(videoTrim.start)} – {formatTime(videoTrim.end || videoTrim.duration)} (
                          {formatTime(Math.max(1, (videoTrim.end || videoTrim.duration) - videoTrim.start))})
                        </span>
                      </div>
                    ) : (
                      <div className="ig-video-trim-indicator-pill full-len">
                        <Film size={12} color="#0095f6" />
                        <span>Full Story: {formatTime(videoTrim.duration || videoDuration)}</span>
                      </div>
                    )}

                    {/* Phone-Style Video Timeline Trimmer */}
                    <PhoneVideoTrimmer
                      videoTrim={videoTrim}
                      currentTime={editVideoCurrentTime}
                      isPlaying={isEditVideoPlaying}
                      isMuted={isEditVideoMuted}
                      onTogglePlay={handleToggleEditVideoPlay}
                      onToggleMute={handleToggleEditVideoMute}
                      onTrimChange={({ start, end }) => {
                        setVideoTrim((prev) => ({ ...prev, start, end }));
                      }}
                      onSeek={(time) => {
                        if (videoPreviewRef.current) {
                          videoPreviewRef.current.currentTime = time;
                          setEditVideoCurrentTime(time);
                        }
                      }}
                      onReset={handleResetVideoTrim}
                      onPreset={handleApplyVideoPreset}
                      filmstripFrames={filmstripFrames}
                    />
                  </div>
                ) : (
                  <div className="ig-crop-viewport">
                    <div className="ig-crop-image-stage" ref={imageStageRef}>
                      <img
                        ref={imgElementRef}
                        src={isCropped ? previewUrl : (originalPreviewUrl || previewUrl)}
                        alt="Story preview"
                        className={`ig-canvas-media ${!isCustomCropActive ? (isDragging ? 'grabbing' : 'grabbable') : ''}`}
                        style={{
                          ...getFilterStyle(selectedFilter),
                          transform: !isCustomCropActive
                            ? `translate(${activeCrop.panX}px, ${activeCrop.panY}px) scale(${activeCrop.zoom}) rotate(${activeCrop.rotation}deg)`
                            : `rotate(${activeCrop.rotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                        draggable={false}
                      />

                      {/* Interactive Custom Crop Frame with Corner & Edge Handles */}
                      {isCustomCropActive && (
                        <div
                          className="ig-custom-crop-frame"
                          style={{
                            left: `${customBox.x}%`,
                            top: `${customBox.y}%`,
                            width: `${customBox.width}%`,
                            height: `${customBox.height}%`,
                          }}
                          onPointerDown={(e) => handleStartBoxDrag(e, 'move')}
                        >
                          <div className="ig-crop-grid-overlay" aria-hidden="true">
                            <div className="ig-grid-line vertical line-1" />
                            <div className="ig-grid-line vertical line-2" />
                            <div className="ig-grid-line horizontal line-1" />
                            <div className="ig-grid-line horizontal line-2" />
                          </div>

                          <div className="ig-crop-frame-badge">
                            <Crop size={12} />
                            <span>Custom Crop</span>
                          </div>

                          <button
                            type="button"
                            className="ig-crop-frame-confirm-tick"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveCrop();
                            }}
                            title="Apply & Save Custom Crop"
                            aria-label="Apply & Save Custom Crop"
                          >
                            <Check size={13} strokeWidth={3} />
                            <span>Apply</span>
                          </button>

                          {/* 4 Corner Handles */}
                          <div
                            className="ig-crop-handle corner handle-nw"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-nw')}
                            title="Drag to resize crop"
                          />
                          <div
                            className="ig-crop-handle corner handle-ne"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-ne')}
                            title="Drag to resize crop"
                          />
                          <div
                            className="ig-crop-handle corner handle-se"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-se')}
                            title="Drag to resize crop"
                          />
                          <div
                            className="ig-crop-handle corner handle-sw"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-sw')}
                            title="Drag to resize crop"
                          />

                          {/* 4 Edge Handles */}
                          <div
                            className="ig-crop-handle edge handle-n"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-n')}
                          />
                          <div
                            className="ig-crop-handle edge handle-s"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-s')}
                          />
                          <div
                            className="ig-crop-handle edge handle-w"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-w')}
                          />
                          <div
                            className="ig-crop-handle edge handle-e"
                            onPointerDown={(e) => handleStartBoxDrag(e, 'resize-e')}
                          />
                        </div>
                      )}

                      {/* Full-Canvas 3x3 Grid during pan/zoom */}
                      {!isCustomCropActive && (isDragging || showGrid) && (
                        <div className="ig-crop-grid-overlay" aria-hidden="true">
                          <div className="ig-grid-line vertical line-1" />
                          <div className="ig-grid-line vertical line-2" />
                          <div className="ig-grid-line horizontal line-1" />
                          <div className="ig-grid-line horizontal line-2" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Overlaid Active Sticker */}
                {activeStickerType === 'question' && (
                  <div className="story-sticker-overlay question-overlay">
                    <div className="question-header">
                      <input
                        type="text"
                        value={questionPrompt}
                        onChange={(e) => setQuestionPrompt(e.target.value)}
                        placeholder="Ask me a question"
                        maxLength={150}
                        className="sticker-prompt-input"
                      />
                    </div>
                    <div className="question-placeholder">Type something...</div>
                  </div>
                )}

                {activeStickerType === 'poll' && (
                  <div className="story-sticker-overlay poll-overlay">
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      maxLength={150}
                      className="sticker-prompt-input"
                    />
                    <div className="poll-options-row">
                      <input
                        type="text"
                        value={pollOptionA}
                        onChange={(e) => setPollOptionA(e.target.value)}
                        placeholder="Option 1"
                        maxLength={40}
                        className="poll-option-input"
                      />
                      <input
                        type="text"
                        value={pollOptionB}
                        onChange={(e) => setPollOptionB(e.target.value)}
                        placeholder="Option 2"
                        maxLength={40}
                        className="poll-option-input"
                      />
                    </div>
                  </div>
                )}

                {activeStickerType === 'quiz' && (
                  <div className="story-sticker-overlay quiz-overlay">
                    <input
                      type="text"
                      value={quizQuestion}
                      onChange={(e) => setQuizQuestion(e.target.value)}
                      placeholder="Guess the answer!"
                      maxLength={150}
                      className="sticker-prompt-input"
                    />
                    <div className="quiz-options-list">
                      {[
                        { val: quizOptionA, set: setQuizOptionA, idx: 0 },
                        { val: quizOptionB, set: setQuizOptionB, idx: 1 },
                        { val: quizOptionC, set: setQuizOptionC, idx: 2 },
                      ].map(({ val, set, idx }) => (
                        <div
                          key={idx}
                          className={`quiz-option-row ${quizCorrectIndex === idx ? 'correct' : ''}`}
                          onClick={() => setQuizCorrectIndex(idx)}
                        >
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            className="quiz-option-input"
                            placeholder={`Option ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeStickerType === 'slider' && (
                  <div className="story-sticker-overlay slider-overlay">
                    <input
                      type="text"
                      value={sliderQuestion}
                      onChange={(e) => setSliderQuestion(e.target.value)}
                      placeholder="How hot is this?"
                      maxLength={100}
                      className="sticker-prompt-input"
                    />
                    <div className="slider-track-preview">
                      <span className="slider-emoji">{sliderEmoji}</span>
                    </div>
                  </div>
                )}

                {activeStickerType === 'countdown' && (
                  <div className="story-sticker-overlay countdown-overlay">
                    <div className="countdown-title">{countdownTitle || 'Upcoming Event'}</div>
                    <div className="countdown-timer-box">03d : 12h : 45m</div>
                  </div>
                )}

                {activeStickerType === 'link' && linkUrl && (
                  <div className="story-sticker-overlay link-overlay">
                    <LinkIcon size={14} />
                    <span>{linkText || linkUrl.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}

                {activeStickerType === 'location' && locationName && (
                  <div className="story-sticker-overlay location-overlay">
                    <MapPin size={14} />
                    <span>{locationName}</span>
                  </div>
                )}

                {activeStickerType === 'hashtag' && hashtagTag && (
                  <div className="story-sticker-overlay hashtag-overlay">
                    <span>#{hashtagTag.replace(/^#/, '')}</span>
                  </div>
                )}

                {activeStickerType === 'music' && audioTitle && (
                  <div className="story-sticker-overlay music-overlay">
                    <Music size={14} />
                    <span>{audioTitle} {audioArtist ? `• ${audioArtist}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Tools Sidebar */}
              <div className="ig-edit-sidebar story-tools-sidebar">
                <div className="ig-edit-tab-headers">
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

                {/* Tab 1: Crop & Ratio */}
                {editTab === 'RATIO' && (
                  <div className="ig-ratio-panel" style={{ padding: '14px' }}>
                    <h4 className="ig-panel-heading">Aspect Ratio</h4>
                    <div className="ig-ratio-options-grid">
                      {STORY_ASPECT_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={`ig-ratio-option-btn ${selectedRatio.id === r.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRatio(r);
                            if (r.id === 'CUSTOM') {
                              setIsCustomCropActive(true);
                            } else {
                              setIsCustomCropActive(false);
                            }
                          }}
                        >
                          <span>{r.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* PHOTO CROP CONTROLS */}
                    {!isVideo && (
                      <div className="ig-crop-controls-section">
                        <div className="ig-crop-section-header">
                          <h4 className="ig-panel-heading" style={{ margin: 0 }}>
                            Crop & Zoom
                          </h4>
                          {(activeCrop.zoom > 1 ||
                            activeCrop.panX !== 0 ||
                            activeCrop.panY !== 0 ||
                            activeCrop.rotation !== 0 ||
                            isCropped ||
                            (activeCrop.customCropBox &&
                              (activeCrop.customCropBox.width < 99.5 ||
                                activeCrop.customCropBox.height < 99.5 ||
                                activeCrop.customCropBox.x > 0.5 ||
                                activeCrop.customCropBox.y > 0.5))) && (
                            <button
                              type="button"
                              className="ig-crop-reset-link"
                              onClick={handleResetCrop}
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="ig-crop-slider-row">
                          <div className="ig-slider-label-group">
                            <span className="ig-slider-title">Zoom</span>
                            <span className="ig-slider-val-badge">
                              {Math.round(activeCrop.zoom * 100)}%
                            </span>
                          </div>
                          <div className="ig-slider-input-container">
                            <ZoomOut size={14} className="slider-icon" />
                            <input
                              type="range"
                              min="1"
                              max="3"
                              step="0.05"
                              value={activeCrop.zoom}
                              onMouseDown={() => setShowGrid(true)}
                              onMouseUp={() => setShowGrid(false)}
                              onChange={(e) => handleZoomChange(e.target.value)}
                              className="ig-zoom-range-input"
                              aria-label="Zoom Level"
                            />
                            <ZoomIn size={14} className="slider-icon" />
                          </div>
                        </div>

                        <div className="ig-crop-actions-row">
                          <button
                            type="button"
                            className={`ig-crop-action-pill-btn ${isCustomCropActive ? 'active-crop-tool' : ''}`}
                            onClick={handleToggleCustomCrop}
                            title="Custom crop: drag corner brackets or edges freely"
                          >
                            <Crop size={14} />
                            <span>{isCustomCropActive ? 'Crop Active' : 'Custom Crop'}</span>
                          </button>
                          <button
                            type="button"
                            className="ig-crop-action-pill-btn"
                            onClick={handleRotate}
                            title="Rotate 90 degrees clockwise"
                          >
                            <RotateCw size={14} />
                            <span>Rotate 90°</span>
                          </button>
                          <button
                            type="button"
                            className="ig-crop-action-pill-btn"
                            onClick={handleResetCrop}
                            title="Reset crop and zoom"
                          >
                            <RotateCcw size={14} />
                            <span>Reset Crop</span>
                          </button>
                          <button
                            type="button"
                            className="ig-crop-action-pill-btn save-crop"
                            onClick={handleSaveCrop}
                            disabled={isSavingCrop}
                            title="Save current crop (✓)"
                          >
                            <Check size={14} strokeWidth={2.5} />
                            <span>Save Crop</span>
                          </button>
                        </div>

                        <p className="ig-crop-drag-hint">
                          {isCustomCropActive
                            ? '✨ Drag corner brackets or edges on the photo to customize crop size freely'
                            : '💡 Drag photo on canvas to reposition, or click "Custom Crop"'}
                        </p>
                      </div>
                    )}

                    {/* VIDEO DURATION TRIM CONTROLS */}
                    {isVideo && (
                      <div className="ig-video-trim-section">
                        <div className="ig-crop-section-header">
                          <h4
                            className="ig-panel-heading"
                            style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Scissors size={15} color="#0095f6" />
                            <span>Trim Story Duration</span>
                          </h4>
                          {(videoTrim.start > 0 || (videoTrim.end < videoTrim.duration && videoTrim.end > 0)) && (
                            <button
                              type="button"
                              className="ig-crop-reset-link"
                              onClick={handleResetVideoTrim}
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        {/* Duration summary badge */}
                        <div className="ig-trim-summary-badge">
                          <span className="ig-trim-time-range">
                            {formatTime(videoTrim.start)} – {formatTime(videoTrim.end || videoTrim.duration)}
                          </span>
                          <span className="ig-trim-duration-pill">
                            Length: {formatTime(Math.max(0, (videoTrim.end || videoTrim.duration) - videoTrim.start))}
                          </span>
                        </div>

                        {/* Dual Range Sliders for Start & End Time */}
                        <div className="ig-trim-slider-block">
                          <div className="ig-trim-row">
                            <div className="ig-trim-label">
                              <span>Start Trim</span>
                              <span className="ig-trim-val">{formatTime(videoTrim.start)}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={Math.max(1, (videoTrim.end || videoTrim.duration) - 1)}
                              step="1"
                              value={videoTrim.start}
                              onChange={(e) => handleTrimStartChange(Number(e.target.value))}
                              className="ig-trim-range-input"
                              aria-label="Story Start Time"
                            />
                          </div>

                          <div className="ig-trim-row">
                            <div className="ig-trim-label">
                              <span>End Trim</span>
                              <span className="ig-trim-val">{formatTime(videoTrim.end || videoTrim.duration)}</span>
                            </div>
                            <input
                              type="range"
                              min={(videoTrim.start || 0) + 1}
                              max={videoTrim.duration || 60}
                              step="1"
                              value={videoTrim.end || videoTrim.duration}
                              onChange={(e) => handleTrimEndChange(Number(e.target.value))}
                              className="ig-trim-range-input"
                              aria-label="Story End Time"
                            />
                          </div>
                        </div>

                        {/* Quick Duration Preset Pills */}
                        <div className="ig-trim-presets-row">
                          <button
                            type="button"
                            className={`ig-trim-preset-btn ${videoTrim.start === 0 && (videoTrim.end === videoTrim.duration || !videoTrim.end) ? 'active' : ''}`}
                            onClick={() => handleApplyVideoPreset(videoTrim.duration)}
                          >
                            Full
                          </button>
                          {videoTrim.duration > 15 && (
                            <button
                              type="button"
                              className={`ig-trim-preset-btn ${videoTrim.end - videoTrim.start === 15 ? 'active' : ''}`}
                              onClick={() => handleApplyVideoPreset(15)}
                            >
                              15s
                            </button>
                          )}
                          {videoTrim.duration > 30 && (
                            <button
                              type="button"
                              className={`ig-trim-preset-btn ${videoTrim.end - videoTrim.start === 30 ? 'active' : ''}`}
                              onClick={() => handleApplyVideoPreset(30)}
                            >
                              30s
                            </button>
                          )}
                          <button
                            type="button"
                            className="ig-trim-preset-btn save-trim"
                            onClick={handleSaveCrop}
                            disabled={isSavingCrop}
                            title="Save current video trim"
                          >
                            <Check size={12} strokeWidth={2.5} />
                            <span>Save Trim</span>
                          </button>
                        </div>

                        <p className="ig-crop-drag-hint">
                          ✂️ Story video will loop between {formatTime(videoTrim.start)} and{' '}
                          {formatTime(videoTrim.end || videoTrim.duration)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Filters */}
                {editTab === 'FILTERS' && (
                  <div className="ig-filters-gallery" style={{ padding: '14px' }}>
                    {INSTAGRAM_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`ig-filter-card ${selectedFilter === f.id ? 'active' : ''}`}
                        onClick={() => setSelectedFilter(f.id)}
                      >
                        <div className="ig-filter-thumb-box">
                          {isVideo ? (
                            <div className="ig-filter-thumb-video-fallback" style={{ filter: f.filter }}>
                              <Film size={20} />
                            </div>
                          ) : (
                            <img
                              src={previewUrl}
                              alt={f.name}
                              className="ig-filter-thumb-img"
                              style={{ filter: f.filter }}
                            />
                          )}
                        </div>
                        <span className="ig-filter-name">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tab 3: Stickers */}
                {editTab === 'STICKERS' && (
                  <div className="story-stickers-tab-pane">
                    <h4 className="ig-panel-heading" style={{ margin: '14px 14px 6px' }}>
                      Interactive Stickers
                    </h4>
                    <div className="story-stickers-grid">
                      {[
                        { type: 'question', label: 'Question', icon: HelpCircle },
                        { type: 'poll', label: 'Poll', icon: BarChart2 },
                        { type: 'quiz', label: 'Quiz', icon: QuizIcon },
                        { type: 'slider', label: 'Slider', icon: Flame },
                        { type: 'countdown', label: 'Countdown', icon: Clock },
                        { type: 'link', label: 'Link', icon: LinkIcon },
                        { type: 'location', label: 'Location', icon: MapPin },
                        { type: 'hashtag', label: 'Hashtag', icon: Hash },
                        { type: 'music', label: 'Music', icon: Music },
                      ].map(({ type, label, icon: Icon }) => {
                        const isActive = activeStickerType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setActiveStickerType(isActive ? 'none' : type)}
                            className={`story-sticker-card-btn ${isActive ? 'active' : ''}`}
                          >
                            <Icon size={18} />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Sticker Editor Form in Sidebar */}
                    <div className="story-sticker-config-form">
                      {activeStickerType === 'question' && (
                        <div className="sticker-input-group">
                          <label>Question Prompt</label>
                          <input
                            type="text"
                            value={questionPrompt}
                            onChange={(e) => setQuestionPrompt(e.target.value)}
                            placeholder="Ask me a question"
                            maxLength={150}
                            className="ig-details-input"
                          />
                        </div>
                      )}

                      {activeStickerType === 'poll' && (
                        <div className="sticker-input-group">
                          <label>Poll Question</label>
                          <input
                            type="text"
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            maxLength={150}
                            className="ig-details-input"
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <input
                              type="text"
                              value={pollOptionA}
                              onChange={(e) => setPollOptionA(e.target.value)}
                              placeholder="Option 1"
                              className="ig-details-input"
                            />
                            <input
                              type="text"
                              value={pollOptionB}
                              onChange={(e) => setPollOptionB(e.target.value)}
                              placeholder="Option 2"
                              className="ig-details-input"
                            />
                          </div>
                        </div>
                      )}

                      {activeStickerType === 'quiz' && (
                        <div className="sticker-input-group">
                          <label>Quiz Question & Options</label>
                          <input
                            type="text"
                            value={quizQuestion}
                            onChange={(e) => setQuizQuestion(e.target.value)}
                            placeholder="Guess the answer!"
                            maxLength={150}
                            className="ig-details-input"
                          />
                          <input
                            type="text"
                            value={quizOptionA}
                            onChange={(e) => setQuizOptionA(e.target.value)}
                            placeholder="Option A (Click to set correct)"
                            className={`ig-details-input ${quizCorrectIndex === 0 ? 'correct-input' : ''}`}
                            onClick={() => setQuizCorrectIndex(0)}
                            style={{ marginTop: '6px' }}
                          />
                          <input
                            type="text"
                            value={quizOptionB}
                            onChange={(e) => setQuizOptionB(e.target.value)}
                            placeholder="Option B"
                            className={`ig-details-input ${quizCorrectIndex === 1 ? 'correct-input' : ''}`}
                            onClick={() => setQuizCorrectIndex(1)}
                            style={{ marginTop: '6px' }}
                          />
                          <input
                            type="text"
                            value={quizOptionC}
                            onChange={(e) => setQuizOptionC(e.target.value)}
                            placeholder="Option C"
                            className={`ig-details-input ${quizCorrectIndex === 2 ? 'correct-input' : ''}`}
                            onClick={() => setQuizCorrectIndex(2)}
                            style={{ marginTop: '6px' }}
                          />
                        </div>
                      )}

                      {activeStickerType === 'slider' && (
                        <div className="sticker-input-group">
                          <label>Slider Question</label>
                          <input
                            type="text"
                            value={sliderQuestion}
                            onChange={(e) => setSliderQuestion(e.target.value)}
                            placeholder="How hot is this?"
                            maxLength={100}
                            className="ig-details-input"
                          />
                        </div>
                      )}

                      {activeStickerType === 'countdown' && (
                        <div className="sticker-input-group">
                          <label>Countdown Title</label>
                          <input
                            type="text"
                            value={countdownTitle}
                            onChange={(e) => setCountdownTitle(e.target.value)}
                            placeholder="Upcoming Event"
                            maxLength={100}
                            className="ig-details-input"
                          />
                          <label style={{ marginTop: '6px', display: 'block' }}>End Date & Time</label>
                          <input
                            type="datetime-local"
                            value={countdownDate}
                            onChange={(e) => setCountdownDate(e.target.value)}
                            className="ig-details-input"
                            style={{ marginTop: '4px' }}
                          />
                        </div>
                      )}

                      {activeStickerType === 'link' && (
                        <div className="sticker-input-group">
                          <label>URL Link</label>
                          <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="ig-details-input"
                          />
                          <input
                            type="text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            placeholder="Sticker text (optional)"
                            className="ig-details-input"
                            style={{ marginTop: '6px' }}
                          />
                        </div>
                      )}

                      {activeStickerType === 'location' && (
                        <div className="sticker-input-group">
                          <label>Location</label>
                          <input
                            type="text"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder="Add location (e.g. Mumbai, India)"
                            className="ig-details-input"
                          />
                        </div>
                      )}

                      {activeStickerType === 'hashtag' && (
                        <div className="sticker-input-group">
                          <label>Hashtag</label>
                          <input
                            type="text"
                            value={hashtagTag}
                            onChange={(e) => setHashtagTag(e.target.value)}
                            placeholder="#travel"
                            className="ig-details-input"
                          />
                        </div>
                      )}

                      {activeStickerType === 'music' && (
                        <div className="sticker-input-group">
                          <label>Song & Artist</label>
                          <input
                            type="text"
                            value={audioTitle}
                            onChange={(e) => setAudioTitle(e.target.value)}
                            placeholder="Song title..."
                            className="ig-details-input"
                          />
                          <input
                            type="text"
                            value={audioArtist}
                            onChange={(e) => setAudioArtist(e.target.value)}
                            placeholder="Artist name..."
                            className="ig-details-input"
                            style={{ marginTop: '6px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="story-sticky-footer">
              <button
                type="button"
                className="story-btn-cancel"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <div className="story-footer-actions">
                <button
                  type="button"
                  className="story-btn-close-friends"
                  disabled={loading}
                  onClick={async () => {
                    await doSubmit(true);
                  }}
                >
                  {loading && isCloseFriendsOnly ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Star size={16} fill="#fff" />
                      <span>Close Friends</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="story-btn-share"
                  disabled={loading}
                  onClick={async () => {
                    await doSubmit(false);
                  }}
                >
                  {loading && !isCloseFriendsOnly ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <span>Your Story</span>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateStoryModal;
