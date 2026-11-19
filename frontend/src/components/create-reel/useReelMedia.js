import { useState, useRef, useCallback } from 'react';
import { extractVideoThumbnail, extractFilmstripFrames } from '../create-post';

export const useReelMedia = ({ showError, onFileSelected, onMetadataLoaded }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [filmstripFrames, setFilmstripFrames] = useState([]);
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState(null);

  const fileInputRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const canvasRef = useRef(null);

  const resetMedia = useCallback((keepThumbnailUrl = null) => {
    if (previewUrl && previewUrl !== keepThumbnailUrl && previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setFile(null);
    setPreviewUrl('');
    setVideoDuration(0);
    setFilmstripFrames([]);
    setCustomThumbnailUrl(null);
  }, [previewUrl]);

  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      showError?.('Please select a video file for your reel (MP4, MOV, WEBM).');
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      showError?.('Reel video exceeds 100MB limit.');
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);

    // Immediately transition to EDIT step synchronously
    onFileSelected?.({ file: selectedFile, url });

    // Asynchronously extract duration, initial poster, and filmstrip frames
    try {
      const info = await extractVideoThumbnail(selectedFile, 0.5);
      const dur = info?.duration || 15;
      setVideoDuration(dur);
      if (info?.thumbnailUrl) {
        setCustomThumbnailUrl(info.thumbnailUrl);
      }
      const frames = await extractFilmstripFrames(selectedFile, dur, 8);
      if (frames && frames.length > 0) {
        setFilmstripFrames(frames);
      }
      onMetadataLoaded?.({ duration: dur, thumbnailUrl: info?.thumbnailUrl });
    } catch (err) {
      console.warn('Reel metadata extraction warning:', err);
    }
  }, [showError, onFileSelected, onMetadataLoaded]);

  const captureThumbnailBlob = useCallback(() => {
    return new Promise((resolve) => {
      const video = videoPreviewRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        resolve(null);
        return;
      }
      try {
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 854;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      } catch {
        resolve(null);
      }
    });
  }, []);

  return {
    file,
    setFile,
    previewUrl,
    setPreviewUrl,
    videoDuration,
    setVideoDuration,
    filmstripFrames,
    setFilmstripFrames,
    customThumbnailUrl,
    setCustomThumbnailUrl,
    fileInputRef,
    videoPreviewRef,
    canvasRef,
    handleFileSelect,
    captureThumbnailBlob,
    resetMedia,
  };
};

export default useReelMedia;
