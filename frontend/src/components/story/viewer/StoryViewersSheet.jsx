import React from 'react';
import { Eye, X, BarChart2 } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { SkeletonUserRows } from '../../ui/Skeleton';
import { timeAgo } from '../../../utils';

export const StoryViewersSheet = ({
  showViewers,
  showQuestionResponses,
  showInsights,
  isMyStory,
  handleCloseViewers,
  handleCloseQuestionResponses,
  setShowInsights,
  setIsPaused,
  loadingViewers,
  viewers = [],
  loadingQuestionResponses,
  questionResponses = [],
  loadingInsights,
  insightsData,
  onClose,
  navigate,
}) => {
  if (!isMyStory) return null;

  return (
    <>
      {/* Viewers Sheet (Instagram Style) */}
      {showViewers && (
        <div className="story-viewers-sheet">
          <div className="story-viewers-sheet-header">
            <div className="story-viewers-sheet-title">
              <Eye size={18} />
              <span>Story Activity</span>
              <span className="story-viewers-sheet-badge">
                {viewers.length} {viewers.length === 1 ? 'view' : 'views'}
              </span>
            </div>
            <button
              type="button"
              className="story-viewers-sheet-close"
              onClick={handleCloseViewers}
              aria-label="Close viewers"
            >
              <X size={18} />
            </button>
          </div>

          <div className="story-viewers-sheet-body">
            {loadingViewers ? (
              <SkeletonUserRows count={4} compact />
            ) : viewers.length > 0 ? (
              viewers.map((viewer) => (
                <div key={viewer.id} className="story-viewer-user-row">
                  <div
                    className="story-viewer-user-info"
                    onClick={() => {
                      onClose?.();
                      navigate?.(`/profile/${viewer.id}`);
                    }}
                  >
                    <Avatar
                      src={viewer.avatarUrl || viewer.profilePictureUrl}
                      alt={viewer.username}
                      size="sm"
                    />
                    <div className="story-viewer-user-names">
                      <span className="story-viewer-user-uname">{viewer.username}</span>
                      <span className="story-viewer-user-fname">
                        {viewer.displayName || viewer.fullName || ''}
                      </span>
                    </div>
                  </div>
                  {viewer.viewedAt && (
                    <span className="story-viewer-user-time">{timeAgo(viewer.viewedAt)}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="story-viewers-empty-state">
                <Eye size={36} className="story-viewers-empty-icon" />
                <h4 className="story-viewers-empty-title">
                  {viewers.length > 0
                    ? `${viewers.length} ${viewers.length === 1 ? 'Account has' : 'Accounts have'} seen your story`
                    : 'No views yet'}
                </h4>
                <p className="story-viewers-empty-desc">
                  {viewers.length > 0
                    ? 'People who have seen your story are counted in the views total above.'
                    : 'When other accounts view your story, their profiles and view times will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Responses Sheet (Author Only) */}
      {showQuestionResponses && (
        <div className="story-viewers-sheet">
          <div className="story-viewers-sheet-header">
            <div className="story-viewers-sheet-title">
              <span>Question Responses</span>
              <span className="story-viewers-sheet-badge">
                {questionResponses.length} {questionResponses.length === 1 ? 'response' : 'responses'}
              </span>
            </div>
            <button
              type="button"
              className="story-viewers-sheet-close"
              onClick={handleCloseQuestionResponses}
              aria-label="Close responses"
            >
              <X size={18} />
            </button>
          </div>

          <div className="story-viewers-sheet-body">
            {loadingQuestionResponses ? (
              <SkeletonUserRows count={4} compact />
            ) : questionResponses.length > 0 ? (
              questionResponses.map((item) => (
                <div key={item.id} className="story-viewer-user-row" style={{ alignItems: 'flex-start' }}>
                  <div
                    className="story-viewer-user-info"
                    onClick={() => {
                      onClose?.();
                      navigate?.(`/profile/${item.user?.id}`);
                    }}
                  >
                    <Avatar
                      src={item.user?.avatarUrl}
                      alt={item.user?.username}
                      size="sm"
                    />
                    <div className="story-viewer-user-names">
                      <span className="story-viewer-user-uname">{item.user?.username}</span>
                      <div
                        style={{
                          background: '#f0f2f5',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          marginTop: '4px',
                          color: '#1a1a1a',
                          fontSize: '13px',
                        }}
                      >
                        {item.answer}
                      </div>
                    </div>
                  </div>
                  {item.createdAt && (
                    <span className="story-viewer-user-time">{timeAgo(item.createdAt)}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="story-viewers-empty-state">
                <h4 className="story-viewers-empty-title">No responses yet</h4>
                <p className="story-viewers-empty-desc">
                  When viewers type an answer into your question sticker, their responses will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Story Insights Sheet (Author Only) */}
      {showInsights && (
        <div className="story-viewers-sheet">
          <div className="story-viewers-sheet-header">
            <div className="story-viewers-sheet-title">
              <BarChart2 size={18} />
              <span>Story Insights</span>
            </div>
            <button
              type="button"
              className="story-viewers-sheet-close"
              onClick={() => {
                setShowInsights?.(false);
                setIsPaused?.(false);
              }}
              aria-label="Close insights"
            >
              <X size={18} />
            </button>
          </div>

          <div className="story-viewers-sheet-body">
            {loadingInsights ? (
              <SkeletonUserRows count={4} compact />
            ) : insightsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 4px' }}>
                {/* Overview Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'block' }}>
                      {insightsData.impressions || 0}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Impressions</span>
                  </div>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'block' }}>
                      {insightsData.reach || 0}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Reach</span>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Replies</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{insightsData.replies || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Profile Visits</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{insightsData.profileVisits || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Shares</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{insightsData.shares || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="story-viewers-empty-state">
                <BarChart2 size={36} className="story-viewers-empty-icon" />
                <h4 className="story-viewers-empty-title">No insights data</h4>
                <p className="story-viewers-empty-desc">
                  Insights data will appear as users interact with your story.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StoryViewersSheet;
