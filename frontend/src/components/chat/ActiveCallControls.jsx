import React from 'react';
import { Phone, Video, PhoneCall, Users } from 'lucide-react';

export const ActiveCallControls = ({
  isGroup,
  activeConversation,
  activeGroupCallBanner,
  onStartGroupCall,
  onVoiceCall,
  onVideoCall,
  isInRequests,
}) => {
  return (
    <>
      {/* Live Active Group Call Banner */}
      {isGroup && activeGroupCallBanner && activeGroupCallBanner.id && (
        <div className="active-group-call-banner">
          <div className="active-group-call-banner-left">
            <span className="live-call-pulse-dot" />
            <span className="live-call-label">
              Group {activeGroupCallBanner.callType === 'AUDIO' ? 'Audio' : 'Video'} Call in progress
            </span>
            {activeGroupCallBanner.participants && activeGroupCallBanner.participants.length > 0 && (
              <span className="live-call-participants-pill">
                {activeGroupCallBanner.participants.length} in call
              </span>
            )}
          </div>
          <button
            type="button"
            className="join-group-call-banner-btn"
            onClick={() =>
              onStartGroupCall?.(
                activeConversation,
                activeGroupCallBanner.callType || 'VIDEO'
              )
            }
          >
            <Phone size={14} />
            <span>Join Call</span>
          </button>
        </div>
      )}
    </>
  );
};

export default ActiveCallControls;
