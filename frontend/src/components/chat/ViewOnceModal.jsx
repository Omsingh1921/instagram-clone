import React from 'react';
import { X } from 'lucide-react';

export const ViewOnceModal = ({ mediaData, countdown = 10, onClose }) => {
  if (!mediaData) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      {/* Countdown progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
        <div
          style={{
            height: '100%',
            width: `${(countdown / 10) * 100}%`,
            background: '#0095f6',
            transition: 'width 1s linear'
          }}
        />
      </div>

      {/* Header Info */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          zIndex: 10000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#0095f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '12px'
          }}>
            1
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>
              {mediaData.sender?.username || 'Photo'}
            </div>
            <div style={{ fontSize: '11px', color: '#a8a8a8' }}>
              Disappears in {countdown}s
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Media Viewer */}
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {mediaData.messageType === 'VIDEO' ? (
          <video
            src={mediaData.mediaUrl}
            autoPlay
            controls
            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
          />
        ) : (
          <img
            src={mediaData.mediaUrl}
            alt="Disappearing media"
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
          />
        )}
      </div>
    </div>
  );
};

export default ViewOnceModal;
