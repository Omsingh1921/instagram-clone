/**
 * Helper to format duration in minutes and seconds (mm:ss)
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds == null) return '0:00';
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Extract a high-quality poster frame / thumbnail from a video File
 */
export const extractVideoThumbnail = (fileOrUrl, seekTime = 0.5) => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !document.createElement) {
      resolve({ thumbnailUrl: null, duration: 0 });
      return;
    }

    const isBlob = typeof fileOrUrl !== 'string';
    const url = isBlob ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    if (!url.startsWith('blob:')) {
      v.crossOrigin = 'anonymous';
    }
    v.src = url;

    let hasResolved = false;
    const finish = (result) => {
      if (hasResolved) return;
      hasResolved = true;
      if (isBlob) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      resolve(result);
    };

    const captureFrame = () => {
      try {
        if (!v.videoWidth || !v.videoHeight) {
          finish({ thumbnailUrl: null, duration: Math.floor(v.duration || 0) });
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(v.videoWidth || 640, 640);
        const aspect = (v.videoWidth || 640) / (v.videoHeight || 640);
        canvas.height = Math.round(canvas.width / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl && dataUrl.startsWith('data:image') && dataUrl.length > 50) {
            finish({
              thumbnailUrl: dataUrl,
              duration: Math.floor(v.duration || 0),
              width: v.videoWidth,
              height: v.videoHeight,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Video frame extraction fallback:', err);
      }
      finish({ thumbnailUrl: null, duration: Math.floor(v.duration || 0) });
    };

    v.onloadedmetadata = () => {
      const dur = v.duration || 0;
      const targetTime = Math.min(seekTime, Math.max(0, dur - 0.1));
      v.currentTime = targetTime;
    };

    v.onseeked = () => {
      captureFrame();
    };

    v.onerror = () => finish({ thumbnailUrl: null, duration: 0 });
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    setTimeout(() => finish({ thumbnailUrl: null, duration: Math.floor(v.duration || 0) }), isTestEnv ? 80 : 3000);
    try {
      v.load();
    } catch {}
  });
};

/**
 * Extract an array of evenly spaced filmstrip frames for the mobile-style trimmer
 */
export const extractFilmstripFrames = (fileOrUrl, duration = 15, count = 8) => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !document.createElement || !duration || duration <= 0) {
      resolve([]);
      return;
    }
    const isBlob = typeof fileOrUrl !== 'string';
    const url = isBlob ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    if (!url.startsWith('blob:')) {
      v.crossOrigin = 'anonymous';
    }
    v.src = url;

    const frames = [];
    const interval = duration / count;
    let currentIdx = 0;
    let hasResolved = false;

    const finish = () => {
      if (hasResolved) return;
      hasResolved = true;
      if (isBlob) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      resolve(frames);
    };

    const capture = () => {
      try {
        if (v.videoWidth && v.videoHeight) {
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 60;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
            if (dataUrl && dataUrl.startsWith('data:image')) {
              frames.push(dataUrl);
            }
          }
        }
      } catch (e) {
        console.warn('Filmstrip frame capture error:', e);
      }

      currentIdx++;
      if (currentIdx < count) {
        v.currentTime = Math.min(duration - 0.1, currentIdx * interval + 0.1);
      } else {
        finish();
      }
    };

    v.onloadedmetadata = () => {
      v.currentTime = 0.1;
    };

    v.onseeked = () => {
      capture();
    };

    v.onerror = () => finish();
    setTimeout(() => finish(), 3500);
    try {
      v.load();
    } catch {}
  });
};

/**
 * Generate a cropped File object using off-screen HTML5 Canvas
 */
export const generateCroppedImage = (item, selectedRatio) => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !document.createElement) {
      resolve(item.file);
      return;
    }

    const crop = item.crop || { zoom: 1, panX: 0, panY: 0, rotation: 0 };
    const zoom = crop.zoom || 1;
    const panX = crop.panX || 0;
    const panY = crop.panY || 0;
    const rotation = (crop.rotation || 0) * (Math.PI / 180);
    const box = crop.customCropBox;

    const hasCustomCrop = box && (box.width < 99.5 || box.height < 99.5 || box.x > 0.5 || box.y > 0.5);

    // If default zoom/pan/rotation, no custom box, and original ratio, return original file
    if (
      !hasCustomCrop &&
      zoom === 1 &&
      panX === 0 &&
      panY === 0 &&
      (crop.rotation || 0) === 0 &&
      (selectedRatio.id === 'ORIGINAL' || selectedRatio.id === 'CUSTOM')
    ) {
      resolve(item.file);
      return;
    }

    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const safetyTimer = setTimeout(() => {
      resolve(item.file);
    }, isTestEnv ? 80 : 3000);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(safetyTimer);
      try {
        let canvasWidth = 1080;
        let canvasHeight = 1080;

        // 1. Custom Interactive Bounding Box Crop Mode
        if (hasCustomCrop) {
          const srcX = Math.max(0, Math.round((box.x / 100) * img.naturalWidth));
          const srcY = Math.max(0, Math.round((box.y / 100) * img.naturalHeight));
          const srcW = Math.max(1, Math.min(img.naturalWidth - srcX, Math.round((box.width / 100) * img.naturalWidth)));
          const srcH = Math.max(1, Math.min(img.naturalHeight - srcY, Math.round((box.height / 100) * img.naturalHeight)));

          const targetAspect = srcW / srcH;
          canvasWidth = Math.min(Math.max(srcW, 800), 1920);
          canvasHeight = Math.round(canvasWidth / targetAspect);

          const canvas = document.createElement('canvas');
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(item.file);
            return;
          }

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          ctx.save();
          if (rotation) {
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.rotate(rotation);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
          } else {
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvasWidth, canvasHeight);
          }
          ctx.restore();

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(item.file);
                return;
              }
              const croppedFile = new File(
                [blob],
                (item.file.name || 'image').replace(/\.[^/.]+$/, '') + '_cropped.jpg',
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(croppedFile);
            },
            'image/jpeg',
            0.92
          );
          return;
        }

        // 2. Standard Aspect Ratio + Zoom/Pan Crop Mode
        let targetAspect = img.naturalWidth / img.naturalHeight;
        if (selectedRatio.id === '1:1') targetAspect = 1.0;
        else if (selectedRatio.id === '4:5') targetAspect = 0.8;
        else if (selectedRatio.id === '16:9') targetAspect = 16 / 9;

        canvasWidth = 1080;
        canvasHeight = Math.round(canvasWidth / targetAspect);
        if (targetAspect < 1) {
          canvasHeight = 1350;
          canvasWidth = Math.round(canvasHeight * targetAspect);
        }

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(item.file);
          return;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        if (rotation) ctx.rotate(rotation);
        ctx.scale(zoom, zoom);

        const scale = Math.max(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
        const drawWidth = img.naturalWidth * scale;
        const drawHeight = img.naturalHeight * scale;

        const panScale = canvasWidth / 450;
        ctx.drawImage(
          img,
          -drawWidth / 2 + panX * panScale,
          -drawHeight / 2 + panY * panScale,
          drawWidth,
          drawHeight
        );
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(item.file);
              return;
            }
            const croppedFile = new File(
              [blob],
              (item.file.name || 'image').replace(/\.[^/.]+$/, '') + '_cropped.jpg',
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(croppedFile);
          },
          'image/jpeg',
          0.92
        );
      } catch (err) {
        console.warn('Canvas cropping fallback:', err);
        resolve(item.file);
      }
    };

    img.onerror = () => {
      clearTimeout(safetyTimer);
      resolve(item.file);
    };
    img.src = item.originalPreviewUrl || item.previewUrl;
  });
};
