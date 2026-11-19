import React from 'react';
import ProfileAvatar from './ProfileAvatar';
import ProfileActions from './ProfileActions';
import ProfileStats from './ProfileStats';
import ProfileBio from './ProfileBio';

export const ProfileHeader = ({
  profile = {},
  isOwnProfile = false,
  isViewerAdmin = false,
  activeNote,
  hasActiveStory = false,
  uploadingStory = null,
  userStories = [],
  avatarInputRef,
  handleAvatarClick,
  handleAvatarFile,
  setNoteModalOpen,
  isEditing = false,
  setIsEditing,
  setActiveTab,
  setCreateHighlightOpen,
  setCloseFriendsModalOpen,
  setGearMenuOpen,
  isBlockedByMe = false,
  setUnblockModalOpen,
  isFollowing = false,
  isRequested = false,
  handleFollowToggle,
  handleMessageUser,
  handleDeleteUserProfile,
  moreMenuOpen = false,
  setMoreMenuOpen,
  isMuted = false,
  handleToggleMute,
  setReportModalOpen,
  handleBlockUser,
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  setFollowModalType,
  setFollowModalOpen,
}) => {
  return (
    <header className="profile-header-section">
      <ProfileAvatar
        profile={profile}
        isOwnProfile={isOwnProfile}
        activeNote={activeNote}
        hasActiveStory={hasActiveStory}
        uploadingStory={uploadingStory}
        userStories={userStories}
        avatarInputRef={avatarInputRef}
        handleAvatarClick={handleAvatarClick}
        handleAvatarFile={handleAvatarFile}
        setNoteModalOpen={setNoteModalOpen}
      />

      <div className="profile-info-column">
        {/* Username & Action Buttons */}
        <ProfileActions
          profile={profile}
          isOwnProfile={isOwnProfile}
          isViewerAdmin={isViewerAdmin}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          setActiveTab={setActiveTab}
          setCreateHighlightOpen={setCreateHighlightOpen}
          setCloseFriendsModalOpen={setCloseFriendsModalOpen}
          setGearMenuOpen={setGearMenuOpen}
          isBlockedByMe={isBlockedByMe}
          setUnblockModalOpen={setUnblockModalOpen}
          isFollowing={isFollowing}
          isRequested={isRequested}
          handleFollowToggle={handleFollowToggle}
          handleMessageUser={handleMessageUser}
          handleDeleteUserProfile={handleDeleteUserProfile}
          moreMenuOpen={moreMenuOpen}
          setMoreMenuOpen={setMoreMenuOpen}
          isMuted={isMuted}
          handleToggleMute={handleToggleMute}
          setReportModalOpen={setReportModalOpen}
          handleBlockUser={handleBlockUser}
        />

        {/* Stats Row */}
        <ProfileStats
          postsCount={postsCount}
          followersCount={followersCount}
          followingCount={followingCount}
          setFollowModalType={setFollowModalType}
          setFollowModalOpen={setFollowModalOpen}
        />

        {/* Bio Info */}
        <ProfileBio profile={profile} />
      </div>
    </header>
  );
};

export default ProfileHeader;
