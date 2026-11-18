import React from 'react';
import { UserX } from 'lucide-react';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';
import UnblockUserModal from '../modals/UnblockUserModal';

export const BlockedUsersTab = ({
  blockedUsers = [],
  unblockTarget = null,
  setUnblockTarget,
  setBlockedUsers,
}) => {
  return (
    <div>
      <h2 className="settings-section-title">Blocked Accounts</h2>
      {blockedUsers.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No Blocked Accounts"
          description="You haven't blocked anyone yet. Blocked accounts will be listed here."
        />
      ) : (
        <div className="blocked-users-list">
          {blockedUsers.map((item) => {
            const u = item.blockedUser || item;
            return (
              <div key={u.id} className="blocked-user-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar
                    src={u.avatarUrl || u.profilePictureUrl}
                    alt={u.username}
                    size="sm"
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {u.username}
                    </strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {u.displayName || u.fullName}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => setUnblockTarget?.(u)}
                >
                  Unblock
                </button>
              </div>
            );
          })}
        </div>
      )}

      <UnblockUserModal
        isOpen={Boolean(unblockTarget)}
        onClose={() => setUnblockTarget?.(null)}
        userId={unblockTarget?.userId || unblockTarget?.id}
        username={unblockTarget?.username}
        onUnblockSuccess={() => {
          const targetId = unblockTarget?.userId || unblockTarget?.id;
          setBlockedUsers?.((prev) =>
            prev.filter((item) => {
              const u = item.blockedUser || item;
              return u.userId !== targetId && u.id !== targetId;
            })
          );
          setUnblockTarget?.(null);
        }}
      />
    </div>
  );
};

export default BlockedUsersTab;
