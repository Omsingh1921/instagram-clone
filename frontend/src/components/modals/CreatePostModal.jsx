import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
} from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import postService from '../../services/post.service';
import userService from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import { ASPECT_RATIOS } from '../../utils/instagramFilters';
import './CreatePostModal.css';

import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  generateCroppedImage,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
  PostUploadStep,
  PostCanvasPreview,
  PostEditSidebar,
  PostDetailsStep,
  POPULAR_LOCATIONS,
} from '../create-post';

export {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  generateCroppedImage,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
  PostUploadStep,
  PostCanvasPreview,
  PostEditSidebar,
  PostDetailsStep,
  POPULAR_LOCATIONS,
};

const WIZARD_STEPS = {
  UPLOAD: 'UPLOAD',
  EDIT: 'EDIT', // Crop, filters, aspect ratio
  DETAILS: 'DETAILS', // Caption, tags, location, alt-text, settings
};

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [currentStep, setCurrentStep] = useState(WIZARD_STEPS.UPLOAD);

  // Multi-media Carousel state: array of { file, previewUrl, filterName, altText, tags: [] }
  const [mediaItems, setMediaItems] = useState([]);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  // Aspect ratio state
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[1]); // Default 1:1

  // Active edit tab: 'FILTERS' | 'RATIO'
  const [editTab, setEditTab] = useState('FILTERS');

  // Details step states
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAltTextSection, setShowAltTextSection] = useState(false);

  // Tagging states for active media
  const [taggingPos, setTaggingPos] = useState(null); // { xPercent, yPercent }
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Collaborator state
  const [collaborator, setCollaborator] = useState(null);
  const [collabQuery, setCollabQuery] = useState('');
  const [collabResults, setCollabResults] = useState([]);
  const [showCollabSearch, setShowCollabSearch] = useState(false);

  // Drag & drop and loading
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

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

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);
  const imagePreviewRef = useRef(null);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();

  const resetForm = (keepThumbnailUrl = null, preserveObjectUrls = false) => {
    // Revoke object URLs unless handing off to background uploader
    if (!preserveObjectUrls) {
      mediaItems.forEach((item) => {
        if (item.previewUrl && item.previewUrl !== keepThumbnailUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.originalPreviewUrl && item.originalPreviewUrl !== item.previewUrl && item.originalPreviewUrl !== keepThumbnailUrl) {
          URL.revokeObjectURL(item.originalPreviewUrl);
        }
      });
    }
    setMediaItems([]);
    setActiveMediaIdx(0);
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
    setCaption('');
    setLocation('');
    setCommentsDisabled(false);
    setHideLikeCount(false);
    setVisibility('PUBLIC');
    setShowAdvanced(false);
    setShowAltTextSection(false);
    setTaggingPos(null);
    setUserSearchQuery('');
    setUserSearchResults([]);
    setCollaborator(null);
    setCollabQuery('');
    setCollabResults([]);
    setShowCollabSearch(false);
    setLoading(false);
    setIsDragOver(false);
    setCurrentStep(WIZARD_STEPS.UPLOAD);
  };

  const handleClose = (keepThumbnailUrl = null, preserveObjectUrls = false) => {
    resetForm(keepThumbnailUrl, preserveObjectUrls);
    onClose();
  };

  // Add files to mediaItems (up to 10)
  const handleFilesAdded = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const incoming = Array.from(filesList);

    const validFiles = incoming.filter((f) => {
      const isImg = f.type.startsWith('image/');
      const isVid = f.type.startsWith('video/');
      if (!isImg && !isVid) {
        showError(`${f.name} is not an image or video file.`);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        showError(`${f.name} exceeds 50MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (mediaItems.length + validFiles.length > 10) {
      showError('You can only select up to 10 media items for a carousel.');
    }

    const availableSlots = 10 - mediaItems.length;
    const toAdd = validFiles.slice(0, availableSlots).map((file) => {
      const url = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video/');
      return {
        file,
        originalFile: file,
        originalPreviewUrl: url,
        previewUrl: url,
        thumbnailUrl: isVid ? null : url,
        duration: isVid ? 60 : 0,
        filterName: 'NORMAL',
        altText: '',
        tags: [],
        crop: {
          zoom: 1,
          panX: 0,
          panY: 0,
          rotation: 0,
          customCropBox: { x: 0, y: 0, width: 100, height: 100 },
        },
        videoTrim: isVid ? { start: 0, end: 60, duration: 60, coverTime: 0 } : null,
        filmstripFrames: [],
      };
    });

    setMediaItems((prev) => [...prev, ...toAdd]);
    if (currentStep === WIZARD_STEPS.UPLOAD) {
      setCurrentStep(WIZARD_STEPS.EDIT);
    }

    // Asynchronously extract poster frame thumbnail and duration for video files
    toAdd.forEach(async (item) => {
      if (item.file.type.startsWith('video/')) {
        const info = await extractVideoThumbnail(item.file, 0.5);
        const dur = info?.duration || 60;
        const frames = await extractFilmstripFrames(item.file, dur, 8);
        if (info) {
          setMediaItems((prev) =>
            prev.map((m) =>
              m.file === item.file
                ? {
                    ...m,
                    thumbnailUrl: info.thumbnailUrl,
                    duration: dur,
                    filmstripFrames: frames,
                    videoTrim: {
                      start: 0,
                      end: dur,
                      duration: dur,
                      coverTime: 0,
                    },
                  }
                : m
            )
          );
        }
      }
    });
  };

  const handleRemoveMedia = (index) => {
    if (mediaItems.length <= 1) {
      resetForm();
      return;
    }
    const itemToRemove = mediaItems[index];
    if (itemToRemove?.previewUrl) URL.revokeObjectURL(itemToRemove.previewUrl);
    if (itemToRemove?.originalPreviewUrl && itemToRemove.originalPreviewUrl !== itemToRemove.previewUrl) {
      URL.revokeObjectURL(itemToRemove.originalPreviewUrl);
    }

    const updated = mediaItems.filter((_, i) => i !== index);
    setMediaItems(updated);
    if (activeMediaIdx >= updated.length) {
      setActiveMediaIdx(updated.length - 1);
    }
  };

  // Active crop helper
  const updateActiveCrop = (updates) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? {
              ...item,
              crop: {
                ...(item.crop || { zoom: 1, panX: 0, panY: 0, rotation: 0 }),
                ...updates,
              },
            }
          : item
      )
    );
  };

  // Mouse & Touch Pan Handlers
  const handleMouseDown = (e) => {
    if (isVideo) return;
    setIsDragging(true);
    setShowGrid(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: activeCrop.panX,
      initialPanY: activeCrop.panY,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const maxBound = (activeCrop.zoom - 0.9) * 220 + 80;
    const nextX = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initialPanX + deltaX));
    const nextY = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initialPanY + deltaY));
    updateActiveCrop({ panX: nextX, panY: nextY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setShowGrid(false);
    }
  };

  // Wheel Zoom Handler
  const handleWheel = (e) => {
    if (isVideo) return;
    e.preventDefault();
    const currentZ = activeCrop.zoom || 1;
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZ = Math.min(3, Math.max(1, Math.round((currentZ + delta) * 100) / 100));
    setShowGrid(true);
    updateActiveCrop({ zoom: nextZ });
    setTimeout(() => setShowGrid(false), 400);
  };

  const handleZoomChange = (val) => {
    const nextZoom = parseFloat(val);
    updateActiveCrop({ zoom: nextZoom });
  };

  const handleRotate = () => {
    const curRot = activeCrop.rotation || 0;
    updateActiveCrop({ rotation: (curRot + 90) % 360 });
  };

  const handleStartBoxDrag = (e, actionType) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVideo) return;

    const stage = imageStageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return;

    setShowGrid(true);

    const currentBox = activeCrop.customCropBox || { x: 5, y: 5, width: 90, height: 90 };
    const startPointer = { x: e.clientX, y: e.clientY };
    const startBox = { ...currentBox };

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaXPercent = ((moveEvent.clientX - startPointer.x) / stageRect.width) * 100;
      const deltaYPercent = ((moveEvent.clientY - startPointer.y) / stageRect.height) * 100;

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
        case 'resize-s': {
          height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
          break;
        }
        case 'resize-w': {
          const nextX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent));
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
  };

  const handleToggleCustomCrop = () => {
    setIsCustomCropActive((prev) => {
      const next = !prev;
      if (next && (!activeCrop.customCropBox || activeCrop.customCropBox.width === 100)) {
        updateActiveCrop({
          customCropBox: { x: 5, y: 5, width: 90, height: 90 },
        });
      }
      return next;
    });
  };

  const handleSelectRatio = (ratio) => {
    setSelectedRatio(ratio);
    if (ratio.id === 'CUSTOM') {
      setIsCustomCropActive(true);
      if (!activeCrop.customCropBox || activeCrop.customCropBox.width === 100) {
        updateActiveCrop({
          customCropBox: { x: 5, y: 5, width: 90, height: 90 },
        });
      }
    }
  };

  const handleResetCrop = () => {
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
  };

  // Immediate Save & Commit for Crop or Video Trim (Right Tick Button)
  const handleSaveCrop = async () => {
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
        showSuccess(`Video trim saved! (${formatTime(trim.start)} – ${formatTime(trim.end || trim.duration)}) ✓`);
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
  };

  // Video Duration Trimming & Playback Sync
  const updateActiveVideoTrim = (updates) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? {
              ...item,
              videoTrim: {
                ...(item.videoTrim || {
                  start: 0,
                  end: Math.floor(item.duration) || 60,
                  duration: Math.floor(item.duration) || 60,
                  coverTime: 0,
                }),
                ...updates,
              },
            }
          : item
      )
    );
  };

  const handleToggleEditVideoPlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoPlayerRef.current) return;
    if (isEditVideoPlaying) {
      videoPlayerRef.current.pause();
      setIsEditVideoPlaying(false);
    } else {
      const { start, end } = activeItem?.videoTrim || { start: 0, end: 15 };
      if (videoPlayerRef.current.currentTime >= end || videoPlayerRef.current.currentTime < start) {
        videoPlayerRef.current.currentTime = start;
      }
      videoPlayerRef.current
        .play()
        .then(() => setIsEditVideoPlaying(true))
        .catch(() => {});
    }
  };

  const handleToggleEditVideoMute = (e) => {
    if (e) e.stopPropagation();
    if (!videoPlayerRef.current) return;
    videoPlayerRef.current.muted = !isEditVideoMuted;
    setIsEditVideoMuted(!isEditVideoMuted);
  };

  const handleVideoTimeUpdate = () => {
    if (!videoPlayerRef.current || !activeItem?.videoTrim) return;
    const cur = videoPlayerRef.current.currentTime;
    setEditVideoCurrentTime(cur);
    const { start, end } = activeItem.videoTrim;
    if (end > 0 && cur >= end) {
      videoPlayerRef.current.currentTime = start || 0;
      setEditVideoCurrentTime(start || 0);
      videoPlayerRef.current.play().catch(() => {});
    }
  };

  const handleVideoMetadataLoaded = (e) => {
    const v = e.target;
    const dur = Math.floor(v.duration) || 0;
    if (dur > 0) {
      updateActiveVideoTrim({
        duration: dur,
        start: activeItem?.videoTrim?.start || 0,
        end: activeItem?.videoTrim?.end || dur,
      });

      if (!activeItem?.filmstripFrames || activeItem.filmstripFrames.length === 0) {
        extractFilmstripFrames(activeItem.originalFile || activeItem.file, dur, 8).then((frames) => {
          if (frames && frames.length > 0) {
            setMediaItems((prev) =>
              prev.map((item, idx) =>
                idx === activeMediaIdx ? { ...item, filmstripFrames: frames } : item
              )
            );
          }
        });
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
  };

  const handleTrimStartChange = (val) => {
    const dur = activeItem?.videoTrim?.duration || 60;
    const curEnd = activeItem?.videoTrim?.end || dur;
    const maxStart = Math.max(0, curEnd - 1);
    const nextStart = Math.min(val, maxStart);
    updateActiveVideoTrim({ start: nextStart });
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = nextStart;
    }
  };

  const handleTrimEndChange = (val) => {
    const curStart = activeItem?.videoTrim?.start || 0;
    const minEnd = curStart + 1;
    const nextEnd = Math.max(val, minEnd);
    updateActiveVideoTrim({ end: nextEnd });
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = nextEnd;
    }
  };

  const handleCoverTimeChange = (val) => {
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
  };

  const handleApplyVideoPreset = (seconds) => {
    const dur = activeItem?.videoTrim?.duration || 60;
    if (seconds >= dur) {
      updateActiveVideoTrim({ start: 0, end: dur });
      if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
    } else {
      updateActiveVideoTrim({ start: 0, end: seconds });
      if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
    }
  };

  const handleResetVideoTrim = () => {
    const dur = activeItem?.videoTrim?.duration || 60;
    updateActiveVideoTrim({ start: 0, end: dur, coverTime: 0 });
    if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
  };

  // Proceed to Details with Crop Rendering
  const handleProceedToDetails = async () => {
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
              isTrimmed: trim.start > 0 || (trim.end > 0 && trim.end < trim.duration) || item.isTrimmed,
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
      setCurrentStep(WIZARD_STEPS.DETAILS);
    } catch (err) {
      console.error('Failed to crop media:', err);
      setCurrentStep(WIZARD_STEPS.DETAILS);
    } finally {
      setProcessingCrop(false);
    }
  };

  const handleApplyFilter = (filterId) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx ? { ...item, filterName: filterId } : item
      )
    );
  };

  const handleAltTextChange = (idx, text) => {
    setMediaItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, altText: text } : item))
    );
  };

  // Interactive user tagging on active photo
  const handleImageClick = (e) => {
    const activeItem = mediaItems[activeMediaIdx];
    if (!activeItem || activeItem.file.type.startsWith('video/')) return;
    if (!imagePreviewRef.current) return;

    const rect = imagePreviewRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.round((clickX / rect.width) * 1000) / 10;
    const yPercent = Math.round((clickY / rect.height) * 1000) / 10;

    setTaggingPos({ xPercent, yPercent });
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleSearchUsers = async (q) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setUserSearchResults([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const res = await userService.searchUsers(q.trim(), 0, 5);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setUserSearchResults(list);
    } catch {
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSelectTaggedUser = (user) => {
    if (!taggingPos) return;
    const activeItem = mediaItems[activeMediaIdx];
    if (activeItem.tags.some((t) => t.userId === user.id)) {
      showError(`@${user.username} is already tagged on this photo.`);
      setTaggingPos(null);
      return;
    }

    const newTag = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.fullName,
      avatarUrl: user.profilePictureUrl || user.avatarUrl,
      xPercent: taggingPos.xPercent,
      yPercent: taggingPos.yPercent,
    };

    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx ? { ...item, tags: [...item.tags, newTag] } : item
      )
    );

    setTaggingPos(null);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleRemoveTag = (userId) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? { ...item, tags: item.tags.filter((t) => t.userId !== userId) }
          : item
      )
    );
  };

  // Collaborator search
  const handleSearchCollab = async (q) => {
    setCollabQuery(q);
    if (!q.trim()) {
      setCollabResults([]);
      return;
    }
    try {
      const res = await userService.searchUsers(q.trim(), 0, 5);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setCollabResults(list);
    } catch {
      setCollabResults([]);
    }
  };

  // Submit Post
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (mediaItems.length === 0) {
      showError('Please select at least one photo or video.');
      return;
    }

    // Snapshot parameters for background execution
    const capturedItems = mediaItems.map((item) => ({ ...item }));
    const capturedCaption = caption;
    const capturedLocation = location;
    const capturedCollaborator = collaborator;
    const capturedCommentsDisabled = commentsDisabled;
    const capturedHideLike = hideLikeCount;
    const capturedVisibility = visibility;
    const capturedRatio = selectedRatio;
    const capturedThumbnail = mediaItems[0]?.previewUrl || '';

    const performPostUpload = async (updateProgress = () => {}) => {
      // 1. Upload media files in sequence/parallel with dynamic progress updates
      const uploadedMediaRequests = [];
      const totalItems = capturedItems.length;
      for (let i = 0; i < totalItems; i++) {
        const item = capturedItems[i];
        const basePct = Math.round(15 + (i / totalItems) * 65);
        const itemSlice = Math.round(65 / totalItems);
        const statusMsg = totalItems > 1
          ? `Sharing media ${i + 1} of ${totalItems}...`
          : 'Sharing media...';

        updateProgress(basePct, statusMsg);

        const uploadRes = await postService.uploadMedia(item.file, 'posts', (filePct) => {
          const dynamicPct = Math.min(80, Math.round(basePct + (filePct / 100) * itemSlice));
          updateProgress(dynamicPct, statusMsg);
        });
        let mediaUrl =
          uploadRes?.secureUrl ||
          uploadRes?.data?.secureUrl ||
          uploadRes?.data?.mediaUrl ||
          uploadRes?.mediaUrl;
        const mediaType =
          uploadRes?.data?.mediaType ||
          uploadRes?.mediaType ||
          (item.file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');

        if (!mediaUrl) {
          throw new Error(`Media upload failed for item #${i + 1}`);
        }

        // Apply Cloudinary video duration trimming & aspect ratio transformations if trimmed/cropped
        if (item.file.type.startsWith('video/') && mediaUrl) {
          const trim = item.videoTrim;
          const transforms = [];
          if (capturedRatio?.id && capturedRatio.id !== 'original' && capturedRatio.id !== 'custom') {
            transforms.push(`c_fill,ar_${capturedRatio.id}`);
          }
          if (trim) {
            const { start = 0, end = 0, duration = 0 } = trim;
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

        uploadedMediaRequests.push({
          mediaUrl,
          mediaType,
          displayOrder: i,
          width: uploadRes?.data?.width || 1080,
          height: uploadRes?.data?.height || 1080,
          altText: item.altText?.trim() || null,
          filterName: item.filterName || 'NORMAL',
          tags: item.tags.map((t) => ({
            taggedUserId: t.userId,
            xPercent: t.xPercent,
            yPercent: t.yPercent,
          })),
        });
      }

      updateProgress(85, 'Finishing up...');

      // Gather distinct tagged users across all slides
      const allTaggedUsersMap = new Map();
      capturedItems.forEach((item) => {
        item.tags.forEach((t) => {
          if (!allTaggedUsersMap.has(t.userId)) {
            allTaggedUsersMap.set(t.userId, {
              taggedUserId: t.userId,
              xPercent: t.xPercent,
              yPercent: t.yPercent,
            });
          }
        });
      });

      const postPayload = {
        caption: capturedCaption.trim(),
        location: capturedLocation.trim() || null,
        collaboratorId: capturedCollaborator?.id || null,
        commentsDisabled: Boolean(capturedCommentsDisabled),
        hideLikeCount: Boolean(capturedHideLike),
        visibility: capturedVisibility,
        taggedUsers: Array.from(allTaggedUsersMap.values()),
        media: uploadedMediaRequests,
      };

      await postService.createPost(postPayload);
      if (onPostCreated) onPostCreated();
    };

    // 🚀 BACKGROUND UPLOAD: If UploadContext is available, fire in background & close modal immediately!
    if (uploadCtx?.startUpload) {
      uploadCtx.startUpload({
        type: 'post',
        title: capturedCaption
          ? `Post: ${capturedCaption.slice(0, 22)}...`
          : capturedItems.length > 1
          ? 'New Carousel Post'
          : 'New Post',
        thumbnail: capturedThumbnail,
        mediaUrl: capturedThumbnail,
        mediaType: capturedItems[0]?.file?.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        mediaItems: capturedItems.map((item) => ({
          previewUrl: item.previewUrl,
          type: item.file?.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        })),
        caption: capturedCaption.trim(),
        location: capturedLocation.trim() || null,
        user: currentUser,
        createdAt: new Date().toISOString(),
        task: performPostUpload,
      });
      handleClose(capturedThumbnail, true);
      return;
    }

    // Synchronous fallback (e.g. for standalone tests without UploadProvider)
    try {
      setLoading(true);
      setUploadProgress('Sharing media...');
      await performPostUpload();
      showSuccess(
        mediaItems.length > 1
          ? 'Carousel post published successfully!'
          : 'Post published successfully!'
      );
      handleClose();
    } catch (err) {
      showError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const activeItem = mediaItems[activeMediaIdx] || mediaItems[0];
  const isVideo = activeItem?.file?.type?.startsWith('video/');
  const activeCrop = activeItem?.crop || {
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    customCropBox: { x: 0, y: 0, width: 100, height: 100 },
  };
  const customBox = activeCrop.customCropBox || { x: 0, y: 0, width: 100, height: 100 };
  const videoTrim = activeItem?.videoTrim || {
    start: 0,
    end: Math.floor(activeItem?.duration) || 60,
    duration: Math.floor(activeItem?.duration) || 60,
    coverTime: 0,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === WIZARD_STEPS.UPLOAD
          ? 'Create new post'
          : currentStep === WIZARD_STEPS.EDIT
          ? 'Crop & Filters'
          : 'Create new post'
      }
      size={currentStep === WIZARD_STEPS.UPLOAD ? 'md' : 'lg'}
    >
      <div className="ig-wizard-container">
        {/* Wizard Navigation Header */}
        {currentStep !== WIZARD_STEPS.UPLOAD && (
          <div className="ig-wizard-subnav">
            <button
              type="button"
              className="ig-subnav-btn"
              onClick={() => {
                if (currentStep === WIZARD_STEPS.DETAILS) {
                  setCurrentStep(WIZARD_STEPS.EDIT);
                } else if (currentStep === WIZARD_STEPS.EDIT) {
                  setCurrentStep(WIZARD_STEPS.UPLOAD);
                }
              }}
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <span className="ig-subnav-title">
              {currentStep === WIZARD_STEPS.EDIT ? 'Edit' : 'Create new post'}
            </span>

            {currentStep === WIZARD_STEPS.EDIT ? (
              <div className="ig-subnav-right-actions">
                <button
                  type="button"
                  className="ig-subnav-save-crop-btn"
                  onClick={handleSaveCrop}
                  disabled={isSavingCrop || processingCrop}
                  title="Save Crop & Changes (✓)"
                  aria-label="Save Crop & Changes"
                >
                  <Check size={16} strokeWidth={2.8} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  className="ig-subnav-action-btn next"
                  onClick={handleProceedToDetails}
                  disabled={processingCrop || isSavingCrop}
                >
                  {processingCrop ? 'Cropping...' : 'Next'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ig-subnav-action-btn share"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Share'}
              </button>
            )}
          </div>
        )}

        {/* STEP 1: INITIAL UPLOAD SELECTOR */}
        {currentStep === WIZARD_STEPS.UPLOAD && (
          <PostUploadStep
            fileInputRef={fileInputRef}
            handleFilesAdded={handleFilesAdded}
          />
        )}

        {/* STEP 2: CROP, ASPECT RATIO & 12 FILTERS */}
        {currentStep === WIZARD_STEPS.EDIT && activeItem && (
          <div className="ig-edit-workspace">
            <PostCanvasPreview
              selectedRatio={selectedRatio}
              isDragging={isDragging}
              handleMouseDown={handleMouseDown}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              handleWheel={handleWheel}
              handleSaveCrop={handleSaveCrop}
              isSavingCrop={isSavingCrop}
              cropSavedToast={cropSavedToast}
              isVideo={isVideo}
              videoPlayerRef={videoPlayerRef}
              activeItem={activeItem}
              handleVideoMetadataLoaded={handleVideoMetadataLoaded}
              handleVideoTimeUpdate={handleVideoTimeUpdate}
              isEditVideoPlaying={isEditVideoPlaying}
              setIsEditVideoPlaying={setIsEditVideoPlaying}
              handleToggleEditVideoPlay={handleToggleEditVideoPlay}
              videoTrim={videoTrim}
              editVideoCurrentTime={editVideoCurrentTime}
              setEditVideoCurrentTime={setEditVideoCurrentTime}
              isEditVideoMuted={isEditVideoMuted}
              handleToggleEditVideoMute={handleToggleEditVideoMute}
              updateActiveVideoTrim={updateActiveVideoTrim}
              handleResetVideoTrim={handleResetVideoTrim}
              handleApplyVideoPreset={handleApplyVideoPreset}
              imageStageRef={imageStageRef}
              imgElementRef={imgElementRef}
              isCustomCropActive={isCustomCropActive}
              activeCrop={activeCrop}
              customBox={customBox}
              handleStartBoxDrag={handleStartBoxDrag}
              showGrid={showGrid}
              showRatioMenu={showRatioMenu}
              setShowRatioMenu={setShowRatioMenu}
              showZoomMenu={showZoomMenu}
              setShowZoomMenu={setShowZoomMenu}
              handleSelectRatio={handleSelectRatio}
              handleZoomChange={handleZoomChange}
              mediaItems={mediaItems}
              activeMediaIdx={activeMediaIdx}
              setActiveMediaIdx={setActiveMediaIdx}
            />

            <PostEditSidebar
              editTab={editTab}
              setEditTab={setEditTab}
              activeItem={activeItem}
              isVideo={isVideo}
              handleApplyFilter={handleApplyFilter}
              selectedRatio={selectedRatio}
              handleSelectRatio={handleSelectRatio}
              activeCrop={activeCrop}
              handleResetCrop={handleResetCrop}
              setShowGrid={setShowGrid}
              handleZoomChange={handleZoomChange}
              isCustomCropActive={isCustomCropActive}
              handleToggleCustomCrop={handleToggleCustomCrop}
              handleRotate={handleRotate}
              handleSaveCrop={handleSaveCrop}
              isSavingCrop={isSavingCrop}
              videoTrim={videoTrim}
              handleResetVideoTrim={handleResetVideoTrim}
              handleTrimStartChange={handleTrimStartChange}
              handleTrimEndChange={handleTrimEndChange}
              handleApplyVideoPreset={handleApplyVideoPreset}
              handleCoverTimeChange={handleCoverTimeChange}
              mediaItems={mediaItems}
              activeMediaIdx={activeMediaIdx}
              setActiveMediaIdx={setActiveMediaIdx}
              handleRemoveMedia={handleRemoveMedia}
              addMoreInputRef={addMoreInputRef}
              handleFilesAdded={handleFilesAdded}
            />
          </div>
        )}

        {/* STEP 3: DETAILS, TAGS, ALT-TEXT & ADVANCED SETTINGS */}
        {currentStep === WIZARD_STEPS.DETAILS && activeItem && (
          <PostDetailsStep
            imagePreviewRef={imagePreviewRef}
            handleImageClick={handleImageClick}
            selectedRatio={selectedRatio}
            isVideo={isVideo}
            activeItem={activeItem}
            videoTrim={videoTrim}
            handleRemoveTag={handleRemoveTag}
            taggingPos={taggingPos}
            setTaggingPos={setTaggingPos}
            userSearchQuery={userSearchQuery}
            handleSearchUsers={handleSearchUsers}
            userSearchResults={userSearchResults}
            handleSelectTaggedUser={handleSelectTaggedUser}
            mediaItems={mediaItems}
            activeMediaIdx={activeMediaIdx}
            setActiveMediaIdx={setActiveMediaIdx}
            currentUser={currentUser}
            caption={caption}
            setCaption={setCaption}
            location={location}
            setLocation={setLocation}
            collaborator={collaborator}
            setCollaborator={setCollaborator}
            collabQuery={collabQuery}
            setCollabQuery={setCollabQuery}
            handleSearchCollab={handleSearchCollab}
            showCollabSearch={showCollabSearch}
            setShowCollabSearch={setShowCollabSearch}
            collabResults={collabResults}
            setCollabResults={setCollabResults}
            showAltTextSection={showAltTextSection}
            setShowAltTextSection={setShowAltTextSection}
            handleAltTextChange={handleAltTextChange}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            hideLikeCount={hideLikeCount}
            setHideLikeCount={setHideLikeCount}
            commentsDisabled={commentsDisabled}
            setCommentsDisabled={setCommentsDisabled}
          />
        )}

        {/* Global Loading Overlay */}
        {loading && (
          <div className="ig-loading-overlay">
            <LoadingSpinner size="lg" />
            <p className="ig-loading-status-text">{uploadProgress || 'Processing...'}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreatePostModal;
