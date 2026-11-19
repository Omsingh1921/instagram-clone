import { useState, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { extractVideoThumbnail, extractFilmstripFrames } from './videoUtils';

export const usePostMediaState = ({ showError: customShowError } = {}) => {
  const toast = useToast();
  const showError = customShowError || toast?.showError || console.error;

  // Multi-media Carousel state: array of { file, previewUrl, filterName, altText, tags: [] }
  const [mediaItems, setMediaItems] = useState([]);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  // Add files to mediaItems (up to 10)
  const handleFilesAdded = useCallback(
    (filesList, onFirstUpload) => {
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
      if (onFirstUpload) {
        onFirstUpload();
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
    },
    [mediaItems.length, showError]
  );

  const handleRemoveMedia = useCallback(
    (index, onEmpty) => {
      if (mediaItems.length <= 1) {
        if (onEmpty) onEmpty();
        return;
      }
      const itemToRemove = mediaItems[index];
      if (itemToRemove?.previewUrl) URL.revokeObjectURL(itemToRemove.previewUrl);
      if (
        itemToRemove?.originalPreviewUrl &&
        itemToRemove.originalPreviewUrl !== itemToRemove.previewUrl
      ) {
        URL.revokeObjectURL(itemToRemove.originalPreviewUrl);
      }

      const updated = mediaItems.filter((_, i) => i !== index);
      setMediaItems(updated);
      if (activeMediaIdx >= updated.length) {
        setActiveMediaIdx(updated.length - 1);
      }
    },
    [mediaItems, activeMediaIdx]
  );

  // Active crop helper
  const updateActiveCrop = useCallback(
    (updates) => {
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
    },
    [activeMediaIdx]
  );

  // Active video trim helper
  const updateActiveVideoTrim = useCallback(
    (updates) => {
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
    },
    [activeMediaIdx]
  );

  const handleApplyFilter = useCallback(
    (filterId) => {
      setMediaItems((prev) =>
        prev.map((item, idx) =>
          idx === activeMediaIdx ? { ...item, filterName: filterId } : item
        )
      );
    },
    [activeMediaIdx]
  );

  const handleAltTextChange = useCallback((idx, text) => {
    setMediaItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, altText: text } : item))
    );
  }, []);

  const resetMediaState = useCallback(
    (keepThumbnailUrl = null, preserveObjectUrls = false) => {
      if (!preserveObjectUrls) {
        mediaItems.forEach((item) => {
          if (item.previewUrl && item.previewUrl !== keepThumbnailUrl) {
            URL.revokeObjectURL(item.previewUrl);
          }
          if (
            item.originalPreviewUrl &&
            item.originalPreviewUrl !== item.previewUrl &&
            item.originalPreviewUrl !== keepThumbnailUrl
          ) {
            URL.revokeObjectURL(item.originalPreviewUrl);
          }
        });
      }
      setMediaItems([]);
      setActiveMediaIdx(0);
    },
    [mediaItems]
  );

  const activeItem = mediaItems[activeMediaIdx] || mediaItems[0];
  const isVideo = Boolean(activeItem?.file?.type?.startsWith('video/'));
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

  return {
    mediaItems,
    setMediaItems,
    activeMediaIdx,
    setActiveMediaIdx,
    activeItem,
    isVideo,
    activeCrop,
    customBox,
    videoTrim,
    handleFilesAdded,
    handleRemoveMedia,
    updateActiveCrop,
    updateActiveVideoTrim,
    handleApplyFilter,
    handleAltTextChange,
    resetMediaState,
  };
};

export default usePostMediaState;
