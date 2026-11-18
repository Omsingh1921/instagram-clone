import React from 'react';
import { UploadCloud } from 'lucide-react';

export const PostUploadStep = ({
  fileInputRef,
  handleFilesAdded,
}) => {
  return (
    <div
      className="ig-upload-dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer?.files) {
          handleFilesAdded?.(e.dataTransfer.files);
        }
      }}
      onClick={() => fileInputRef?.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesAdded?.(e.target.files)}
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
      />
      <div className="ig-dropzone-circle">
        <UploadCloud size={44} />
      </div>
      <h3 className="ig-dropzone-title">Select photos and videos</h3>
      <p className="ig-dropzone-desc">
        Supports single images, videos, and carousels with up to 10 items
      </p>
      <button
        type="button"
        className="btn btn-primary ig-browse-files-btn"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef?.current?.click();
        }}
      >
        Select from computer
      </button>
    </div>
  );
};

export default PostUploadStep;
