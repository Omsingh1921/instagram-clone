import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import Avatar from '../common/Avatar';
import './IncomingCallModal.css';

export const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'VIDEO';
  const caller = incomingCall.caller || {};
  const callerName = caller.displayName || caller.fullName || caller.username || 'Instagram User';

  return (
    <div className="incoming-call-overlay" role="dialog" aria-modal="true" aria-label="Incoming Call">
      <div className="incoming-call-card">
        {/* Pulsing Avatar Container */}
        <div className="incoming-call-avatar-container">
          <div className="incoming-call-pulse-ring ring-1" />
          <div className="incoming-call-pulse-ring ring-2" />
          <Avatar
            src={caller.avatarUrl || caller.profilePictureUrl}
            alt={callerName}
            size="xl"
            className="incoming-call-avatar"
          />
        </div>

        {/* Caller Info */}
        <div className="incoming-call-info">
          <h2 className="incoming-call-name">{callerName}</h2>
          <span className="incoming-call-subtext">
            {isVideo ? 'Incoming Instagram Video Call...' : 'Incoming Instagram Audio Call...'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="incoming-call-actions">
          <button
            type="button"
            className="call-action-circle-btn decline-btn"
            onClick={rejectCall}
            title="Decline"
            aria-label="Decline Call"
          >
            <PhoneOff size={28} />
          </button>

          <button
            type="button"
            className="call-action-circle-btn accept-btn"
            onClick={acceptCall}
            title="Accept"
            aria-label="Accept Call"
          >
            {isVideo ? <Video size={28} /> : <Phone size={28} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;

