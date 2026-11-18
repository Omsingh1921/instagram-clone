/**
 * WebRTC Media & Peer Connection Service
 * Handles STUN configuration, media streams, peer connection lifecycle, and ringtone synthesizer.
 */

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

class WebRtcService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.audioContext = null;
    this.ringtoneInterval = null;
    this.iceCandidatesQueue = [];
    this.onRemoteStreamCallback = null;
    this.onIceCandidateCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.peers = new Map(); // userId -> { pc, remoteStream, iceCandidatesQueue, onRemoteStream, onConnectionStateChange }
  }

  /**
   * Acquire local user media (camera + microphone)
   */
  async getLocalMedia(callType = 'VIDEO') {
    const hasActiveAudio = this.localStream?.getAudioTracks().some((t) => t.readyState === 'live');
    const hasActiveVideo = this.localStream?.getVideoTracks().some((t) => t.readyState === 'live');

    // If an existing stream already has live tracks matching the requested call type, reuse it
    if (this.localStream && hasActiveAudio && (callType !== 'VIDEO' || hasActiveVideo)) {
      return this.localStream;
    }

    // Stop inactive tracks before requesting new hardware access
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      this.localStream = null;
    }

    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: callType === 'VIDEO' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      } : false,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (err) {
      console.warn('[WebRTC] High-res media constraints failed, trying basic video:', err);
      if (constraints.video) {
        try {
          // Fallback 1: basic video without strict resolution/facingMode
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: true,
          });
          return this.localStream;
        } catch (basicErr) {
          console.warn('[WebRTC] Basic video also failed, trying audio-only:', basicErr);
          try {
            // Fallback 2: audio only if camera is unavailable or denied
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            return this.localStream;
          } catch (audioErr) {
            console.error('[WebRTC] Microphone also failed:', audioErr);
            throw audioErr;
          }
        }
      }
      throw err;
    }
  }

  /**
   * Initialize RTCPeerConnection and bind event handlers
   */
  createPeerConnection(onIceCandidate, onRemoteStream, onConnectionStateChange) {
    // Only close prior RTCPeerConnection if one existed - do NOT stop localStream!
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {
        console.warn('[WebRTC] PeerConnection close notice:', e);
      }
      this.peerConnection = null;
    }

    this.iceCandidatesQueue = [];
    this.onIceCandidateCallback = onIceCandidate;
    this.onRemoteStreamCallback = onRemoteStream;
    this.onConnectionStateChangeCallback = onConnectionStateChange;

    this.peerConnection = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();

    // Attach local stream tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        console.log('[WebRTC] Local ICE candidate generated:', event.candidate.type || event.candidate.protocol || 'candidate');
        this.onIceCandidateCallback(event.candidate);
      }
    };

    // Remote track handler
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind, 'id:', event.track.id, 'streams:', event.streams?.length);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) this.remoteStream = new MediaStream();
        this.remoteStream.addTrack(event.track);
      }
      // Provide fresh MediaStream reference with all current tracks to trigger React state updates reliably
      const streamInstance = new MediaStream(this.remoteStream.getTracks());
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(streamInstance);
      }
    };

    // Connection state change handler (checks both peerConnection and ICE state)
    const checkState = () => {
      const connState = this.peerConnection?.connectionState;
      const iceState = this.peerConnection?.iceConnectionState;
      console.log(`[WebRTC] State update - connectionState: ${connState}, iceConnectionState: ${iceState}`);

      if (connState === 'connected' || iceState === 'connected' || iceState === 'completed') {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback('connected');
        }
      } else if (connState === 'failed' || iceState === 'failed') {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback('failed');
        }
      } else if (connState === 'disconnected' || iceState === 'disconnected') {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback('disconnected');
        }
      }
    };

    this.peerConnection.onconnectionstatechange = checkState;
    this.peerConnection.oniceconnectionstatechange = checkState;

    return this.peerConnection;
  }

  /**
   * Create SDP Offer (Caller side)
   */
  async createOffer() {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handle incoming SDP Offer and create SDP Answer (Callee side)
   */
  async handleOfferAndCreateAnswer(offer) {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.drainIceCandidatesQueue();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Handle incoming SDP Answer (Caller side)
   */
  async handleAnswer(answer) {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    await this.drainIceCandidatesQueue();
  }

  /**
   * Add incoming ICE Candidate from peer, queueing if remoteDescription is not yet set
   */
  async addIceCandidate(candidate) {
    if (!candidate) return;
    try {
      const candidateInit = candidate.candidate ? {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      } : candidate;

      const rtcCandidate = new RTCIceCandidate(candidateInit);
      if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
        await this.peerConnection.addIceCandidate(rtcCandidate);
        console.log('[WebRTC] Remote ICE candidate applied');
      } else {
        this.iceCandidatesQueue.push(rtcCandidate);
        console.log('[WebRTC] Remote ICE candidate queued (pending remoteDescription)');
      }
    } catch (err) {
      console.warn('[WebRTC] Failed to add ICE candidate:', err);
    }
  }

  /**
   * Drain queued ICE candidates once remoteDescription is set
   */
  async drainIceCandidatesQueue() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    if (this.iceCandidatesQueue.length > 0) {
      console.log(`[WebRTC] Draining ${this.iceCandidatesQueue.length} queued ICE candidate(s)`);
    }
    while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[WebRTC] Failed to add queued ICE candidate:', err);
      }
    }
  }

  /**
   * Toggle microphone mute/unmute
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = enabled !== undefined ? enabled : !t.enabled;
      });
      return audioTracks.length > 0 ? audioTracks[0].enabled : false;
    }
    return false;
  }

  /**
   * Toggle camera video on/off
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = enabled !== undefined ? enabled : !t.enabled;
      });
      return videoTracks.length > 0 ? videoTracks[0].enabled : false;
    }
    return false;
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      if (this.peerConnection) {
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      }

      // Also replace track across mesh peers in group calls
      this.peers.forEach(({ pc }) => {
        try {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        } catch {
          // ignore
        }
      });

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (err) {
      console.warn('[WebRTC] Screen share cancelled or failed:', err);
      return null;
    }
  }

  /**
   * Stop screen share and revert to webcam
   */
  async stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (this.peerConnection && videoTrack) {
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }

      this.peers.forEach(({ pc }) => {
        try {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender && videoTrack) {
            videoSender.replaceTrack(videoTrack);
          }
        } catch {
          // ignore
        }
      });
    }
  }

  // ==================== MULTI-PEER MESH FOR GROUP CALLS ====================

  /**
   * Create or retrieve peer connection for a specific group member
   */
  createPeerForUser(userId, onIceCandidate, onRemoteStream, onConnectionStateChange) {
    if (this.peers.has(userId)) {
      this.closePeer(userId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const peerData = {
      pc,
      remoteStream: new MediaStream(),
      iceCandidatesQueue: [],
      onRemoteStream,
      onConnectionStateChange,
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, this.localStream);
        } catch (e) {
          console.warn(`[WebRTC] AddTrack notice for peer ${userId}:`, e);
        }
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(userId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        peerData.remoteStream = event.streams[0];
      } else {
        if (!peerData.remoteStream) peerData.remoteStream = new MediaStream();
        peerData.remoteStream.addTrack(event.track);
      }
      const streamInstance = new MediaStream(peerData.remoteStream.getTracks());
      if (onRemoteStream) {
        onRemoteStream(userId, streamInstance);
      }
    };

    const checkState = () => {
      const connState = pc.connectionState;
      const iceState = pc.iceConnectionState;
      if (connState === 'connected' || iceState === 'connected' || iceState === 'completed') {
        onConnectionStateChange?.(userId, 'connected');
      } else if (connState === 'failed' || iceState === 'failed') {
        onConnectionStateChange?.(userId, 'failed');
      } else if (connState === 'disconnected' || iceState === 'disconnected') {
        onConnectionStateChange?.(userId, 'disconnected');
      }
    };

    pc.onconnectionstatechange = checkState;
    pc.oniceconnectionstatechange = checkState;

    this.peers.set(userId, peerData);
    return pc;
  }

  async createOfferForUser(userId) {
    const peerData = this.peers.get(userId);
    if (!peerData) throw new Error(`Peer not found: ${userId}`);
    const offer = await peerData.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerData.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOfferAndCreateAnswerForUser(userId, offer) {
    const peerData = this.peers.get(userId);
    if (!peerData) throw new Error(`Peer not found: ${userId}`);
    await peerData.pc.setRemoteDescription(new RTCSessionDescription(offer));
    await this.drainIceCandidatesQueueForUser(userId);
    const answer = await peerData.pc.createAnswer();
    await peerData.pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswerForUser(userId, answer) {
    const peerData = this.peers.get(userId);
    if (!peerData) return;
    await peerData.pc.setRemoteDescription(new RTCSessionDescription(answer));
    await this.drainIceCandidatesQueueForUser(userId);
  }

  async addIceCandidateForUser(userId, candidate) {
    if (!candidate) return;
    const peerData = this.peers.get(userId);
    if (!peerData) return;
    try {
      const candidateInit = candidate.candidate ? {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      } : candidate;

      const rtcCandidate = new RTCIceCandidate(candidateInit);
      if (peerData.pc.remoteDescription && peerData.pc.remoteDescription.type) {
        await peerData.pc.addIceCandidate(rtcCandidate);
      } else {
        peerData.iceCandidatesQueue.push(rtcCandidate);
      }
    } catch (err) {
      console.warn(`[WebRTC] Failed to add candidate for ${userId}:`, err);
    }
  }

  async drainIceCandidatesQueueForUser(userId) {
    const peerData = this.peers.get(userId);
    if (!peerData || !peerData.pc.remoteDescription) return;
    while (peerData.iceCandidatesQueue.length > 0) {
      const candidate = peerData.iceCandidatesQueue.shift();
      try {
        await peerData.pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn(`[WebRTC] Failed to drain candidate for ${userId}:`, err);
      }
    }
  }

  closePeer(userId) {
    const peerData = this.peers.get(userId);
    if (peerData) {
      try {
        peerData.pc.close();
      } catch {
        // ignore
      }
      this.peers.delete(userId);
    }
  }

  closeAllPeers() {
    this.peers.forEach((peerData) => {
      try {
        peerData.pc.close();
      } catch {
        // ignore
      }
    });
    this.peers.clear();
  }

  /**
   * Play synthesizer ringtone chime (Web Audio API)
   */
  playRingtone() {
    this.stopRingtone();
    const playChime = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }

        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // Instagram harmonic frequencies (approx 440Hz / 480Hz)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(520, this.audioContext.currentTime + 0.3);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, this.audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(580, this.audioContext.currentTime + 0.3);

        gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.65);
        osc2.stop(this.audioContext.currentTime + 0.65);
      } catch (e) {
        console.warn('[WebRTC] AudioContext chime notice:', e);
      }
    };

    playChime();
    this.ringtoneInterval = setInterval(playChime, 2200);
  }

  /**
   * Stop ringtone chime
   */
  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Close connection and release local media hardware
   */
  closePeerConnection() {
    this.stopRingtone();
    this.closeAllPeers();

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {
        console.warn('[WebRTC] PeerConnection close notice:', e);
      }
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      this.localStream = null;
    }

    this.remoteStream = null;
    this.iceCandidatesQueue = [];
  }
}

export const webrtcService = new WebRtcService();
export default webrtcService;

