import { useState, useCallback } from 'react';
import mediaService from '../../services/media.service';
import reelService from '../../services/reel.service';

export const POPULAR_LOCATIONS = [
  'Mumbai, India',
  'New Delhi, India',
  'Bengaluru, India',
  'Goa, India',
  'London, UK',
  'New York, NY',
];

export const useReelSubmit = ({
  file,
  previewUrl,
  selectedRatio,
  videoTrim,
  videoDuration,
  currentUser,
  uploadCtx,
  captureThumbnailBlob,
  onClose,
  onReelCreated,
  showSuccess,
  showError,
}) => {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetDetails = useCallback(() => {
    setCaption('');
    setLocation('');
    setHideLikeCount(false);
    setCommentsDisabled(false);
    setShowAdvanced(false);
    setLoading(false);
  }, []);

  const handleSubmit = useCallback(
    async (e, isDraft = false) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!file) {
        showError?.('Please select a video file.');
        return;
      }

      const capturedFile = file;
      const capturedPreviewUrl = previewUrl;
      const capturedRatio = selectedRatio;
      const capturedTrim = { ...videoTrim };
      const capturedDuration = videoDuration;
      const capturedCaption = caption;
      const capturedLocation = location;
      const capturedHideLike = hideLikeCount;
      const capturedCommentsDisabled = commentsDisabled;

      const performReelUpload = async (updateProgress = () => {}) => {
        updateProgress(20, 'Sharing reel...');
        const uploadRes = await mediaService.uploadMedia(capturedFile, 'reels', (filePct) => {
          const dynamicPct = Math.min(65, Math.round(20 + (filePct / 100) * 45));
          updateProgress(dynamicPct, 'Sharing reel...');
        });
        let mediaUrl =
          uploadRes?.secureUrl ||
          uploadRes?.data?.secureUrl ||
          uploadRes?.data?.mediaUrl ||
          uploadRes?.mediaUrl ||
          uploadRes?.url ||
          uploadRes?.data?.url;

        if (!mediaUrl) {
          throw new Error('Failed to upload video.');
        }

        let thumbnailUrl = uploadRes?.data?.thumbnailUrl || uploadRes?.thumbnailUrl || mediaUrl;

        // Try uploading custom cover thumbnail blob if captured
        try {
          updateProgress(66, 'Uploading cover frame...');
          const thumbBlob = await captureThumbnailBlob?.();
          if (thumbBlob) {
            const thumbFile = new File([thumbBlob], 'reel_thumb.jpg', { type: 'image/jpeg' });
            const thumbRes = await mediaService.uploadMedia(thumbFile, 'reels');
            const customThumb =
              thumbRes?.secureUrl || thumbRes?.data?.secureUrl || thumbRes?.url || thumbRes?.data?.url;
            if (customThumb) thumbnailUrl = customThumb;
          }
        } catch {
          // Fallback to default thumbnail
        }

        // Attach Cloudinary video transformation URL for duration crop & aspect ratio
        updateProgress(75, 'Processing reel video...');
        if (mediaUrl) {
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

        const trimmedDuration = Math.max(1, (capturedTrim.end || capturedDuration) - (capturedTrim.start || 0));
        const durationMs = Math.round(trimmedDuration * 1000);

        const payload = {
          videoUrl: mediaUrl,
          thumbnailUrl: thumbnailUrl,
          caption: capturedCaption.trim(),
          location: capturedLocation.trim(),
          hideLikeCount: capturedHideLike,
          commentsDisabled: capturedCommentsDisabled,
          durationMs: durationMs,
        };

        updateProgress(88, 'Finishing up...');
        await reelService.createReel(payload);
        if (onReelCreated) onReelCreated();
      };

      // 🚀 BACKGROUND UPLOAD
      if (uploadCtx?.startUpload && !isDraft) {
        uploadCtx.startUpload({
          type: 'reel',
          title: capturedCaption ? `Reel: ${capturedCaption.slice(0, 22)}...` : 'New Reel',
          thumbnail: capturedPreviewUrl,
          mediaUrl: capturedPreviewUrl,
          mediaType: 'VIDEO',
          videoUrl: capturedPreviewUrl,
          caption: capturedCaption.trim(),
          location: capturedLocation.trim() || null,
          user: currentUser,
          createdAt: new Date().toISOString(),
          task: performReelUpload,
        });
        onClose?.(capturedPreviewUrl);
        return;
      }

      // Synchronous fallback (drafts or without UploadProvider)
      try {
        setLoading(true);
        if (isDraft) {
          const trimmedDuration = Math.max(1, (videoTrim.end || videoDuration) - (videoTrim.start || 0));
          const payload = {
            videoUrl: previewUrl,
            thumbnailUrl: previewUrl,
            caption: caption.trim(),
            location: location.trim(),
            hideLikeCount: hideLikeCount,
            commentsDisabled: commentsDisabled,
            durationMs: Math.round(trimmedDuration * 1000),
          };
          await reelService.createDraft(payload);
          showSuccess?.('Reel saved as draft! ✓');
        } else {
          await performReelUpload();
          showSuccess?.('Reel shared successfully! ✓');
        }
        onClose?.();
        if (onReelCreated) onReelCreated();
      } catch (err) {
        showError?.(err.message || (isDraft ? 'Failed to save draft' : 'Failed to create reel'));
      } finally {
        setLoading(false);
      }
    },
    [
      file,
      previewUrl,
      selectedRatio,
      videoTrim,
      videoDuration,
      caption,
      location,
      hideLikeCount,
      commentsDisabled,
      uploadCtx,
      currentUser,
      captureThumbnailBlob,
      onClose,
      onReelCreated,
      showSuccess,
      showError,
    ]
  );

  return {
    caption,
    setCaption,
    location,
    setLocation,
    hideLikeCount,
    setHideLikeCount,
    commentsDisabled,
    setCommentsDisabled,
    showAdvanced,
    setShowAdvanced,
    loading,
    setLoading,
    resetDetails,
    handleSubmit,
  };
};

export default useReelSubmit;
