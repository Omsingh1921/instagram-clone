import React from 'react';
import {
  Search,
  RefreshCw,
  Users,
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  UserX,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Avatar from '../../common/Avatar';
import EmptyState from '../../common/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { timeAgo } from '../../../utils';

export const AdminUsersTab = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  loadUsers,
  loadingUsers,
  users,
  processingUserId,
  handleToggleUserStatus,
  handleToggleVerify,
  handleDeleteUser,
  currentPage,
  totalPages,
  totalElements,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="users-filter-bar">
        <div className="users-search-box">
          <Search size={16} color="var(--adc-text-muted)" />
          <input
            type="text"
            placeholder="Search by username, email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-selects-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>

          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="ROLE_USER">User (ROLE_USER)</option>
            <option value="ROLE_ADMIN">Admin (ROLE_ADMIN)</option>
          </select>

          <button
            type="button"
            className="table-action-btn"
            onClick={() => loadUsers(0)}
            disabled={loadingUsers}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="users-table-container">
        {!loadingUsers && users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Users Found"
            description="No users matched your search or filter parameters."
          />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                [...Array(6)].map((_, idx) => (
                  <tr key={`user-sk-${idx}`}>
                    <td>
                      <div className="user-cell">
                        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="w-24 h-3.5" />
                          <Skeleton className="w-16 h-2.5" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Skeleton className="w-40 h-3.5" />
                    </td>
                    <td>
                      <Skeleton className="w-14 h-6 rounded-full" />
                    </td>
                    <td>
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </td>
                    <td>
                      <Skeleton className="w-10 h-3" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        className="action-buttons-group"
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <Skeleton className="w-20 h-7 rounded-lg" />
                        <Skeleton className="w-16 h-7 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                users.map((u) => {
                  const isAdmin =
                    u.role === 'ROLE_ADMIN' ||
                    u.role === 'ADMIN' ||
                    u.username?.toLowerCase() === 'admin';
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <Avatar
                            src={u.avatarUrl || u.profilePictureUrl}
                            alt={u.username}
                            size="sm"
                          />
                          <div className="user-cell-meta">
                            <span
                              className="user-cell-username"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              @{u.username}
                              {(u.isVerified || u.verified) && (
                                <BadgeCheck
                                  size={14}
                                  fill="#0095f6"
                                  color="#ffffff"
                                  title="Verified Account"
                                />
                              )}
                            </span>
                            <span className="user-cell-displayname">
                              {u.displayName || u.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{u.email}</span>
                          {u.emailVerified ? (
                            <CheckCircle2
                              size={13}
                              color="#34d399"
                              title="Verified Email"
                            />
                          ) : (
                            <AlertTriangle
                              size={13}
                              color="var(--adc-text-muted)"
                              title="Unverified Email"
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}
                        >
                          {isAdmin ? 'ADMIN' : 'USER'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${u.status?.toLowerCase() || 'active'}`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--adc-text-muted)', fontSize: '12px' }}>
                        {u.createdAt ? timeAgo(u.createdAt) : 'Recently'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="action-buttons-group"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          <button
                            type="button"
                            className={`table-action-btn ${isActive ? 'danger' : 'success'}`}
                            disabled={processingUserId === u.id || isAdmin}
                            onClick={() => handleToggleUserStatus(u)}
                            title={
                              isAdmin
                                ? 'Admin accounts cannot be deactivated'
                                : isActive
                                ? 'Suspend User'
                                : 'Reactivate User'
                            }
                          >
                            {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                            <span>
                              {isAdmin
                                ? 'Protected'
                                : isActive
                                ? 'Suspend'
                                : 'Reactivate'}
                            </span>
                          </button>

                          <button
                            type="button"
                            className={`table-action-btn ${u.isVerified || u.verified ? 'verified-active' : 'verify-btn'}`}
                            disabled={processingUserId === u.id}
                            onClick={() => handleToggleVerify(u)}
                            title={
                              u.isVerified || u.verified
                                ? 'Remove Blue Badge'
                                : 'Grant Blue Verified Badge'
                            }
                          >
                            <BadgeCheck size={14} />
                            <span>
                              {u.isVerified || u.verified ? 'Verified' : 'Verify'}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="table-action-btn danger"
                            disabled={processingUserId === u.id || isAdmin}
                            onClick={() => handleDeleteUser(u)}
                            title={
                              isAdmin
                                ? 'Admin accounts cannot be deleted'
                                : 'Delete User'
                            }
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="table-pagination">
            <span>
              Showing page {currentPage + 1} of {totalPages} ({totalElements} users)
            </span>
            <div className="pagination-buttons">
              <button
                type="button"
                className="table-action-btn"
                disabled={currentPage === 0 || loadingUsers}
                onClick={() => loadUsers(currentPage - 1)}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="table-action-btn"
                disabled={currentPage >= totalPages - 1 || loadingUsers}
                onClick={() => loadUsers(currentPage + 1)}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersTab;
