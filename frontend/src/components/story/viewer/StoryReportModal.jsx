import React from 'react';
import { Flag, X } from 'lucide-react';

export const REPORT_REASONS = [
  { key: 'INAPPROPRIATE', label: 'Inappropriate or Sensitive' },
  { key: 'SPAM', label: 'Spam or Scam' },
  { key: 'HARASSMENT', label: 'Harassment or Bullying' },
  { key: 'VIOLENCE', label: 'Violence or Dangerous Content' },
  { key: 'OTHER', label: 'Something else' },
];

export const StoryReportModal = ({
  showReportModal,
  isMyStory,
  setShowReportModal,
  setIsPaused,
  reportReason,
  setReportReason,
  reportDetails,
  setReportDetails,
  handleReportStory,
  submittingReport,
}) => {
  if (!showReportModal || isMyStory) return null;

  return (
    <div className="story-viewers-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="story-viewers-sheet-header">
        <div className="story-viewers-sheet-title">
          <Flag size={18} color="#ef4444" />
          <span>Report Story</span>
        </div>
        <button
          type="button"
          className="story-viewers-sheet-close"
          onClick={() => {
            setShowReportModal?.(false);
            setIsPaused?.(false);
          }}
          aria-label="Close report"
        >
          <X size={18} />
        </button>
      </div>

      <div className="story-viewers-sheet-body" style={{ padding: '16px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
          Why are you reporting this story?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: reportReason === reason.key ? 'rgba(0,149,246,0.18)' : 'rgba(255,255,255,0.04)',
                border: reportReason === reason.key ? '1px solid #0095f6' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#fff',
              }}
            >
              <input
                type="radio"
                name="reportReason"
                value={reason.key}
                checked={reportReason === reason.key}
                onChange={() => setReportReason?.(reason.key)}
              />
              <span>{reason.label}</span>
            </label>
          ))}
        </div>

        <textarea
          placeholder="Additional details (optional)..."
          value={reportDetails}
          onChange={(e) => setReportDetails?.(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: '#fff',
            padding: '8px 10px',
            fontSize: '13px',
            outline: 'none',
            resize: 'none',
            marginBottom: '12px',
          }}
        />

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleReportStory}
          disabled={submittingReport}
          style={{ width: '100%', padding: '10px', fontWeight: 600 }}
        >
          {submittingReport ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>
  );
};

export default StoryReportModal;
