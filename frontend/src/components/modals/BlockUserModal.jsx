import React, { useState } from 'react';
import Modal from '../common/Modal';
import { settingsService } from '../../services/settings.service';
import { useToast } from '../../context/ToastContext';
import './BlockUserModal.css';

export const BlockUserModal = ({
  isOpen,
  onClose,
  userId,
  username,
  onBlockSuccess,
}) => {
  const [blockFutureAccounts, setBlockFutureAccounts] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  if (!isOpen) return null;

  const handleBlockConfirm = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await settingsService.blockUser(userId, {
        blockFutureAccounts,
        reason: 'NOT_SPECIFIED',
      });
      showSuccess(`Blocked @${username || 'user'}`);
      if (typeof onBlockSuccess === 'function') {
        onBlockSuccess();
      }
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to block user');
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
        <div className="block-modal-header">
          <h3 className="block-modal-title">Block {username ? `@${username}` : 'this user'}?</h3>
          <p className="block-modal-subtitle">
            They won't be able to message you or find your profile, posts or story on Instagram.
            They won't be notified that you blocked them.
          </p>
        </div>

        <div className="block-modal-options">
          <label
            className={`block-option-card ${blockFutureAccounts ? 'selected' : ''}`}
            onClick={() => setBlockFutureAccounts(true)}
          >
            <div className="block-option-radio">
              <input
                type="radio"
                name="blockFutureAccounts"
                checked={blockFutureAccounts}
                onChange={() => setBlockFutureAccounts(true)}
              />
              <span className="custom-radio" />
            </div>
            <div className="block-option-text">
              <strong>Block {username ? `@${username}` : 'user'} and other accounts they may have or create</strong>
            </div>
          </label>

          <label
            className={`block-option-card ${!blockFutureAccounts ? 'selected' : ''}`}
            onClick={() => setBlockFutureAccounts(false)}
          >
            <div className="block-option-radio">
              <input
                type="radio"
                name="blockFutureAccounts"
                checked={!blockFutureAccounts}
                onChange={() => setBlockFutureAccounts(false)}
              />
              <span className="custom-radio" />
            </div>
            <div className="block-option-text">
              <strong>Block {username ? `@${username}` : 'user'}</strong>
            </div>
          </label>
        </div>

        <div className="block-modal-actions">
          <button
            type="button"
            className="block-action-btn danger-btn"
            onClick={handleBlockConfirm}
            disabled={loading}
          >
            {loading ? 'Blocking...' : 'Block'}
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

export default BlockUserModal;

