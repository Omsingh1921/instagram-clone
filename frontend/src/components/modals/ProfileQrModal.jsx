import React from 'react';
import { Copy, Check } from 'lucide-react';
import Modal from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import './ProfileQrModal.css';

export const ProfileQrModal = ({ isOpen, onClose, username, profileUrl }) => {
  const [copied, setCopied] = React.useState(false);
  const { showSuccess } = useToast();

  const fullUrl = profileUrl || `${window.location.origin}/profile/${username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    showSuccess('Profile link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code" size="sm">
      <div className="profile-qr-modal-container">
        <div className="profile-qr-card">
          <div className="profile-qr-username">@{username}</div>

          <div className="profile-qr-code-wrapper">
            {/* High visual fidelity Instagram branded QR pattern */}
            <svg
              width="180"
              height="180"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position markers */}
              <rect x="5" y="5" width="26" height="26" rx="4" stroke="#000" strokeWidth="4" />
              <rect x="11" y="11" width="14" height="14" rx="2" fill="#000" />

              <rect x="69" y="5" width="26" height="26" rx="4" stroke="#000" strokeWidth="4" />
              <rect x="75" y="11" width="14" height="14" rx="2" fill="#000" />

              <rect x="5" y="69" width="26" height="26" rx="4" stroke="#000" strokeWidth="4" />
              <rect x="11" y="75" width="14" height="14" rx="2" fill="#000" />

              {/* Data dots pattern */}
              <rect x="36" y="8" width="6" height="6" fill="#000" />
              <rect x="46" y="8" width="6" height="6" fill="#000" />
              <rect x="56" y="8" width="6" height="6" fill="#000" />
              <rect x="36" y="18" width="6" height="6" fill="#000" />
              <rect x="46" y="18" width="6" height="6" fill="#000" />

              <rect x="8" y="36" width="6" height="6" fill="#000" />
              <rect x="18" y="36" width="6" height="6" fill="#000" />
              <rect x="28" y="36" width="6" height="6" fill="#000" />
              <rect x="38" y="36" width="6" height="6" fill="#000" />
              <rect x="48" y="36" width="6" height="6" fill="#000" />
              <rect x="58" y="36" width="6" height="6" fill="#000" />
              <rect x="68" y="36" width="6" height="6" fill="#000" />
              <rect x="78" y="36" width="6" height="6" fill="#000" />
              <rect x="86" y="36" width="6" height="6" fill="#000" />

              <rect x="36" y="46" width="6" height="6" fill="#000" />
              <rect x="56" y="46" width="6" height="6" fill="#000" />
              <rect x="66" y="46" width="6" height="6" fill="#000" />
              <rect x="76" y="46" width="6" height="6" fill="#000" />
              <rect x="86" y="46" width="6" height="6" fill="#000" />

              <rect x="8" y="48" width="6" height="6" fill="#000" />
              <rect x="18" y="56" width="6" height="6" fill="#000" />
              <rect x="28" y="48" width="6" height="6" fill="#000" />
              <rect x="38" y="58" width="6" height="6" fill="#000" />
              <rect x="48" y="58" width="6" height="6" fill="#000" />
              <rect x="58" y="58" width="6" height="6" fill="#000" />

              <rect x="36" y="68" width="6" height="6" fill="#000" />
              <rect x="46" y="68" width="6" height="6" fill="#000" />
              <rect x="56" y="68" width="6" height="6" fill="#000" />
              <rect x="66" y="68" width="6" height="6" fill="#000" />
              <rect x="76" y="68" width="6" height="6" fill="#000" />
              <rect x="86" y="68" width="6" height="6" fill="#000" />

              <rect x="36" y="78" width="6" height="6" fill="#000" />
              <rect x="46" y="78" width="6" height="6" fill="#000" />
              <rect x="66" y="78" width="6" height="6" fill="#000" />
              <rect x="86" y="78" width="6" height="6" fill="#000" />

              <rect x="36" y="86" width="6" height="6" fill="#000" />
              <rect x="56" y="86" width="6" height="6" fill="#000" />
              <rect x="76" y="86" width="6" height="6" fill="#000" />
            </svg>
          </div>

          <div className="profile-qr-footer-brand">INSTAGRAM</div>
        </div>

        <div className="profile-qr-actions">
          <button type="button" className="profile-qr-btn primary" onClick={handleCopyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Profile Link'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileQrModal;
