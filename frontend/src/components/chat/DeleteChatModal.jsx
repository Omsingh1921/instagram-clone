import React from 'react';
import Modal from '../common/Modal';

export const DeleteChatModal = ({ isOpen, onClose, onConfirmDelete, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      size="sm"
      className="block-user-modal-dialog"
    >
      <div className="block-modal-wrapper">
        <div className="block-modal-header" style={{ paddingBottom: '20px' }}>
          <h3 className="block-modal-title">Delete chat?</h3>
          <p className="block-modal-subtitle">
            Deleting removes the chat from your inbox, but other people in the chat will still be able to see it.
          </p>
        </div>
        <div className="block-modal-actions">
          <button
            type="button"
            className="block-action-btn danger-btn"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            className="block-action-btn cancel-btn"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteChatModal;
