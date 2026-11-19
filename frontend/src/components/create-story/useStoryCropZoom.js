import { useState, useRef, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatTime, generateCroppedImage } from '../create-post';
import { STORY_ASPECT_RATIOS } from './StoryCropTab';

export const useStoryCropZoom = ({
  file,
  setFile,
  originalFile,
  previewUrl,
  setPreviewUrl,
  originalPreviewUrl,
  setIsCropped,
  showSuccess: customShowSuccess,
  showError: customShowError,
} = {}) => {
  const toast = useToast();
  const showSuccess = customShowSuccess || toast?.showSuccess || console.log;
  const showError = customShowError || toast?.showError || console.error;

  const isVideo = Boolean(file?.type?.startsWith('video/'));

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

  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });
  const imageStageRef = useRef(null);
  const imgElementRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // Video metadata loaded
  const handleVideoMetadataLoaded = useCallback(
    (e) => {
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
    },
    [videoDuration]
  );

  // Looping constraint in video
  const handleVideoTimeUpdate = useCallback(
    (e) => {
      const cur = e.target.currentTime;
      setEditVideoCurrentTime(cur);
      const start = videoTrim.start || 0;
      const end = videoTrim.end || videoDuration || 15;
      if (cur >= end) {
        e.target.currentTime = start;
      }
    },
    [videoTrim, videoDuration]
  );

  const handleToggleEditVideoPlay = useCallback(
    (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (!videoPreviewRef.current) return;
      if (isEditVideoPlaying) {
        videoPreviewRef.current.pause();
        setIsEditVideoPlaying(false);
      } else {
        const start = videoTrim.start || 0;
        const end = videoTrim.end || videoDuration || 15;
        if (
          videoPreviewRef.current.currentTime < start ||
          videoPreviewRef.current.currentTime >= end
        ) {
          videoPreviewRef.current.currentTime = start;
        }
        videoPreviewRef.current
          .play()
          .then(() => setIsEditVideoPlaying(true))
          .catch(() => {});
      }
    },
    [isEditVideoPlaying, videoTrim, videoDuration]
  );

  const handleToggleEditVideoMute = useCallback(
    (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (!videoPreviewRef.current) return;
      const next = !isEditVideoMuted;
      videoPreviewRef.current.muted = next;
      setIsEditVideoMuted(next);
    },
    [isEditVideoMuted]
  );

  // Video Trim Handlers
  const handleTrimStartChange = useCallback(
    (val) => {
      const dur = videoTrim.duration || videoDuration || 15;
      const curEnd = videoTrim.end || dur;
      const maxStart = Math.max(0, curEnd - 1);
      const nextStart = Math.min(val, maxStart);
      setVideoTrim((prev) => ({ ...prev, start: nextStart }));
      if (videoPreviewRef.current) {
        videoPreviewRef.current.currentTime = nextStart;
      }
    },
    [videoTrim, videoDuration]
  );

  const handleTrimEndChange = useCallback(
    (val) => {
      const curStart = videoTrim.start || 0;
      const minEnd = curStart + 1;
      const nextEnd = Math.max(val, minEnd);
      setVideoTrim((prev) => ({ ...prev, end: nextEnd }));
      if (videoPreviewRef.current) {
        videoPreviewRef.current.currentTime = nextEnd;
      }
    },
    [videoTrim]
  );

  const handleApplyVideoPreset = useCallback(
    (seconds) => {
      const dur = videoTrim.duration || videoDuration || 15;
      if (seconds >= dur) {
        setVideoTrim((prev) => ({ ...prev, start: 0, end: dur }));
        if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
      } else {
        setVideoTrim((prev) => ({ ...prev, start: 0, end: seconds }));
        if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
      }
    },
    [videoTrim, videoDuration]
  );

  const handleResetVideoTrim = useCallback(() => {
    const dur = videoDuration || 15;
    setVideoTrim({ start: 0, end: dur, duration: dur, coverTime: 0 });
    setSelectedRatio(STORY_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');
    if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    showSuccess('Story trim reset to original.');
  }, [videoDuration, showSuccess]);

  // Photo Panning & Zoom Handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (isVideo || isCustomCropActive) return;
      setIsDragging(true);
      setShowGrid(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: activeCrop.panX || 0,
        initialPanY: activeCrop.panY || 0,
      };
    },
    [isVideo, isCustomCropActive, activeCrop]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || isVideo || isCustomCropActive) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setActiveCrop((prev) => ({
        ...prev,
        panX: Math.round(dragStartRef.current.initialPanX + deltaX),
        panY: Math.round(dragStartRef.current.initialPanY + deltaY),
      }));
    },
    [isDragging, isVideo, isCustomCropActive]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setShowGrid(false);
  }, []);

  const handleWheel = useCallback(
    (e) => {
      if (isVideo || isCustomCropActive) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setActiveCrop((prev) => ({
        ...prev,
        zoom: Math.max(1, Math.min(3, Math.round((prev.zoom + delta) * 100) / 100)),
      }));
    },
    [isVideo, isCustomCropActive]
  );

  const handleZoomChange = useCallback((val) => {
    setActiveCrop((prev) => ({ ...prev, zoom: parseFloat(val) }));
  }, []);

  const handleRotate = useCallback(() => {
    setActiveCrop((prev) => ({
      ...prev,
      rotation: ((prev.rotation || 0) + 90) % 360,
    }));
  }, []);

  const handleToggleCustomCrop = useCallback(() => {
    setIsCustomCropActive((prev) => {
      const next = !prev;
      if (next) {
        setSelectedRatio(
          STORY_ASPECT_RATIOS.find((r) => r.id === 'CUSTOM') || STORY_ASPECT_RATIOS[0]
        );
        if (!activeCrop.customCropBox || activeCrop.customCropBox.width === 100) {
          setActiveCrop((c) => ({
            ...c,
            customCropBox: { x: 5, y: 5, width: 90, height: 90 },
          }));
        }
      }
      return next;
    });
  }, [activeCrop]);

  // Custom Crop Box Dragging & Resizing
  const handleStartBoxDrag = useCallback(
    (e, action) => {
      e.stopPropagation();
      e.preventDefault();
      setShowGrid(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const stage = imageStageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const startBox = {
        ...(activeCrop.customCropBox || { x: 5, y: 5, width: 90, height: 90 }),
      };

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
            const nextX = Math.max(
              0,
              Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent)
            );
            const nextY = Math.max(
              0,
              Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent)
            );
            width = startBox.width - (nextX - startBox.x);
            height = startBox.height - (nextY - startBox.y);
            x = nextX;
            y = nextY;
            break;
          }
          case 'resize-ne': {
            const nextY = Math.max(
              0,
              Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent)
            );
            width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
            height = startBox.height - (nextY - startBox.y);
            y = nextY;
            break;
          }
          case 'resize-sw': {
            const nextX = Math.max(
              0,
              Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent)
            );
            width = startBox.width - (nextX - startBox.x);
            height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
            x = nextX;
            break;
          }
          case 'resize-n': {
            const nextY = Math.max(
              0,
              Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent)
            );
            height = startBox.height - (nextY - startBox.y);
            y = nextY;
            break;
          }
          case 'resize-s':
            height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
            break;
          case 'resize-w': {
            const nextX = Math.max(
              0,
              Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent)
            );
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
    },
    [activeCrop]
  );

  // Immediate Save & Commit for Crop or Video Trim (Right Tick Button)
  const handleSaveCrop = useCallback(async () => {
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
          if (setFile) setFile(croppedFile);
          if (setPreviewUrl) setPreviewUrl(newPreview);
          if (setIsCropped) setIsCropped(true);
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
  }, [
    file,
    originalFile,
    previewUrl,
    originalPreviewUrl,
    activeCrop,
    selectedRatio,
    videoTrim,
    videoDuration,
    setFile,
    setPreviewUrl,
    setIsCropped,
    showSuccess,
    showError,
  ]);

  const handleResetCrop = useCallback(() => {
    if (file?.type?.startsWith('video/')) {
      handleResetVideoTrim();
    } else {
      if (setFile) setFile(originalFile || file);
      if (setPreviewUrl) setPreviewUrl(originalPreviewUrl || previewUrl);
      if (setIsCropped) setIsCropped(false);
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
  }, [
    file,
    originalFile,
    previewUrl,
    originalPreviewUrl,
    handleResetVideoTrim,
    setFile,
    setPreviewUrl,
    setIsCropped,
    showSuccess,
  ]);

  const resetCropZoomState = useCallback(() => {
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
  }, []);

  const customBox = activeCrop.customCropBox || { x: 5, y: 5, width: 90, height: 90 };

  return {
    selectedRatio,
    setSelectedRatio,
    selectedFilter,
    setSelectedFilter,
    editTab,
    setEditTab,
    activeCrop,
    setActiveCrop,
    isCustomCropActive,
    setIsCustomCropActive,
    isDragging,
    setIsDragging,
    showGrid,
    setShowGrid,
    videoDuration,
    setVideoDuration,
    videoTrim,
    setVideoTrim,
    filmstripFrames,
    setFilmstripFrames,
    editVideoCurrentTime,
    setEditVideoCurrentTime,
    isEditVideoPlaying,
    setIsEditVideoPlaying,
    isEditVideoMuted,
    setIsEditVideoMuted,
    isSavingCrop,
    setIsSavingCrop,
    cropSavedToast,
    setCropSavedToast,
    customBox,
    dragStartRef,
    imageStageRef,
    imgElementRef,
    videoPreviewRef,
    handleVideoMetadataLoaded,
    handleVideoTimeUpdate,
    handleToggleEditVideoPlay,
    handleToggleEditVideoMute,
    handleTrimStartChange,
    handleTrimEndChange,
    handleApplyVideoPreset,
    handleResetVideoTrim,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleZoomChange,
    handleRotate,
    handleToggleCustomCrop,
    handleStartBoxDrag,
    handleSaveCrop,
    handleResetCrop,
    resetCropZoomState,
  };
};

export default useStoryCropZoom;
