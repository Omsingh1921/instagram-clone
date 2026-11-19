import { useState, useRef, useCallback } from 'react';
import postService from '../../services/post.service';
import userService from '../../services/user.service';
import { useToast } from '../../context/ToastContext';

export const usePostDetails = ({
  mediaItems,
  setMediaItems,
  activeMediaIdx,
  selectedRatio,
  currentUser,
  uploadCtx,
  showSuccess: customShowSuccess,
  showError: customShowError,
  onPostCreated,
  handleClose,
} = {}) => {
  const toast = useToast();
  const showSuccess = customShowSuccess || toast?.showSuccess || console.log;
  const showError = customShowError || toast?.showError || console.error;

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

  // Loading & Progress
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const imagePreviewRef = useRef(null);

  // Interactive user tagging on active photo
  const handleImageClick = useCallback(
    (e) => {
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
    },
    [mediaItems, activeMediaIdx]
  );

  const handleSearchUsers = useCallback(async (q) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setUserSearchResults([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const res = await userService.searchUsers(q.trim(), 0, 5);
      const list =
        res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setUserSearchResults(list);
    } catch {
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  }, []);

  const handleSelectTaggedUser = useCallback(
    (user) => {
      if (!taggingPos) return;
      const activeItem = mediaItems[activeMediaIdx];
      if (activeItem?.tags?.some((t) => t.userId === user.id)) {
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
    },
    [taggingPos, mediaItems, activeMediaIdx, setMediaItems, showError]
  );

  const handleRemoveTag = useCallback(
    (userId) => {
      setMediaItems((prev) =>
        prev.map((item, idx) =>
          idx === activeMediaIdx
            ? { ...item, tags: item.tags.filter((t) => t.userId !== userId) }
            : item
        )
      );
    },
    [activeMediaIdx, setMediaItems]
  );

  // Collaborator search
  const handleSearchCollab = useCallback(async (q) => {
    setCollabQuery(q);
    if (!q.trim()) {
      setCollabResults([]);
      return;
    }
    try {
      const res = await userService.searchUsers(q.trim(), 0, 5);
      const list =
        res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setCollabResults(list);
    } catch {
      setCollabResults([]);
    }
  }, []);

  // Submit Post
  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (!mediaItems || mediaItems.length === 0) {
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
          const statusMsg =
            totalItems > 1 ? `Sharing media ${i + 1} of ${totalItems}...` : 'Sharing media...';

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
            if (
              capturedRatio?.id &&
              capturedRatio.id !== 'original' &&
              capturedRatio.id !== 'custom'
            ) {
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
                mediaUrl = mediaUrl.replace(
                  '/video/upload/',
                  `/video/upload/${transformPrefix}`
                );
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
        if (handleClose) handleClose(capturedThumbnail, true);
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
        if (handleClose) handleClose();
      } catch (err) {
        showError(err.message || 'Failed to create post. Please try again.');
      } finally {
        setLoading(false);
        setUploadProgress('');
      }
    },
    [
      mediaItems,
      caption,
      location,
      collaborator,
      commentsDisabled,
      hideLikeCount,
      visibility,
      selectedRatio,
      uploadCtx,
      currentUser,
      handleClose,
      onPostCreated,
      showSuccess,
      showError,
    ]
  );

  const resetDetailsState = useCallback(() => {
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
    setUploadProgress('');
  }, []);

  return {
    caption,
    setCaption,
    location,
    setLocation,
    commentsDisabled,
    setCommentsDisabled,
    hideLikeCount,
    setHideLikeCount,
    visibility,
    setVisibility,
    showAdvanced,
    setShowAdvanced,
    showAltTextSection,
    setShowAltTextSection,
    taggingPos,
    setTaggingPos,
    userSearchQuery,
    setUserSearchQuery,
    userSearchResults,
    setUserSearchResults,
    searchingUsers,
    collaborator,
    setCollaborator,
    collabQuery,
    setCollabQuery,
    collabResults,
    setCollabResults,
    showCollabSearch,
    setShowCollabSearch,
    loading,
    uploadProgress,
    imagePreviewRef,
    handleImageClick,
    handleSearchUsers,
    handleSelectTaggedUser,
    handleRemoveTag,
    handleSearchCollab,
    handleSubmit,
    resetDetailsState,
  };
};

export default usePostDetails;
