import React from 'react';
import { CheckCircle2, ShieldCheck, Headphones, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import './MetaVerifiedModal.css';

export const MetaVerifiedModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meta Verified"
      size="sm"
      className="meta-verified-dialog"
    >
      <div className="meta-verified-content">
        <div className="meta-verified-badge-icon">
          <CheckCircle2 size={48} className="verified-blue-badge" />
        </div>

        <h3 className="meta-verified-heading">Build trust with Meta Verified</h3>
        <p className="meta-verified-subtext">
          A verified badge, proactive account protection, and direct account support for creators and businesses.
        </p>

        <div className="meta-verified-features">
          <div className="meta-feature-row">
            <CheckCircle2 size={20} className="meta-feature-icon" />
            <div>
              <strong>A verified badge</strong>
              <p>Your followers and community can be confident that you’re the real you.</p>
            </div>
          </div>

          <div className="meta-feature-row">
            <ShieldCheck size={20} className="meta-feature-icon" />
            <div>
              <strong>Proactive account protection</strong>
              <p>Get protection from impersonation with proactive account monitoring.</p>
            </div>
          </div>

          <div className="meta-feature-row">
            <Headphones size={20} className="meta-feature-icon" />
            <div>
              <strong>Direct support</strong>
              <p>Get help from a real person on common account issues that matter to you.</p>
            </div>
          </div>

          <div className="meta-feature-row">
            <Sparkles size={20} className="meta-feature-icon" />
            <div>
              <strong>Exclusive features</strong>
              <p>Access unique stickers on Stories and Reels and enhanced reach capabilities.</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary meta-verified-subscribe-btn"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </Modal>
  );
};

export default MetaVerifiedModal;
