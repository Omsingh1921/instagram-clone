import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Minimize2,
  Maximize2,
  Settings,
  Headphones,
  ScreenShare,
  X,
  Users,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import './ActiveCallModal.css';

const formatDuration = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ActiveCallModal = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    remoteStreams = {},
    groupParticipants = [],
    isMuted,
    isVideoOff,
    isScreenSharing,
    callDuration,
    isMinimized,
    callStatusText,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleMinimize,
  } = useCall();

  const { user: currentUser } = useAuth();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [audioDeviceName, setAudioDeviceName] = useState('Microphone Array (Realtek(R) Audio)');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Enumerate user audio devices for Instagram Web status pill
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioInput = devices.find((d) => d.kind === 'audioinput' && d.label);
        if (audioInput && audioInput.label) {
          setAudioDeviceName(audioInput.label);
        }
      }).catch(() => {});
    }
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const isCaller = activeCall?.isCaller;
  const isGroupCall = !!activeCall?.isGroup;
  const groupName = activeCall?.groupName || 'Group Call';
  const groupAvatarUrl = activeCall?.groupAvatarUrl;
  const currentUserId = currentUser?.id || currentUser?.userId;
  const otherParticipants = (groupParticipants || []).filter(
    (p) => (p.id || p.userId) !== currentUserId
  );

  const peer = isCaller ? (activeCall?.recipient || {}) : (activeCall?.caller || {});
  const peerName = peer.displayName || peer.fullName || peer.username || 'Instagram User';
  const currentUserName = currentUser?.fullName || currentUser?.displayName || currentUser?.username || 'You';
  const hasRemoteVideo = !!(remoteStream && remoteStream.getVideoTracks().length > 0 && remoteStream.getVideoTracks().some((t) => t.enabled && t.readyState !== 'ended'));
  const hasLocalVideo = !!(
    !isVideoOff &&
    localStream &&
    localStream.getVideoTracks().length > 0 &&
    localStream.getVideoTracks().some((t) => t.enabled && t.readyState !== 'ended')
  );
  const isVideoCall = activeCall?.callType === 'VIDEO';

  // Attach local stream to local <video>
  useEffect(() => {
    if (localVideoRef.current && localStream && hasLocalVideo) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play?.().catch(() => {});
    }
  }, [localStream, hasLocalVideo, isMinimized]);

  // Attach remote stream to remote <video>
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && hasRemoteVideo) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play?.().catch((err) => {
        console.warn('[ActiveCallModal] Remote video play notice:', err);
      });
    }
  }, [remoteStream, hasRemoteVideo, isMinimized]);

  // Dedicated audio playback: plays incoming audio for audio calls, video calls, and minimized mode
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play?.().catch((err) => {
        console.warn('[ActiveCallModal] Remote audio auto-play notice:', err);
      });
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  // Minimized Floating Pill UI (docked at bottom-right while user browses)
  const renderContent = () => {
    if (isMinimized) {
      return (
        <div className="active-call-docked-pill" onClick={toggleMinimize} title="Click to maximize call">
          <div className="docked-pill-avatar">
            {isGroupCall && !groupAvatarUrl ? (
              <div className="docked-pill-group-bubble">
                <Users size={16} color="#fff" />
              </div>
            ) : (
              <Avatar
                src={isGroupCall ? groupAvatarUrl : (peer.avatarUrl || peer.profilePictureUrl)}
                alt={isGroupCall ? groupName : peerName}
                size="xs"
              />
            )}
          </div>
          <div className="docked-pill-info">
            <span className="docked-pill-name">{isGroupCall ? groupName : peerName}</span>
            <span className="docked-pill-timer">
              {callDuration > 0 ? formatDuration(callDuration) : (callStatusText || 'Connected')}
              {isGroupCall && ` • ${groupParticipants.length} in call`}
            </span>
          </div>
          <button
            type="button"
            className="docked-pill-btn expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            title="Maximize"
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            className="docked-pill-btn end-btn"
            onClick={(e) => {
              e.stopPropagation();
              endCall();
            }}
            title={isGroupCall ? 'Leave Call' : 'End Call'}
          >
            <PhoneOff size={16} />
          </button>
        </div>
      );
    }

    return (
      <div className="active-call-modal-overlay" role="dialog" aria-modal="true">
        <div className="active-call-viewport">
          {/* Top Header Bar */}
          <div className="active-call-header">
            {/* Identity / Title (Top Left) */}
            <div className="active-call-caller-identity">
              {isGroupCall ? (
                <>
                  {groupAvatarUrl ? (
                    <Avatar src={groupAvatarUrl} alt={groupName} size="xs" className="active-call-caller-avatar" />
                  ) : (
                    <div className="active-call-group-header-avatar">
                      <Users size={16} color="#fff" />
                    </div>
                  )}
                  <div className="active-call-group-header-text">
                    <span className="active-call-caller-name">{groupName}</span>
                    <span className="active-call-group-count">
                      <Users size={12} /> {groupParticipants.length} in call • {formatDuration(callDuration)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Avatar
                    src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
                    alt={currentUserName}
                    size="xs"
                    className="active-call-caller-avatar"
                  />
                  <span className="active-call-caller-name">{currentUserName}</span>
                </>
              )}
            </div>

            {/* Top Right Controls & Device Status */}
            <div className="active-call-top-right">
              <div className="active-call-device-pill" title="Audio Device Status">
                <Headphones size={18} className="device-pill-icon" />
                <div className="device-pill-text">
                  <span className="device-pill-heading">Connected microphone and speaker:</span>
                  <span className="device-pill-device">{audioDeviceName}</span>
                </div>
              </div>

              <button
                type="button"
                className="call-header-icon-btn"
                onClick={() => setShowSettings((p) => !p)}
                title="Call Settings"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>

              <button
                type="button"
                className="call-header-icon-btn"
                onClick={handleToggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                aria-label="Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>

              <button
                type="button"
                className="call-header-icon-btn"
                onClick={toggleMinimize}
                title="Minimize to floating window"
                aria-label="Minimize"
              >
                <Minimize2 size={18} style={{ opacity: 0.7 }} />
              </button>
            </div>
          </div>

          {/* Settings Popover */}
          {showSettings && (
            <div className="active-call-settings-popover">
              <div className="settings-popover-header">
                <span>Audio & Video Settings</span>
                <button
                  type="button"
                  className="settings-close-btn"
                  onClick={() => setShowSettings(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="settings-popover-body">
                <div className="settings-device-row">
                  <span className="settings-label">Microphone</span>
                  <span className="settings-value">{audioDeviceName}</span>
                </div>
                <div className="settings-device-row">
                  <span className="settings-label">Speaker</span>
                  <span className="settings-value">Default Output Device</span>
                </div>
                <div className="settings-device-row">
                  <span className="settings-label">Camera</span>
                  <span className="settings-value">{isVideoOff ? 'Disabled' : 'Enabled'}</span>
                </div>
                <div className="settings-device-row">
                  <span className="settings-label">Status</span>
                  <span className="settings-status-online">
                    {isGroupCall ? `● Mesh Connected (${groupParticipants.length} members)` : '● P2P WebRTC Connected'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Video / Media Canvas Area */}
          <div className="active-call-media-stage">
            {isGroupCall ? (
              /* Group Call Grid Layout */
              <div className={`active-call-group-grid group-cols-${Math.min(3, Math.max(1, otherParticipants.length + 1))}`}>
                {/* Local User Tile */}
                <div className="group-participant-tile local-tile">
                  {hasLocalVideo ? (
                    <video
                      ref={(el) => {
                        localVideoRef.current = el;
                        if (el && localStream && el.srcObject !== localStream) {
                          el.srcObject = localStream;
                          el.play?.().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="group-tile-video"
                    />
                  ) : (
                    <div className="group-tile-audio-placeholder">
                      <Avatar
                        src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
                        alt={currentUserName}
                        size="lg"
                        className="group-tile-avatar"
                      />
                      <span className="group-tile-name">{currentUserName}</span>
                    </div>
                  )}
                  <div className="group-tile-badge">
                    <span>{currentUserName} (You)</span>
                    {isMuted ? <MicOff size={14} color="#ed4956" /> : <Mic size={14} color="#4ade80" />}
                  </div>
                </div>

                {/* Remote Participant Tiles */}
                {otherParticipants.map((p) => {
                  const pId = p.id || p.userId;
                  const pName = p.displayName || p.fullName || p.username || 'Member';
                  const pStream = remoteStreams[pId];
                  const pHasVideo = pStream && pStream.getVideoTracks().length > 0 &&
                    pStream.getVideoTracks().some((t) => t.enabled && t.readyState !== 'ended');

                  return (
                    <div key={pId} className="group-participant-tile remote-tile">
                      {pHasVideo ? (
                        <video
                          ref={(el) => {
                            if (el && pStream && el.srcObject !== pStream) {
                              el.srcObject = pStream;
                              el.play?.().catch(() => {});
                            }
                          }}
                          autoPlay
                          playsInline
                          className="group-tile-video"
                        />
                      ) : (
                        <div className="group-tile-audio-placeholder">
                          <Avatar
                            src={p.avatarUrl || p.profilePictureUrl}
                            alt={pName}
                            size="lg"
                            className="group-tile-avatar pulsing-avatar"
                          />
                          <span className="group-tile-name">{pName}</span>
                        </div>
                      )}
                      <div className="group-tile-badge">
                        <span>{pName}</span>
                        <Mic size={14} color="#4ade80" />
                      </div>
                      {pStream && (
                        <audio
                          ref={(el) => {
                            if (el && el.srcObject !== pStream) {
                              el.srcObject = pStream;
                              el.play?.().catch(() => {});
                            }
                          }}
                          autoPlay
                          playsInline
                        />
                      )}
                    </div>
                  );
                })}

                {/* If only local user is in the group call */}
                {otherParticipants.length === 0 && (
                  <div className="group-participant-tile group-waiting-tile">
                    <div className="group-waiting-content">
                      <Users size={32} color="rgba(255, 255, 255, 0.4)" />
                      <span className="group-waiting-text">Waiting for others to join...</span>
                      <span className="group-waiting-sub">Group members can join anytime</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 1:1 Direct Call Canvas */
              <>
                {hasRemoteVideo ? (
                  <video
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteStream && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                        el.muted = true;
                        el.play?.().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="active-call-remote-video"
                  />
                ) : (
                  <div className="active-call-audio-stage">
                    <Avatar
                      src={peer.avatarUrl || peer.profilePictureUrl}
                      alt={peerName}
                      size="xl"
                      className="audio-stage-avatar"
                    />
                    <span className="audio-stage-name">{peerName}</span>
                    <span className="audio-stage-sub">
                      {callDuration > 0 ? formatDuration(callDuration) : (callStatusText || 'Calling...')}
                    </span>
                  </div>
                )}

                {/* Picture-in-Picture Local Video Feed (Bottom Right) */}
                {isVideoCall && (
                  <div className={`active-call-pip-container ${!hasLocalVideo ? 'pip-video-off' : ''}`}>
                    {hasLocalVideo ? (
                      <video
                        ref={(el) => {
                          localVideoRef.current = el;
                          if (el && localStream && el.srcObject !== localStream) {
                            el.srcObject = localStream;
                            el.play?.().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="active-call-pip-video"
                      />
                    ) : (
                      <div className="active-call-pip-placeholder">
                        <VideoOff size={18} color="#8e8e8e" />
                        <span>Camera off</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Floating Call Control Action Bar */}
          <div className="active-call-controls-bar">
            {/* Screen Share / Window Share */}
            <button
              type="button"
              className={`call-control-btn ${isScreenSharing ? 'active-on' : ''}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop screen share' : 'Share your screen'}
              aria-label="Toggle Screen Share"
            >
              <ScreenShare size={22} />
            </button>

            {/* Toggle Camera */}
            <button
              type="button"
              className={`call-control-btn ${isVideoOff ? 'active-off' : ''}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              aria-label="Toggle Camera"
            >
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            {/* Toggle Microphone */}
            <button
              type="button"
              className={`call-control-btn ${isMuted ? 'active-off' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-label="Toggle Microphone"
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* End / Leave Call Button */}
            <button
              type="button"
              className="call-control-btn end-call-btn"
              onClick={endCall}
              title={isGroupCall ? 'Leave Call' : 'End Call'}
              aria-label={isGroupCall ? 'Leave Call' : 'End Call'}
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Dedicated permanent audio element - plays in audio calls, video calls, AND minimized mode */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
      />
      {renderContent()}
    </>
  );
};

export default ActiveCallModal;
