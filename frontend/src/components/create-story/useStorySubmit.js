import { useState, useCallback } from 'react';
import mediaService from '../../services/media.service';
import storyService from '../../services/story.service';
import { useToast } from '../../context/ToastContext';

export const useStorySubmit = ({
  file,
  previewUrl,
  selectedRatio,
  videoTrim,
  selectedFilter,
  stickers,
  uploadCtx,
  showSuccess: customShowSuccess,
  showError: customShowError,
  onStoryCreated,
  handleClose,
} = {}) => {
  const toast = useToast();
  const showSuccess = customShowSuccess || toast?.showSuccess || console.log;
  const showError = customShowError || toast?.showError || console.error;

  const [loading, setLoading] = useState(false);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);

  const doSubmit = useCallback(
    async (closeFriends) => {
      if (!file) return;

      // Snapshot parameters for background execution
      const capturedFile = file;
      const capturedPreviewUrl = previewUrl;
      const capturedRatio = selectedRatio;
      const capturedTrim = { ...videoTrim };
      const capturedInteractive = stickers?.interactiveType || 'none';
      const capturedPrompt = stickers?.questionPrompt || '';
      const capturedPoll = {
        question: stickers?.pollQuestion || '',
        optA: stickers?.pollOptionA || 'Yes',
        optB: stickers?.pollOptionB || 'No',
      };
      const capturedQuiz = {
        question: stickers?.quizQuestion || '',
        optA: stickers?.quizOptionA || 'Option A',
        optB: stickers?.quizOptionB || 'Option B',
        optC: stickers?.quizOptionC || null,
        correctIdx: stickers?.quizCorrectIndex ?? 0,
      };
      const capturedSlider = {
        question: stickers?.sliderQuestion || '',
        emoji: stickers?.sliderEmoji || '🔥',
      };
      const capturedCountdown = {
        title: stickers?.countdownTitle || '',
        date: stickers?.countdownDate,
      };
      const capturedLink = {
        url: stickers?.linkUrl || '',
        text: stickers?.linkText || '',
      };
      const capturedLocation = stickers?.locationName || '';
      const capturedHashtag = stickers?.hashtagTag || '';
      const capturedAudioTitle = stickers?.audioTitle || '';
      const capturedAudioArtist = stickers?.audioArtist || '';
      const capturedMentionUsers = [...(stickers?.selectedMentionUsers || [])];
      const capturedShowMentionsOnScreen = stickers?.showMentionsOnScreen;
      const capturedPositions = { ...(stickers?.stickerPositions || {}) };
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
          if (
            capturedRatio?.id &&
            capturedRatio.id !== 'ORIGINAL' &&
            capturedRatio.id !== 'CUSTOM'
          ) {
            transforms.push(
              `c_fill,ar_${capturedRatio.id === '9:16' ? '9:16' : capturedRatio.id}`
            );
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
          links: capturedLink.url.trim()
            ? [
                {
                  url: capturedLink.url.trim(),
                  title: capturedLink.text.trim() || null,
                  xPercent: capturedPositions?.link?.x ?? 50,
                  yPercent: capturedPositions?.link?.y ?? 70,
                },
              ]
            : [],
          locations: capturedLocation.trim()
            ? [
                {
                  locationName: capturedLocation.trim(),
                  xPercent: capturedPositions?.location?.x ?? 50,
                  yPercent: capturedPositions?.location?.y ?? 78,
                },
              ]
            : [],
          hashtags: capturedHashtag.trim()
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
                  xPercent: Math.min(
                    85,
                    Math.max(15, Number((capturedPositions?.mention?.x || 50) + idx * 2))
                  ),
                  yPercent: Math.min(
                    85,
                    Math.max(15, Number((capturedPositions?.mention?.y || 32) + idx * 5))
                  ),
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
          links: capturedLink.url.trim()
            ? [{ url: capturedLink.url.trim(), title: capturedLink.text.trim() || null }]
            : [],
          locations: capturedLocation.trim()
            ? [{ locationName: capturedLocation.trim() }]
            : [],
          hashtags: capturedHashtag.trim()
            ? [{ hashtag: capturedHashtag.replace(/^#/, '').trim() }]
            : [],
          mentions: capturedMentionUsers?.length > 0 ? capturedMentionUsers : [],
          task: performStoryUpload,
        });
        if (handleClose) handleClose(capturedPreviewUrl);
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
        if (handleClose) handleClose();
      } catch (err) {
        showError(err.message || 'Failed to upload story');
      } finally {
        setLoading(false);
      }
    },
    [
      file,
      previewUrl,
      selectedRatio,
      videoTrim,
      selectedFilter,
      stickers,
      uploadCtx,
      onStoryCreated,
      handleClose,
      showSuccess,
      showError,
    ]
  );

  const resetSubmitState = useCallback(() => {
    setLoading(false);
    setIsCloseFriendsOnly(false);
  }, []);

  return {
    loading,
    setLoading,
    isCloseFriendsOnly,
    setIsCloseFriendsOnly,
    doSubmit,
    resetSubmitState,
  };
};

export default useStorySubmit;
