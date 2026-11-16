import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import './ProfileGearMenuModal.css';

export const ProfileGearMenuModal = ({
  isOpen,
  onClose,
  onOpenQr,
  onOpenMetaVerified,
  onLogout,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      size="sm"
      className="profile-gear-menu-dialog"
    >
      <div className="gear-menu-list">
        <button
          type="button"
          className="gear-menu-item"
          onClick={() => handleNavigate('/settings?tab=apps_and_websites')}
        >
          Apps and websites
        </button>

        <button
          type="button"
          className="gear-menu-item"
          onClick={() => {
            onClose();
            if (onOpenQr) onOpenQr();
          }}
        >
          QR code
        </button>

        <button
          type="button"
          className="gear-menu-item"
          onClick={() => handleNavigate('/settings?tab=notifications')}
        >
          Notifications
        </button>

        <button
          type="button"
          className="gear-menu-item"
          onClick={() => handleNavigate('/settings')}
        >
          Settings and privacy
        </button>

        <button
          type="button"
          className="gear-menu-item"
          onClick={() => {
            onClose();
            if (onOpenMetaVerified) onOpenMetaVerified();
          }}
        >
          Meta Verified
        </button>

        <button
          type="button"
          className="gear-menu-item"
          onClick={() => handleNavigate('/settings?tab=supervision')}
        >
          Supervision
        </button>

        <button
          type="button"
          className="gear-menu-item"
          onClick={() => handleNavigate('/settings?tab=sessions')}
        >
          Login activity
        </button>

        <button
          type="button"
          className="gear-menu-item danger"
          onClick={() => {
            onClose();
            if (onLogout) onLogout();
          }}
        >
          Log out
        </button>

        <button
          type="button"
          className="gear-menu-item cancel-item"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default ProfileGearMenuModal;
