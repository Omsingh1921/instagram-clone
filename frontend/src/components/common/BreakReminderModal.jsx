import React from 'react';
import { Clock } from 'lucide-react';
import Modal from './Modal';

export const BreakReminderModal = ({
  isOpen,
  minutes,
  onContinue,
  onManageReminder,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onContinue}
      title="Time for a break"
      size="sm"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '14px',
          padding: '6px 4px',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(168, 85, 247, 0.16)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            color: '#c084fc',
          }}
        >
          <Clock size={26} />
        </div>

        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
          You&apos;ve been active on Instagram for{' '}
          <strong>{minutes} minutes</strong>. Step away for a few moments to recharge.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            marginTop: '6px',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={onContinue}
          >
            Continue
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={onManageReminder}
          >
            Manage reminder
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BreakReminderModal;

