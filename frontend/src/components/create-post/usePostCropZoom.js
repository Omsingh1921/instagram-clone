import { useState, useRef, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { ASPECT_RATIOS } from '../../utils/instagramFilters';
import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  generateCroppedImage,
} from './videoUtils';

export const usePostCropZoom = ({
  activeItem,
  activeCrop,
  isVideo,
  updateActiveCrop,
  updateActiveVideoTrim,
  mediaItems,
  setMediaItems,
  activeMediaIdx,
  showSuccess: customShowSuccess,
  showError: customShowError,
} = {}) => {
  const toast = useToast();
  const showSuccess = customShowSuccess || toast?.showSuccess || console.log;
  const showError = customShowError || toast?.showError || console.error;

  // Aspect ratio state
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[1]); // Default 1:1

  // Active edit tab: 'FILTERS' | 'RATIO'
  const [editTab, setEditTab] = useState('FILTERS');

  // Interactive Crop & Zoom states
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [processingCrop, setProcessingCrop] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [cropSavedToast, setCropSavedToast] = useState(false);
  const [isCustomCropActive, setIsCustomCropActive] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });
  const imageStageRef = useRef(null);
  const imgElementRef = useRef(null);
  const videoPlayerRef = useRef(null);

  // Edit Step Video Playback & Trimmer states
  const [editVideoCurrentTime, setEditVideoCurrentTime] = useState(0);
  const [isEditVideoPlaying, setIsEditVideoPlaying] = useState(false);
  const [isEditVideoMuted, setIsEditVideoMuted] = useState(false);

  // Mouse & Touch Pan Handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (isVideo) return;
      setIsDragging(true);
      setShowGrid(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: activeCrop?.panX || 0,
        initialPanY: activeCrop?.panY || 0,
      };
    },
    [isVideo, activeCrop]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const zoom = activeCrop?.zoom || 1;
      const maxBound = (zoom - 0.9) * 220 + 80;
      const nextX = Math.max(
        -maxBound,
        Math.min(maxBound, dragStartRef.current.initialPanX + deltaX)
      );
      const nextY = Math.max(
        -maxBound,
        Math.min(maxBound, dragStartRef.current.initialPanY + deltaY)
      );
      updateActiveCrop({ panX: nextX, panY: nextY });
    },
    [isDragging, activeCrop, updateActiveCrop]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setShowGrid(false);
    }
  }, [isDragging]);

  // Wheel Zoom Handler
  const handleWheel = useCallback(
    (e) => {
      if (isVideo) return;
      e.preventDefault();
      const currentZ = activeCrop?.zoom || 1;
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      const nextZ = Math.min(3, Math.max(1, Math.round((currentZ + delta) * 100) / 100));
      setShowGrid(true);
      updateActiveCrop({ zoom: nextZ });
      setTimeout(() => setShowGrid(false), 400);
    },
    [isVideo, activeCrop, updateActiveCrop]
  );

  const handleZoomChange = useCallback(
    (val) => {
      const nextZoom = parseFloat(val);
      updateActiveCrop({ zoom: nextZoom });
    },
    [updateActiveCrop]
  );

  const handleRotate = useCallback(() => {
    const curRot = activeCrop?.rotation || 0;
    updateActiveCrop({ rotation: (curRot + 90) % 360 });
  }, [activeCrop, updateActiveCrop]);

  const handleStartBoxDrag = useCallback(
    (e, actionType) => {
      e.preventDefault();
      e.stopPropagation();
      if (isVideo) return;

      const stage = imageStageRef.current;
      if (!stage) return;
      const stageRect = stage.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height) return;

      setShowGrid(true);

      const currentBox = activeCrop?.customCropBox || { x: 5, y: 5, width: 90, height: 90 };
      const startPointer = { x: e.clientX, y: e.clientY };
      const startBox = { ...currentBox };

      const onPointerMove = (moveEvent) => {
        moveEvent.preventDefault();
        const deltaXPercent =
          ((moveEvent.clientX - startPointer.x) / stageRect.width) * 100;
        const deltaYPercent =
          ((moveEvent.clientY - startPointer.y) / stageRect.height) * 100;

        let { x, y, width, height } = startBox;

        switch (actionType) {
          case 'move': {
            x = Math.max(0, Math.min(100 - width, startBox.x + deltaXPercent));
            y = Math.max(0, Math.min(100 - height, startBox.y + deltaYPercent));
            break;
          }
          case 'resize-se': {
            width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
            height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
            break;
          }
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
          case 'resize-s': {
            height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
            break;
          }
          case 'resize-w': {
            const nextX = Math.max(
              0,
              Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent)
            );
            width = startBox.width - (nextX - startBox.x);
            x = nextX;
            break;
          }
          case 'resize-e': {
            width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
            break;
          }
          default:
            break;
        }

        updateActiveCrop({
          customCropBox: {
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10,
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10,
          },
        });
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
    [isVideo, activeCrop, updateActiveCrop]
  );

  const handleToggleCustomCrop = useCallback(() => {
    setIsCustomCropActive((prev) => {
      const next = !prev;
      if (next && (!activeCrop?.customCropBox || activeCrop.customCropBox.width === 100)) {
        updateActiveCrop({
          customCropBox: { x: 5, y: 5, width: 90, height: 90 },
        });
      }
      return next;
    });
  }, [activeCrop, updateActiveCrop]);

  const handleSelectRatio = useCallback(
    (ratio) => {
      setSelectedRatio(ratio);
      if (ratio.id === 'CUSTOM') {
        setIsCustomCropActive(true);
        if (!activeCrop?.customCropBox || activeCrop.customCropBox.width === 100) {
          updateActiveCrop({
            customCropBox: { x: 5, y: 5, width: 90, height: 90 },
          });
        }
      }
    },
    [activeCrop, updateActiveCrop]
  );

  const handleResetCrop = useCallback(() => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? {
              ...item,
              file: item.originalFile || item.file,
              previewUrl: item.originalPreviewUrl || item.previewUrl,
              isCropped: false,
              crop: {
                zoom: 1,
                panX: 0,
                panY: 0,
                rotation: 0,
                customCropBox: { x: 0, y: 0, width: 100, height: 100 },
              },
            }
          : item
      )
    );
    setIsCustomCropActive(false);
    showSuccess('Crop reset to original.');
  }, [activeMediaIdx, setMediaItems, showSuccess]);

  // Immediate Save & Commit for Crop or Video Trim (Right Tick Button)
  const handleSaveCrop = useCallback(async () => {
    if (!activeItem) return;
    setIsSavingCrop(true);
    try {
      if (activeItem.file.type.startsWith('video/')) {
        const trim = activeItem.videoTrim || {
          start: 0,
          end: activeItem.duration || 60,
          duration: activeItem.duration || 60,
          coverTime: 0,
        };
        const trimmedDuration = Math.max(1, (trim.end || trim.duration) - (trim.start || 0));
        let thumb = activeItem.thumbnailUrl;
        if (!thumb || !thumb.startsWith('data:image')) {
          const res = await extractVideoThumbnail(
            activeItem.originalFile || activeItem.file,
            trim.coverTime || trim.start || 0.5
          );
          if (res?.thumbnailUrl) thumb = res.thumbnailUrl;
        }
        setMediaItems((prev) =>
          prev.map((item, idx) =>
            idx === activeMediaIdx
              ? {
                  ...item,
                  thumbnailUrl: thumb,
                  trimmedDuration,
                  isTrimmed: true,
                }
              : item
          )
        );
        showSuccess(
          `Video trim saved! (${formatTime(trim.start)} – ${formatTime(
            trim.end || trim.duration
          )}) ✓`
        );
      } else {
        const croppedFile = await generateCroppedImage(activeItem, selectedRatio);
        if (croppedFile) {
          const newPreview = URL.createObjectURL(croppedFile);
          setMediaItems((prev) =>
            prev.map((item, idx) =>
              idx === activeMediaIdx
                ? {
                    ...item,
                    file: croppedFile,
                    previewUrl: newPreview,
                    isCropped: true,
                    crop: {
                      zoom: 1,
                      panX: 0,
                      panY: 0,
                      rotation: 0,
                      customCropBox: { x: 0, y: 0, width: 100, height: 100 },
                    },
                  }
                : item
            )
          );
          setIsCustomCropActive(false);
          showSuccess('Crop applied & saved! ✓');
        } else {
          showSuccess('Crop saved! ✓');
        }
      }
      setCropSavedToast(true);
      setTimeout(() => setCropSavedToast(false), 2400);
    } catch (err) {
      console.error('Failed to save crop:', err);
      showError('Failed to save crop. Please try again.');
    } finally {
      setIsSavingCrop(false);
    }
  }, [
    activeItem,
    selectedRatio,
    activeMediaIdx,
    setMediaItems,
    showSuccess,
    showError,
  ]);

  // Video Duration Trimming & Playback Sync
  const handleToggleEditVideoPlay = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (!videoPlayerRef.current) return;
      if (isEditVideoPlaying) {
        videoPlayerRef.current.pause();
        setIsEditVideoPlaying(false);
      } else {
        const { start, end } = activeItem?.videoTrim || { start: 0, end: 15 };
        if (
          videoPlayerRef.current.currentTime >= end ||
          videoPlayerRef.current.currentTime < start
        ) {
          videoPlayerRef.current.currentTime = start;
        }
        videoPlayerRef.current
          .play()
          .then(() => setIsEditVideoPlaying(true))
          .catch(() => {});
      }
    },
    [isEditVideoPlaying, activeItem]
  );

  const handleToggleEditVideoMute = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (!videoPlayerRef.current) return;
      videoPlayerRef.current.muted = !isEditVideoMuted;
      setIsEditVideoMuted(!isEditVideoMuted);
    },
    [isEditVideoMuted]
  );

  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoPlayerRef.current || !activeItem?.videoTrim) return;
    const cur = videoPlayerRef.current.currentTime;
    setEditVideoCurrentTime(cur);
    const { start, end } = activeItem.videoTrim;
    if (end > 0 && cur >= end) {
      videoPlayerRef.current.currentTime = start || 0;
      setEditVideoCurrentTime(start || 0);
      videoPlayerRef.current.play().catch(() => {});
    }
  }, [activeItem]);

  const handleVideoMetadataLoaded = useCallback(
    (e) => {
      const v = e.target;
      const dur = Math.floor(v.duration) || 0;
      if (dur > 0) {
        updateActiveVideoTrim({
          duration: dur,
          start: activeItem?.videoTrim?.start || 0,
          end: activeItem?.videoTrim?.end || dur,
        });

        if (!activeItem?.filmstripFrames || activeItem.filmstripFrames.length === 0) {
          extractFilmstripFrames(activeItem.originalFile || activeItem.file, dur, 8).then(
            (frames) => {
              if (frames && frames.length > 0) {
                setMediaItems((prev) =>
                  prev.map((item, idx) =>
                    idx === activeMediaIdx ? { ...item, filmstripFrames: frames } : item
                  )
                );
              }
            }
          );
        }
      }

      // Capture crisp poster thumbnail from active video element immediately
      try {
        if (v.videoWidth && v.videoHeight) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(v.videoWidth, 480);
          const aspect = v.videoWidth / v.videoHeight;
          canvas.height = Math.round(canvas.width / aspect);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (dataUrl && dataUrl.startsWith('data:image') && dataUrl.length > 50) {
              setMediaItems((prev) =>
                prev.map((item, idx) =>
                  idx === activeMediaIdx ? { ...item, thumbnailUrl: dataUrl } : item
                )
              );
            }
          }
        }
      } catch (err) {
        console.warn('Direct video frame capture fallback:', err);
      }
    },
    [activeItem, activeMediaIdx, updateActiveVideoTrim, setMediaItems]
  );

  const handleTrimStartChange = useCallback(
    (val) => {
      const dur = activeItem?.videoTrim?.duration || 60;
      const curEnd = activeItem?.videoTrim?.end || dur;
      const maxStart = Math.max(0, curEnd - 1);
      const nextStart = Math.min(val, maxStart);
      updateActiveVideoTrim({ start: nextStart });
      if (videoPlayerRef.current) {
        videoPlayerRef.current.currentTime = nextStart;
      }
    },
    [activeItem, updateActiveVideoTrim]
  );

  const handleTrimEndChange = useCallback(
    (val) => {
      const curStart = activeItem?.videoTrim?.start || 0;
      const minEnd = curStart + 1;
      const nextEnd = Math.max(val, minEnd);
      updateActiveVideoTrim({ end: nextEnd });
      if (videoPlayerRef.current) {
        videoPlayerRef.current.currentTime = nextEnd;
      }
    },
    [activeItem, updateActiveVideoTrim]
  );

  const handleCoverTimeChange = useCallback(
    (val) => {
      updateActiveVideoTrim({ coverTime: val });
      if (videoPlayerRef.current) {
        const v = videoPlayerRef.current;
        v.currentTime = val;
        const onSeekedCapture = () => {
          try {
            if (v.videoWidth && v.videoHeight) {
              const canvas = document.createElement('canvas');
              canvas.width = Math.min(v.videoWidth, 480);
              const aspect = v.videoWidth / v.videoHeight;
              canvas.height = Math.round(canvas.width / aspect);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                if (dataUrl && dataUrl.startsWith('data:image') && dataUrl.length > 50) {
                  setMediaItems((prev) =>
                    prev.map((item, idx) =>
                      idx === activeMediaIdx ? { ...item, thumbnailUrl: dataUrl } : item
                    )
                  );
                }
              }
            }
          } catch (err) {
            console.warn('Cover frame capture fallback:', err);
          } finally {
            v.removeEventListener('seeked', onSeekedCapture);
          }
        };
        v.addEventListener('seeked', onSeekedCapture, { once: true });
      }
      extractVideoThumbnail(activeItem.originalFile || activeItem.file, val).then((res) => {
        if (res?.thumbnailUrl && res.thumbnailUrl.startsWith('data:image')) {
          setMediaItems((prev) =>
            prev.map((item, idx) =>
              idx === activeMediaIdx ? { ...item, thumbnailUrl: res.thumbnailUrl } : item
            )
          );
        }
      });
    },
    [activeItem, activeMediaIdx, updateActiveVideoTrim, setMediaItems]
  );

  const handleApplyVideoPreset = useCallback(
    (seconds) => {
      const dur = activeItem?.videoTrim?.duration || 60;
      if (seconds >= dur) {
        updateActiveVideoTrim({ start: 0, end: dur });
        if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
      } else {
        updateActiveVideoTrim({ start: 0, end: seconds });
        if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
      }
    },
    [activeItem, updateActiveVideoTrim]
  );

  const handleResetVideoTrim = useCallback(() => {
    const dur = activeItem?.videoTrim?.duration || 60;
    updateActiveVideoTrim({ start: 0, end: dur, coverTime: 0 });
    if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
  }, [activeItem, updateActiveVideoTrim]);

  // Proceed to Details with Crop Rendering
  const handleProceedToDetails = useCallback(
    async (onProceed) => {
      setProcessingCrop(true);
      try {
        const updatedMedia = await Promise.all(
          mediaItems.map(async (item) => {
            if (item.file.type.startsWith('video/')) {
              const trim = item.videoTrim || {
                start: 0,
                end: item.duration || 60,
                duration: item.duration || 60,
                coverTime: 0,
              };
              const trimmedDuration = Math.max(1, (trim.end || trim.duration) - (trim.start || 0));
              let thumb = item.thumbnailUrl;
              if (!thumb || !thumb.startsWith('data:image')) {
                const res = await extractVideoThumbnail(
                  item.originalFile || item.file,
                  trim.coverTime || trim.start || 0.5
                );
                if (res?.thumbnailUrl) thumb = res.thumbnailUrl;
              }
              return {
                ...item,
                thumbnailUrl: thumb,
                trimmedDuration,
                isTrimmed:
                  trim.start > 0 ||
                  (trim.end > 0 && trim.end < trim.duration) ||
                  item.isTrimmed,
              };
            }
            if (item.isCropped) {
              return item;
            }
            const croppedFile = await generateCroppedImage(item, selectedRatio);
            if (croppedFile) {
              const newPreview = URL.createObjectURL(croppedFile);
              return {
                ...item,
                file: croppedFile,
                previewUrl: newPreview,
                isCropped: true,
              };
            }
            return item;
          })
        );
        setMediaItems(updatedMedia);
        if (onProceed) onProceed();
      } catch (err) {
        console.error('Failed to crop media:', err);
        if (onProceed) onProceed();
      } finally {
        setProcessingCrop(false);
      }
    },
    [mediaItems, selectedRatio, setMediaItems]
  );

  const resetCropZoomState = useCallback(() => {
    setSelectedRatio(ASPECT_RATIOS[1]);
    setEditTab('FILTERS');
    setShowRatioMenu(false);
    setShowZoomMenu(false);
    setShowGrid(false);
    setIsDragging(false);
    setIsCustomCropActive(false);
    setProcessingCrop(false);
    setIsSavingCrop(false);
    setCropSavedToast(false);
    setEditVideoCurrentTime(0);
    setIsEditVideoPlaying(false);
    setIsEditVideoMuted(false);
  }, []);

  return {
    selectedRatio,
    setSelectedRatio,
    editTab,
    setEditTab,
    isDragging,
    setIsDragging,
    showGrid,
    setShowGrid,
    showRatioMenu,
    setShowRatioMenu,
    showZoomMenu,
    setShowZoomMenu,
    processingCrop,
    setProcessingCrop,
    isSavingCrop,
    setIsSavingCrop,
    cropSavedToast,
    setCropSavedToast,
    isCustomCropActive,
    setIsCustomCropActive,
    dragStartRef,
    imageStageRef,
    imgElementRef,
    videoPlayerRef,
    editVideoCurrentTime,
    setEditVideoCurrentTime,
    isEditVideoPlaying,
    setIsEditVideoPlaying,
    isEditVideoMuted,
    setIsEditVideoMuted,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleZoomChange,
    handleRotate,
    handleStartBoxDrag,
    handleToggleCustomCrop,
    handleSelectRatio,
    handleResetCrop,
    handleSaveCrop,
    handleToggleEditVideoPlay,
    handleToggleEditVideoMute,
    handleVideoTimeUpdate,
    handleVideoMetadataLoaded,
    handleTrimStartChange,
    handleTrimEndChange,
    handleCoverTimeChange,
    handleApplyVideoPreset,
    handleResetVideoTrim,
    handleProceedToDetails,
    resetCropZoomState,
  };
};

export default usePostCropZoom;
