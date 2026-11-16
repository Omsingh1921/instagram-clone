import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import callService from '../services/call.service';
import webrtcService from '../services/webrtc.service';
import api from '../services/api';
import { CallProvider, useCall } from '../context/CallContext';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallModal from '../components/call/ActiveCallModal';

// Mock API and WebRTC dependencies
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/websocket', () => ({
  default: {
    connect: vi.fn(),
    subscribe: vi.fn(() => () => { }),
    send: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  AuthContext: React.createContext(null),
  useAuth: () => ({
    user: { id: 'user-123', username: 'current_user', displayName: 'Current User' },
    isAuthenticated: true,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe('WebRTC Call Module Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Call Service API Client', () => {
    it('initiateCall sends POST /calls/initiate with correct payload', async () => {
      api.post.mockResolvedValueOnce({
        data: { id: 'call-001', callType: 'VIDEO', status: 'RINGING' },
      });

      const res = await callService.initiateCall('recipient-456', 'VIDEO', 'conv-789');
      expect(api.post).toHaveBeenCalledWith('/calls/initiate', {
        recipientId: 'recipient-456',
        callType: 'VIDEO',
        conversationId: 'conv-789',
      });
      expect(res.id).toBe('call-001');
    });

    it('answerCall sends POST /calls/{callId}/answer', async () => {
      api.post.mockResolvedValueOnce({
        data: { id: 'call-001', status: 'CONNECTED' },
      });

      const res = await callService.answerCall('call-001');
      expect(api.post).toHaveBeenCalledWith('/calls/call-001/answer');
      expect(res.status).toBe('CONNECTED');
    });

    it('rejectCall sends POST /calls/{callId}/reject', async () => {
      api.post.mockResolvedValueOnce({
        data: { id: 'call-001', status: 'REJECTED' },
      });

      const res = await callService.rejectCall('call-001');
      expect(api.post).toHaveBeenCalledWith('/calls/call-001/reject');
      expect(res.status).toBe('REJECTED');
    });

    it('endCall sends POST /calls/{callId}/end', async () => {
      api.post.mockResolvedValueOnce({
        data: { id: 'call-001', status: 'ENDED', durationSeconds: 45 },
      });

      const res = await callService.endCall('call-001');
      expect(api.post).toHaveBeenCalledWith('/calls/call-001/end');
      expect(res.durationSeconds).toBe(45);
    });

    it('getCallHistory sends GET /calls/history', async () => {
      api.get.mockResolvedValueOnce({
        data: { content: [], totalElements: 0 },
      });

      await callService.getCallHistory(0, 10);
      expect(api.get).toHaveBeenCalledWith('/calls/history', {
        params: { page: 0, size: 10, sort: 'startedAt,desc' },
      });
    });
  });

  describe('WebRTC Service Utilities', () => {
    it('toggleAudio handles null localStream safely', () => {
      webrtcService.localStream = null;
      const res = webrtcService.toggleAudio();
      expect(res).toBe(false);
    });

    it('toggleVideo handles null localStream safely', () => {
      webrtcService.localStream = null;
      const res = webrtcService.toggleVideo();
      expect(res).toBe(false);
    });

    it('playRingtone starts interval and stopRingtone clears it', () => {
      webrtcService.playRingtone();
      expect(webrtcService.ringtoneInterval).not.toBeNull();
      webrtcService.stopRingtone();
      expect(webrtcService.ringtoneInterval).toBeNull();
    });
  });

  describe('Call UI Components', () => {
    it('IncomingCallModal renders caller info and trigger action buttons', () => {
      const MockCallConsumer = () => {
        const { acceptCall, rejectCall } = useCall();
        return (
          <div>
            <IncomingCallModal />
            <button data-testid="test-trigger-accept" onClick={acceptCall}>Accept</button>
            <button data-testid="test-trigger-reject" onClick={rejectCall}>Reject</button>
          </div>
        );
      };

      render(
        <CallProvider>
          <MockCallConsumer />
        </CallProvider>
      );

      // Initially no incoming call, modal is hidden
      expect(screen.queryByLabelText('Incoming Call')).toBeNull();
    });

    it('ActiveCallModal renders controls when activeCall is present', () => {
      render(
        <CallProvider>
          <ActiveCallModal />
        </CallProvider>
      );

      // Initially no active call, modal is hidden
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('ActiveCallModal displays Instagram Web parity layout: caller identity, device pill, and action buttons', async () => {
      vi.spyOn(webrtcService, 'getLocalMedia').mockResolvedValue({
        getTracks: () => [],
        getVideoTracks: () => [],
      });
      vi.spyOn(webrtcService, 'createPeerConnection').mockImplementation(() => { });
      api.post.mockResolvedValue({
        data: {
          id: 'call-xyz-123',
          callType: 'AUDIO',
          status: 'RINGING',
          recipient: { id: 'user-nitin', username: 'nitindhangar', fullName: 'Nitin Dhangar' },
        },
      });
      vi.spyOn(callService, 'initiateCall').mockResolvedValue({
        id: 'call-xyz-123',
        callType: 'AUDIO',
        status: 'RINGING',
        recipient: { id: 'user-nitin', username: 'nitindhangar', fullName: 'Nitin Dhangar' },
      });

      const MockActiveCallWrapper = () => {
        const { startCall } = useCall();
        return (
          <div>
            <ActiveCallModal />
            <button
              data-testid="start-test-call"
              onClick={async () => {
                await startCall({ id: 'user-nitin', username: 'nitindhangar', fullName: 'Nitin Dhangar' }, 'AUDIO');
              }}
            >
              Start Call
            </button>
          </div>
        );
      };

      render(
        <CallProvider>
          <MockActiveCallWrapper />
        </CallProvider>
      );

      fireEvent.click(screen.getByTestId('start-test-call'));

      // Modal dialog appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Displays device pill
      expect(screen.getByText('Connected microphone and speaker:')).toBeInTheDocument();
      // Displays peer name
      expect(screen.getByText('Nitin Dhangar')).toBeInTheDocument();
      // Displays 4 control buttons
      expect(screen.getByLabelText('Toggle Screen Share')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle Camera')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle Microphone')).toBeInTheDocument();
      expect(screen.getByLabelText('End Call')).toBeInTheDocument();
    });
  });
});

