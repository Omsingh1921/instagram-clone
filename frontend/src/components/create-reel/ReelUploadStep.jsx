import React from 'react';
import { Video } from 'lucide-react';

export const ReelUploadStep = ({ fileInputRef, onFileSelect }) => {
  return (
    <div
      className="ig-upload-dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileSelect(e.target.files?.[0])}
        accept="video/*"
        style={{ display: 'none' }}
      />
      <div className="ig-upload-center-box">
        <div className="ig-dropzone-circle">
          <Video size={36} className="ig-media-main-icon" />
        </div>
        <h3 className="ig-dropzone-title">Upload a Reel Video</h3>
        <p className="ig-dropzone-desc">
          Vertical short videos up to 90 seconds (MP4, MOV, WEBM)
        </p>
        <button
          type="button"
          className="btn btn-primary ig-browse-files-btn"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Select from computer
        </button>
      </div>
    </div>
  );
};

export default ReelUploadStep;
