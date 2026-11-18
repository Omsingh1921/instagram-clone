import React from 'react';
import { Bell } from 'lucide-react';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import EmptyState from '../common/EmptyState';

export const MutedUsersTab = ({
  mutedUsers = [],
  loadingMuted = false,
  handleUnmuteUser,
}) => {
  return (
    <div style={{ maxWidth: '580px' }}>
      <h2 className="settings-section-title">Muted accounts</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Accounts you've muted for posts or stories will appear here. You can unmute them anytime.
      </p>

      {loadingMuted ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <SkeletonUserRows count={4} showAction />
        </div>
      ) : mutedUsers.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Muted Accounts"
          description="You haven't muted posts or stories from any accounts."
        />
      ) : (
        <div className="blocked-users-list">
          {mutedUsers.map((item) => {
            const u = item.mutedUser || item;
            return (
              <div key={u.userId || u.id} className="blocked-user-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar
                    src={u.profilePictureUrl || u.avatarUrl}
                    alt={u.username}
                    size="sm"
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {u.username}
                    </strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {u.fullName || u.displayName}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => handleUnmuteUser?.(u.userId || u.id)}
                >
                  Unmute
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MutedUsersTab;
