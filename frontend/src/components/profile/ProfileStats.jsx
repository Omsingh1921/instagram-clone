import React from 'react';
import { formatCount } from '../../utils';

export const ProfileStats = ({
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  setFollowModalType,
  setFollowModalOpen,
}) => {
  return (
    <div className="profile-stats-row">
      <div className="stat-item">
        <span className="stat-num">{formatCount(postsCount)}</span>
        <span className="stat-label">posts</span>
      </div>
      <div
        className="stat-item clickable"
        onClick={() => {
          setFollowModalType?.('followers');
          setFollowModalOpen?.(true);
        }}
      >
        <span className="stat-num">{formatCount(followersCount)}</span>
        <span className="stat-label">followers</span>
      </div>
      <div
        className="stat-item clickable"
        onClick={() => {
          setFollowModalType?.('following');
          setFollowModalOpen?.(true);
        }}
      >
        <span className="stat-num">{formatCount(followingCount)}</span>
        <span className="stat-label">following</span>
      </div>
    </div>
  );
};

export default ProfileStats;
