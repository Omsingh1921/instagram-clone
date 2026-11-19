import { useState, useRef } from 'react';
import mediaService from '../../services/media.service';
import chatService from '../../services/chat.service';
import stompClient from '../../services/websocket';
import storyService from '../../services/story.service';

export const useChatMedia = ({
  activeConversation,
  currentUser,
  inputText,
  setInputText,
  showError,
  showSuccess,
  setMessages,
  setSending,
  promoteConversationToPrimary,
  convCacheRef,
  messagesPage,
  hasMoreMessages,
}) => {
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Media Attachment & View-Once state
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [isViewOnceMedia, setIsViewOnceMedia] = useState(false);
  const [viewOnceModalData, setViewOnceModalData] = useState(null);
  const [viewOnceCountdown, setViewOnceCountdown] = useState(10);
  const [storyPreviewModalUrl, setStoryPreviewModalUrl] = useState(null);
  const [sharedMentionStories, setSharedMentionStories] = useState({});
  const [sharingMentionStoryId, setSharingMentionStoryId] = useState(null);
  const mediaFileInputRef = useRef(null);
  const viewOnceTimerRef = useRef(null);

  const handleSelectMedia = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedMediaFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
    setIsViewOnceMedia(false);
  };

  const handleClearSelectedMedia = () => {
    setSelectedMediaFile(null);
    setMediaPreviewUrl('');
    setIsViewOnceMedia(false);
    if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
  };

  const handleSendMediaMessage = async () => {
    if (!selectedMediaFile || !activeConversation?.id) return;
    try {
      setSending(true);
      const isVideo = selectedMediaFile.type.startsWith('video/');
      const uploadRes = await mediaService.uploadMedia(selectedMediaFile, 'messages');
      const uploadedUrl =
        uploadRes?.mediaUrl ||
        uploadRes?.data?.mediaUrl ||
        uploadRes?.url ||
        uploadRes?.secureUrl;

      if (!uploadedUrl) {
        throw new Error('Could not upload media');
      }

      const res = await chatService.sendMessage(activeConversation.id, {
        content: isViewOnceMedia
          ? isVideo
            ? 'Video (View once)'
            : 'Photo (View once)'
          : inputText.trim() || (isVideo ? 'Video' : 'Photo'),
        messageType: isVideo ? 'VIDEO' : 'IMAGE',
        mediaUrl: uploadedUrl,
        isViewOnce: isViewOnceMedia,
      });

      const sentMsg = res?.data || res;
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        const nextMsgs = [...prev, { ...sentMsg, status: 'sent', isSeen: false }];
        if (activeConversation?.id && convCacheRef?.current) {
          convCacheRef.current.set(activeConversation.id, {
            messages: nextMsgs,
            page: messagesPage,
            hasMore: hasMoreMessages,
          });
        }
        return nextMsgs;
      });
      handleClearSelectedMedia();
      setInputText('');
      promoteConversationToPrimary(activeConversation.id, sentMsg);
    } catch (err) {
      showError?.(err.message || 'Failed to send media');
    } finally {
      setSending(false);
    }
  };

  const handleOpenViewOnce = async (msg) => {
    if (msg.isOpened) {
      showError?.('This media has already been viewed and expired');
      return;
    }

    setViewOnceModalData(msg);
    setViewOnceCountdown(10);

    if (!msg.isOpened && activeConversation?.id) {
      try {
        await chatService.openViewOnceMessage(activeConversation.id, msg.id);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, isOpened: true, viewedAt: new Date().toISOString() }
              : m
          )
        );
      } catch (err) {
        console.error('Failed to notify view-once opened:', err);
      }
    }

    clearInterval(viewOnceTimerRef.current);
    viewOnceTimerRef.current = setInterval(() => {
      setViewOnceCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(viewOnceTimerRef.current);
          setViewOnceModalData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCloseViewOnce = () => {
    clearInterval(viewOnceTimerRef.current);
    setViewOnceModalData(null);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      showError?.('Microphone access denied or unavailable in browser');
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const handleSendVoiceNote = async () => {
    if (!mediaRecorderRef.current || !activeConversation?.id) return;
    clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      try {
        setSending(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: 'audio/webm',
        });

        const uploadRes = await mediaService.uploadMedia(audioFile, 'messages');
        const audioUrl = uploadRes?.mediaUrl || uploadRes?.data?.mediaUrl || uploadRes?.url;

        if (!audioUrl) {
          throw new Error('Could not upload voice note');
        }

        const payload = {
          conversationId: activeConversation.id,
          content: 'Voice note',
          messageType: 'AUDIO',
          mediaUrl: audioUrl,
        };

        stompClient.send('/app/chat.sendMessage', payload);
        promoteConversationToPrimary(activeConversation.id, {
          ...payload,
          sender: currentUser,
          createdAt: new Date().toISOString(),
        });
        setIsRecording(false);
        setRecordingTime(0);
      } catch (err) {
        showError?.(err.message || 'Failed to send voice note');
      } finally {
        setSending(false);
      }
    };

    try {
      mediaRecorderRef.current.stop();
    } catch {}
  };

  const handleShareMentionedStory = async (storyId) => {
    if (sharedMentionStories[storyId] || sharingMentionStoryId === storyId) return;
    try {
      setSharingMentionStoryId(storyId);
      await storyService.shareMentionedStory(storyId);
      setSharedMentionStories((prev) => ({ ...prev, [storyId]: true }));
      showSuccess?.('Added to your story!');
      window.dispatchEvent(new CustomEvent('story:refresh'));
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add story to your profile';
      showError?.(errorMsg);
    } finally {
      setSharingMentionStoryId(null);
    }
  };

  return {
    selectedMediaFile,
    mediaPreviewUrl,
    isViewOnceMedia,
    setIsViewOnceMedia,
    viewOnceModalData,
    viewOnceCountdown,
    storyPreviewModalUrl,
    setStoryPreviewModalUrl,
    sharedMentionStories,
    sharingMentionStoryId,
    mediaFileInputRef,
    handleSelectMedia,
    handleClearSelectedMedia,
    handleSendMediaMessage,
    handleOpenViewOnce,
    handleCloseViewOnce,
    isRecording,
    recordingTime,
    handleStartRecording,
    handleCancelRecording,
    handleSendVoiceNote,
    handleShareMentionedStory,
  };
};

export default useChatMedia;

