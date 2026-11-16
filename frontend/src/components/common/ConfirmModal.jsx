import React from 'react';
import { AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import Modal from './Modal';
import './ConfirmModal.css';

const VARIANT_ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  primary: ShieldAlert,
};

/**
 * Centered custom confirmation modal replacing native browser confirm() dialogs.
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingLabel,
  variant = 'danger',
  icon: CustomIcon = null,
  metaLabel = '',
  thumbnailUrl = null,
  isProcessing = false,
}) => {
  const Icon = CustomIcon || VARIANT_ICONS[variant] || AlertTriangle;

  const handleSafeClose = () => {
    if (!isProcessing) {
      onClose?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSafeClose}
      size="sm"
      showCloseButton={false}
      className="confirm-modal-shell"
    >
      <div className="confirm-modal-body">
        <div className={`confirm-modal-icon-badge ${variant}`} aria-hidden="true">
          <Icon size={22} />
        </div>

        <h3 className="confirm-modal-title">{title}</h3>

        {description && <p className="confirm-modal-description">{description}</p>}

        {(metaLabel || thumbnailUrl) && (
          <div className="confirm-modal-meta-pill">
            {thumbnailUrl && (
              <img src={thumbnailUrl} alt="" className="confirm-modal-meta-thumb" />
            )}
            {metaLabel && <span className="confirm-modal-meta-text">{metaLabel}</span>}
          </div>
        )}

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-btn cancel"
            onClick={handleSafeClose}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn confirm ${variant}`}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? loadingLabel || `${confirmLabel}...` : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

