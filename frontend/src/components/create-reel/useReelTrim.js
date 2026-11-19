import { useState, useCallback } from 'react';
import { formatTime, extractVideoThumbnail } from '../create-post';

export const REEL_ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 (Reel)', ratio: '9 / 16' },
  { id: 'ORIGINAL', label: 'Original', ratio: null },
  { id: '1:1', label: '1:1 (Square)', ratio: '1 / 1' },
  { id: '4:5', label: '4:5 (Portrait)', ratio: '4 / 5' },
];

export const useReelTrim = ({
  file,
  videoPreviewRef,
  customThumbnailUrl,
  setCustomThumbnailUrl,
  showSuccess,
  showError,
}) => {
  const [selectedRatio, setSelectedRatio] = useState(REEL_ASPECT_RATIOS[0]);
  const [selectedFilter, setSelectedFilter] = useState('NORMAL');
  const [editTab, setEditTab] = useState('RATIO'); // 'RATIO' | 'FILTERS'

  const [videoTrim, setVideoTrim] = useState({
    start: 0,
    end: 15,
    duration: 15,
    coverTime: 0,
  });
  const [editVideoCurrentTime, setEditVideoCurrentTime] = useState(0);
  const [isEditVideoPlaying, setIsEditVideoPlaying] = useState(false);
  const [isEditVideoMuted, setIsEditVideoMuted] = useState(false);

  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [cropSavedToast, setCropSavedToast] = useState(false);

  const resetTrim = useCallback(() => {
    setSelectedRatio(REEL_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');
    setEditTab('RATIO');
    setVideoTrim({ start: 0, end: 15, duration: 15, coverTime: 0 });
    setEditVideoCurrentTime(0);
    setIsEditVideoPlaying(false);
    setIsEditVideoMuted(false);
    setIsSavingCrop(false);
    setCropSavedToast(false);
  }, []);

  const handleVideoMetadataLoaded = useCallback((e, curVideoDuration) => {
    const dur = Math.floor(e.target.duration) || 15;
    if (dur && dur !== curVideoDuration) {
      setVideoTrim((prev) => ({
        start: prev.start || 0,
        end: prev.end && prev.end <= dur ? prev.end : Math.min(90, dur),
        duration: dur,
        coverTime: prev.coverTime || 0,
      }));
    }
    return dur;
  }, []);

  const handleVideoTimeUpdate = useCallback((e, curVideoDuration) => {
    const cur = e.target.currentTime;
    setEditVideoCurrentTime(cur);
    const start = videoTrim.start || 0;
    const end = videoTrim.end || curVideoDuration || 15;
    if (cur >= end) {
      e.target.currentTime = start;
    }
  }, [videoTrim]);

  const handleToggleEditVideoPlay = useCallback((e, curVideoDuration) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!videoPreviewRef.current) return;
    if (isEditVideoPlaying) {
      videoPreviewRef.current.pause();
    } else {
      const start = videoTrim.start || 0;
      const end = videoTrim.end || curVideoDuration || 15;
      if (videoPreviewRef.current.currentTime < start || videoPreviewRef.current.currentTime >= end) {
        videoPreviewRef.current.currentTime = start;
      }
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [videoPreviewRef, isEditVideoPlaying, videoTrim]);

  const handleToggleEditVideoMute = useCallback((e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!videoPreviewRef.current) return;
    const next = !isEditVideoMuted;
    videoPreviewRef.current.muted = next;
    setIsEditVideoMuted(next);
  }, [videoPreviewRef, isEditVideoMuted]);

  const handleTrimStartChange = useCallback((val, curVideoDuration) => {
    const dur = videoTrim.duration || curVideoDuration || 15;
    const curEnd = videoTrim.end || dur;
    const maxStart = Math.max(0, curEnd - 1);
    const nextStart = Math.min(val, maxStart);
    setVideoTrim((prev) => ({ ...prev, start: nextStart }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = nextStart;
    }
  }, [videoTrim, videoPreviewRef]);

  const handleTrimEndChange = useCallback((val) => {
    const curStart = videoTrim.start || 0;
    const minEnd = curStart + 1;
    const nextEnd = Math.max(val, minEnd);
    setVideoTrim((prev) => ({ ...prev, end: nextEnd }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = nextEnd;
    }
  }, [videoTrim, videoPreviewRef]);

  const handleCoverTimeChange = useCallback((val) => {
    setVideoTrim((prev) => ({ ...prev, coverTime: val }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = val;
    }
    extractVideoThumbnail(file, val).then((res) => {
      if (res?.thumbnailUrl && res.thumbnailUrl.startsWith('data:image')) {
        setCustomThumbnailUrl(res.thumbnailUrl);
      }
    });
  }, [file, videoPreviewRef, setCustomThumbnailUrl]);

  const handleApplyVideoPreset = useCallback((seconds) => {
    const dur = videoTrim.duration || 15;
    if (seconds >= dur) {
      setVideoTrim((prev) => ({ ...prev, start: 0, end: dur }));
      if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    } else {
      setVideoTrim((prev) => ({ ...prev, start: 0, end: seconds }));
      if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    }
  }, [videoTrim.duration, videoPreviewRef]);

  const handleResetVideoTrim = useCallback((curVideoDuration) => {
    const dur = curVideoDuration || 15;
    setVideoTrim({ start: 0, end: dur, duration: dur, coverTime: 0 });
    setSelectedRatio(REEL_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');
    if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    showSuccess?.('Reel trim reset to original.');
  }, [videoPreviewRef, showSuccess]);

  const handleSaveCrop = useCallback(async (curVideoDuration) => {
    if (!file) return;
    setIsSavingCrop(true);
    try {
      const trim = videoTrim;
      const start = trim.start || 0;
      const end = trim.end || trim.duration || curVideoDuration || 15;

      let thumb = customThumbnailUrl;
      if (!thumb || !thumb.startsWith('data:image')) {
        const res = await extractVideoThumbnail(file, trim.coverTime || start || 0.5);
        if (res?.thumbnailUrl) {
          thumb = res.thumbnailUrl;
          setCustomThumbnailUrl(thumb);
        }
      }
      showSuccess?.(`Reel trim saved! (${formatTime(start)} – ${formatTime(end)}) ✓`);
      setCropSavedToast(true);
      setTimeout(() => setCropSavedToast(false), 2400);
    } catch (err) {
      console.error('Failed to save reel crop:', err);
      showError?.('Failed to save reel trim. Please try again.');
    } finally {
      setIsSavingCrop(false);
    }
  }, [file, videoTrim, customThumbnailUrl, setCustomThumbnailUrl, showSuccess, showError]);

  return {
    selectedRatio,
    setSelectedRatio,
    selectedFilter,
    setSelectedFilter,
    editTab,
    setEditTab,
    videoTrim,
    setVideoTrim,
    editVideoCurrentTime,
    setEditVideoCurrentTime,
    isEditVideoPlaying,
    setIsEditVideoPlaying,
    isEditVideoMuted,
    setIsEditVideoMuted,
    isSavingCrop,
    cropSavedToast,
    resetTrim,
    handleVideoMetadataLoaded,
    handleVideoTimeUpdate,
    handleToggleEditVideoPlay,
    handleToggleEditVideoMute,
    handleTrimStartChange,
    handleTrimEndChange,
    handleCoverTimeChange,
    handleApplyVideoPreset,
    handleResetVideoTrim,
    handleSaveCrop,
  };
};

export default useReelTrim;
