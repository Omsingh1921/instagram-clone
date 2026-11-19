import React from 'react';
import { Flag, Users, Play } from 'lucide-react';
import Modal from '../../common/Modal';
import Avatar from '../../common/Avatar';
import { SkeletonUserRows } from '../../ui/Skeleton';
import { timeAgo } from '../../../utils';

export const AdminActivityModal = ({
  isOpen,
  onClose,
  loadingActivity,
  allActivities = [],
}) => {
  const renderActivityVisual = (act) => {
    if (act.previewUrl) {
      return <img src={act.previewUrl} alt="" className="activity-thumb" loading="lazy" />;
    }
    if (act.type === 'REPORT_SUBMITTED') {
      return (
        <div className="activity-type-badge report">
          <Flag size={16} />
        </div>
      );
    }
    if (act.type === 'USER_FOLLOWED') {
      return (
        <div className="activity-type-badge">
          <Users size={16} />
        </div>
      );
    }
    return (
      <div className="activity-type-badge">
        <Play size={16} />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recent Platform Activity"
      size="md"
    >
      {loadingActivity && allActivities.length === 0 ? (
        <SkeletonUserRows count={5} compact />
      ) : allActivities.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
          No recent activity available.
        </p>
      ) : (
        <div className="activity-feed-list">
          {allActivities.map((act) => (
            <div key={act.id} className="activity-feed-item">
              <div className="activity-item-left">
                <Avatar src={act.actor?.avatarUrl} alt={act.actor?.username || 'user'} size="sm" />
                <div className="activity-item-copy">
                  <span className="activity-item-text">
                    <strong>{act.actor?.username || 'user'}</strong> {act.actionText}
                  </span>
                  <span className="activity-item-time">
                    {act.createdAt ? timeAgo(act.createdAt) : 'Just now'}
                  </span>
                </div>
              </div>
              {renderActivityVisual(act)}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default AdminActivityModal;
