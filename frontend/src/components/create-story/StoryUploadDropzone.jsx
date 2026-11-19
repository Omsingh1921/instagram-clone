import React from 'react';
import { UploadCloud } from 'lucide-react';

export const StoryUploadDropzone = ({ fileInputRef, handleFileSelect }) => {
  return (
    <div className="story-dropzone" onClick={() => fileInputRef?.current?.click()}>
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

export default StoryUploadDropzone;
