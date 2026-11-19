import { useState, useEffect, useCallback } from 'react';
import storyService from '../../../services/story.service';
import { useToast } from '../../../context/ToastContext';

export const useStoryReactions = ({
  currentStory,
  currentGroup,
  setIsPaused,
  showSuccess: customShowSuccess,
  showError: customShowError,
} = {}) => {
  const toast = useToast();
  const showSuccess = customShowSuccess || toast?.showSuccess || console.log;
  const showError = customShowError || toast?.showError || console.error;

  const [replyText, setReplyText] = useState('');
  const [likedStory, setLikedStory] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState(null);
  const [sharingMention, setSharingMention] = useState(false);
  const [sharedStoriesMap, setSharedStoriesMap] = useState({});

  useEffect(() => {
    setReplyText('');
    setLikedStory(false);
  }, [currentStory]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !currentStory?.id) return;
    const sentText = replyText.trim();
    try {
      await storyService.replyToStory(currentStory.id, sentText);
      showSuccess(`Reply sent to ${currentGroup?.author?.username || 'user'}`);
      setReplyText('');
      if (setIsPaused) setIsPaused(false);
      window.dispatchEvent(
        new CustomEvent('story:dm-sent', {
          detail: {
            storyId: currentStory.id,
            recipientUsername: currentGroup?.author?.username,
            content: sentText,
            mediaUrl: currentStory.mediaUrl,
          },
        })
      );
    } catch (err) {
      showError(err.message || 'Failed to send reply');
    }
  }, [replyText, currentStory, currentGroup, setIsPaused, showSuccess, showError]);

  const handleLikeStory = useCallback(async () => {
    if (!currentStory?.id) return;
    try {
      const res = await storyService.toggleLikeStory(currentStory.id);
      const isLiked = res?.data?.liked ?? !likedStory;
      setLikedStory(isLiked);
      if (isLiked) {
        showSuccess('Liked story');
      }
    } catch {
      setLikedStory(!likedStory);
    }
  }, [currentStory?.id, likedStory, showSuccess]);

  const handleReactEmoji = useCallback(
    async (emoji) => {
      if (!currentStory?.id) return;
      setFloatingReaction(emoji);
      setTimeout(() => setFloatingReaction(null), 1200);
      try {
        await storyService.reactToStory(currentStory.id, emoji);
        showSuccess(`Sent ${emoji} reaction!`);
        window.dispatchEvent(
          new CustomEvent('story:dm-sent', {
            detail: {
              storyId: currentStory.id,
              recipientUsername: currentGroup?.author?.username,
              content: emoji,
              mediaUrl: currentStory.mediaUrl,
            },
          })
        );
      } catch {
        // Graceful fallback
      }
    },
    [currentStory, currentGroup, showSuccess]
  );

  const handleShareMentionedStory = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!currentStory?.id || sharingMention || sharedStoriesMap[currentStory.id]) return;
      try {
        setSharingMention(true);
        await storyService.shareMentionedStory(currentStory.id);
        setSharedStoriesMap((prev) => ({ ...prev, [currentStory.id]: true }));
        showSuccess('Added to your story!');
        window.dispatchEvent(new CustomEvent('story:refresh'));
      } catch (err) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to add story to your profile';
        showError(errorMsg);
      } finally {
        setSharingMention(false);
      }
    },
    [currentStory?.id, sharingMention, sharedStoriesMap, showSuccess, showError]
  );

  return {
    replyText,
    setReplyText,
    likedStory,
    setLikedStory,
    floatingReaction,
    setFloatingReaction,
    sharingMention,
    setSharingMention,
    sharedStoriesMap,
    setSharedStoriesMap,
    handleSendReply,
    handleLikeStory,
    handleReactEmoji,
    handleShareMentionedStory,
  };
};

export default useStoryReactions;
