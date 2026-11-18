import React from 'react';
import { Phone, PhoneOff, Video, Users } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import Avatar from '../common/Avatar';
import './IncomingCallModal.css';

export const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'VIDEO';
  const isGroup = !!incomingCall.isGroup;
  const caller = incomingCall.caller || {};
  const callerName = caller.displayName || caller.fullName || caller.username || 'Instagram User';
  const title = isGroup ? (incomingCall.groupName || 'Group Call') : callerName;
  const subtext = isGroup
    ? `${isVideo ? 'Group Video Call' : 'Group Audio Call'} • ${caller.username ? `@${caller.username}` : callerName}`
    : `${isVideo ? 'Incoming Instagram Video Call...' : 'Incoming Instagram Audio Call...'}`;

  return (
    <div className="incoming-call-overlay" role="dialog" aria-modal="true" aria-label="Incoming Call">
      <div className="incoming-call-card">
        {/* Pulsing Avatar Container */}
        <div className="incoming-call-avatar-container">
          <div className="incoming-call-pulse-ring ring-1" />
          <div className="incoming-call-pulse-ring ring-2" />
          {isGroup && !incomingCall.groupAvatarUrl ? (
            <div className="incoming-group-avatar-bubble">
              <Users size={40} color="#fff" />
            </div>
          ) : (
            <Avatar
              src={isGroup ? incomingCall.groupAvatarUrl : (caller.avatarUrl || caller.profilePictureUrl)}
              alt={title}
              size="xl"
              className="incoming-call-avatar"
            />
          )}
        </div>

        {/* Caller Info */}
        <div className="incoming-call-info">
          <h2 className="incoming-call-name">{title}</h2>
          <span className="incoming-call-subtext">{subtext}</span>
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
            title={isGroup ? 'Join Call' : 'Accept'}
            aria-label={isGroup ? 'Join Call' : 'Accept Call'}
          >
            {isVideo ? <Video size={28} /> : <Phone size={28} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;

