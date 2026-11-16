import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';

const UploadContext = createContext(null);

export const useUpload = () => {
  const context = useContext(UploadContext);
  return context || null;
};

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]);
  const { showSuccess, showError } = useToast() || {};
  const tasksRef = useRef(new Map());

  // Dismiss / Cancel an upload item
  const dismissUpload = useCallback((id) => {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      if (item?.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.thumbnail);
        } catch {
          // ignore
        }
      }
      if (Array.isArray(item?.mediaItems)) {
        item.mediaItems.forEach((m) => {
          if (m?.previewUrl && typeof m.previewUrl === 'string' && m.previewUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(m.previewUrl);
            } catch {
              // ignore
            }
          }
        });
      }
      return prev.filter((u) => u.id !== id);
    });
    tasksRef.current.delete(id);
  }, []);

  // Worker runner
  const runUploadTask = useCallback(
    async (id, taskFn, type, title) => {
      const updateProgress = (progress, statusMessage) => {
        setUploads((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  progress: Math.min(100, Math.max(0, Math.round(progress))),
                  statusMessage: statusMessage || item.statusMessage,
                }
              : item
          )
        );
      };

      try {
        updateProgress(15, 'Preparing & optimizing media...');
        await taskFn(updateProgress);

        // Mark Success
        setUploads((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'success',
                  progress: 100,
                  statusMessage: item.type === 'story' ? 'Story added! ✓' : 'Shared! ✓',
                }
              : item
          )
        );

        // Global Event Dispatch & Toast Notification
        if (type === 'story') {
          window.dispatchEvent(new CustomEvent('story:refresh'));
          if (showSuccess) showSuccess('Story added! It will be visible for 24 hours. ✓');
        } else if (type === 'reel') {
          window.dispatchEvent(new CustomEvent('reel:refresh'));
          window.dispatchEvent(new CustomEvent('feed:refresh'));
          if (showSuccess) showSuccess('Reel shared successfully! ✓');
        } else {
          window.dispatchEvent(new CustomEvent('feed:refresh'));
          window.dispatchEvent(new CustomEvent('post:refresh'));
          if (showSuccess) showSuccess('Post shared successfully! ✓');
        }

        // Auto-dismiss success notification after 3.5s
        setTimeout(() => {
          dismissUpload(id);
        }, 3500);
      } catch (err) {
        console.error(`Background upload error for ${type} (${id}):`, err);
        const errorMsg = err.message || 'Upload failed. Tap to retry.';
        setUploads((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'error',
                  error: errorMsg,
                  statusMessage: 'Upload failed',
                }
              : item
          )
        );
        if (showError) showError(`${title || 'Upload'} failed: ${errorMsg}`);
      }
    },
    [showSuccess, showError, dismissUpload]
  );

  // Start background upload
  const startUpload = useCallback(
    ({ type = 'post', title = 'New Upload', thumbnail = '', task, ...rest }) => {
      const id = 'up_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      const newUpload = {
        id,
        type, // 'post' | 'reel' | 'story'
        title,
        thumbnail,
        status: 'uploading', // 'uploading' | 'success' | 'error'
        progress: 10,
        statusMessage: 'Sharing...',
        error: null,
        createdAt: Date.now(),
        ...rest,
      };

      tasksRef.current.set(id, task);
      setUploads((prev) => [newUpload, ...prev]);

      // Fire asynchronously in background
      setTimeout(() => {
        runUploadTask(id, task, type, title);
      }, 50);

      return id;
    },
    [runUploadTask]
  );

  // Retry failed upload
  const retryUpload = useCallback(
    (id) => {
      const taskFn = tasksRef.current.get(id);
      if (!taskFn) return;

      setUploads((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'uploading',
                progress: 10,
                error: null,
                statusMessage: 'Retrying upload...',
              }
            : item
        )
      );

      const item = uploads.find((u) => u.id === id);
      runUploadTask(id, taskFn, item?.type || 'post', item?.title || 'Upload');
    },
    [uploads, runUploadTask]
  );

  return (
    <UploadContext.Provider
      value={{
        uploads,
        startUpload,
        retryUpload,
        dismissUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export default UploadContext;

