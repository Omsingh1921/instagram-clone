import { useState, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { extractVideoThumbnail, extractFilmstripFrames } from '../create-post';

export const useStoryMedia = ({ showError: customShowError } = {}) => {
  const toast = useToast();
  const showError = customShowError || toast?.showError || console.error;

  const [file, setFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState('');
  const [isCropped, setIsCropped] = useState(false);

  const isVideo = Boolean(file?.type?.startsWith('video/'));

  const handleFileSelect = useCallback(
    async (selectedFile, onVideoSelected) => {
      if (!selectedFile) return;
      const isVid = selectedFile.type.startsWith('video/');
      const isImg = selectedFile.type.startsWith('image/');
      if (!isImg && !isVid) {
        showError('Please select an image or video file.');
        return;
      }

      if (selectedFile.size > 100 * 1024 * 1024) {
        showError('Media exceeds 100MB limit.');
        return;
      }

      const url = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setOriginalFile(selectedFile);
      setPreviewUrl(url);
      setOriginalPreviewUrl(url);
      setIsCropped(false);

      if (isVid) {
        try {
          const info = await extractVideoThumbnail(selectedFile, 0.5);
          const dur = info?.duration || 15;
          const frames = await extractFilmstripFrames(selectedFile, dur, 8);
          if (onVideoSelected) {
            onVideoSelected({
              duration: dur,
              filmstripFrames: frames && frames.length > 0 ? frames : [],
            });
          }
        } catch (err) {
          console.warn('Story video metadata extraction warning:', err);
          if (onVideoSelected) {
            onVideoSelected({ duration: 15, filmstripFrames: [] });
          }
        }
      }
    },
    [showError]
  );

  const resetMediaState = useCallback(
    (keepThumbnailUrl = null) => {
      if (previewUrl && previewUrl !== keepThumbnailUrl && previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
      }
      if (
        originalPreviewUrl &&
        originalPreviewUrl !== previewUrl &&
        originalPreviewUrl !== keepThumbnailUrl &&
        originalPreviewUrl.startsWith('blob:')
      ) {
        try {
          URL.revokeObjectURL(originalPreviewUrl);
        } catch {}
      }
      setFile(null);
      setOriginalFile(null);
      setPreviewUrl('');
      setOriginalPreviewUrl('');
      setIsCropped(false);
    },
    [previewUrl, originalPreviewUrl]
  );

  return {
    file,
    setFile,
    originalFile,
    setOriginalFile,
    previewUrl,
    setPreviewUrl,
    originalPreviewUrl,
    setOriginalPreviewUrl,
    isCropped,
    setIsCropped,
    isVideo,
    handleFileSelect,
    resetMediaState,
  };
};

export default useStoryMedia;
