import React from 'react';
import { UploadCloud } from 'lucide-react';

export const StoryMediaPicker = ({ fileInputRef, handleFileSelect }) => {
  return (
    <div
      className="story-dropzone"
      onClick={() => fileInputRef?.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dropped = e.dataTransfer?.files?.[0];
        if (dropped) handleFileSelect?.(dropped);
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect?.(e.target.files?.[0])}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />
      <div className="story-dropzone-circle">
        <UploadCloud size={38} />
      </div>
      <h3 className="story-dropzone-title">Upload a Story</h3>
      <p className="story-dropzone-desc">Photos and videos that expire in 24 hours</p>
      <button type="button" className="story-dropzone-btn">
        Select Photo or Video
      </button>
    </div>
  );
};

export const StoryUploadDropzone = StoryMediaPicker;
export default StoryMediaPicker;
