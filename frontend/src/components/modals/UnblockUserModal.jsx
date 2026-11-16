import React, { useState } from 'react';
import Modal from '../common/Modal';
import { settingsService } from '../../services/settings.service';
import { useToast } from '../../context/ToastContext';
import './BlockUserModal.css';

export const UnblockUserModal = ({
  isOpen,
  onClose,
  userId,
  username,
  onUnblockSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  if (!isOpen) return null;

  const handleUnblockConfirm = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await settingsService.unblockUser(userId);
      showSuccess(`Unblocked @${username || 'user'}`);
      if (typeof onUnblockSuccess === 'function') {
        onUnblockSuccess();
      }
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to unblock user');
    } finally {
      setLoading(false);
    }
  };

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
          <h3 className="block-modal-title">Unblock {username ? `@${username}` : 'this user'}?</h3>
          <p className="block-modal-subtitle">
            They will now be able to find your profile, posts and stories, and message you on Instagram.
            They won't be notified that you unblocked them.
          </p>
        </div>

        <div className="block-modal-actions">
          <button
            type="button"
            className="block-action-btn primary-btn"
            style={{ color: 'var(--ig-primary-button, #0095f6)', fontWeight: '700', borderBottom: '1px solid var(--border-color, #363636)' }}
            onClick={handleUnblockConfirm}
            disabled={loading}
          >
            {loading ? 'Unblocking...' : 'Unblock'}
          </button>
          <button
            type="button"
            className="block-action-btn cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UnblockUserModal;

