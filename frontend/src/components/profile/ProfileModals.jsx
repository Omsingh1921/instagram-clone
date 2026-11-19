import React from 'react';
import CommentsModal from '../modals/CommentsModal';
import FollowListModal from '../modals/FollowListModal';
import ReportModal from '../modals/ReportModal';
import BlockUserModal from '../modals/BlockUserModal';
import UnblockUserModal from '../modals/UnblockUserModal';
import CreateHighlightModal from '../modals/CreateHighlightModal';
import EditHighlightModal from '../modals/EditHighlightModal';
import CreateCollectionModal from '../modals/CreateCollectionModal';
import AddToCollectionModal from '../modals/AddToCollectionModal';
import CloseFriendsModal from '../modals/CloseFriendsModal';
import ProfileQrModal from '../modals/ProfileQrModal';
import NoteModal from '../modals/NoteModal';
import ProfileGearMenuModal from '../modals/ProfileGearMenuModal';
import MetaVerifiedModal from '../modals/MetaVerifiedModal';
import StoryViewerModal from '../story/StoryViewerModal';

export const ProfileModals = ({
  // Comments
  selectedPostId,
  setSelectedPostId,
  loadUserPosts,
  activeTab,
  loadSavedPosts,
  // Follow modal
  followModalOpen,
  setFollowModalOpen,
  effectiveUserId,
  followModalType,
  // Report modal
  reportModalOpen,
  setReportModalOpen,
  userId,
  navigate,
  // Block / Unblock
  blockModalOpen,
  setBlockModalOpen,
  profile,
  handleBlockSuccess,
  unblockModalOpen,
  setUnblockModalOpen,
  handleUnblockSuccess,
  // Highlights
  createHighlightOpen,
  setCreateHighlightOpen,
  fetchHighlights,
  editingHighlightId,
  setEditingHighlightId,
  // Collections
  createCollectionOpen,
  setCreateCollectionOpen,
  loadCollections,
  addToCollectionOpen,
  setAddToCollectionModalOpen,
  selectedCollection,
  collectionPosts = [],
  collectionReels = [],
  savedPosts = [],
  savedReels = [],
  handleSelectCollection,
  // Close friends
  closeFriendsModalOpen,
  setCloseFriendsModalOpen,
  // QR modal
  qrModalOpen,
  setQrModalOpen,
  currentUser,
  // Note modal
  noteModalOpen,
  setNoteModalOpen,
  activeNote,
  setActiveNote,
  // Gear menu
  gearMenuOpen,
  setGearMenuOpen,
  setMetaVerifiedOpen,
  metaVerifiedOpen,
  logout,
  // Story viewer
  storyViewerOpen,
  setStoryViewerOpen,
  effectiveStoryGroups = [],
  activeHighlightGroup,
  setActiveHighlightGroup,
}) => {
  return (
    <>
      {/* Comments Modal for clicked post */}
      {selectedPostId && (
        <CommentsModal
          isOpen={Boolean(selectedPostId)}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
          onPostUpdated={() => {
            loadUserPosts?.();
            if (activeTab === 'saved') loadSavedPosts?.();
          }}
        />
      )}

      {/* Followers / Following List Modal */}
      {followModalOpen && (
        <FollowListModal
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={effectiveUserId}
          type={followModalType}
        />
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="USER"
          targetId={userId}
          onReportSuccess={() => {
            navigate('/');
          }}
        />
      )}

      {/* Block User Modal */}
      <BlockUserModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        userId={userId || profile?.id}
        username={profile?.username}
        onBlockSuccess={handleBlockSuccess}
      />

      {/* Unblock User Modal */}
      <UnblockUserModal
        isOpen={unblockModalOpen}
        onClose={() => setUnblockModalOpen(false)}
        userId={userId || profile?.id}
        username={profile?.username}
        onUnblockSuccess={handleUnblockSuccess}
      />

      {/* Create Highlight Modal */}
      {createHighlightOpen && (
        <CreateHighlightModal
          isOpen={createHighlightOpen}
          onClose={() => setCreateHighlightOpen(false)}
          onHighlightCreated={() => fetchHighlights?.()}
        />
      )}

      {/* Create Collection Modal */}
      {createCollectionOpen && (
        <CreateCollectionModal
          isOpen={createCollectionOpen}
          onClose={() => setCreateCollectionOpen(false)}
          onCreated={() => loadCollections?.()}
        />
      )}

      {/* Add To Collection Modal */}
      {addToCollectionOpen && selectedCollection && (
        <AddToCollectionModal
          isOpen={addToCollectionOpen}
          onClose={() => setAddToCollectionModalOpen(false)}
          collectionId={selectedCollection.id}
          collectionName={selectedCollection.name}
          existingPostIds={collectionPosts.map((p) => p.id)}
          existingReelIds={collectionReels.map((r) => r.id)}
          initialSavedPosts={savedPosts}
          initialSavedReels={savedReels}
          onItemsAdded={() => {
            handleSelectCollection?.(selectedCollection);
            loadCollections?.();
          }}
        />
      )}

      {/* Close Friends Modal */}
      <CloseFriendsModal
        isOpen={closeFriendsModalOpen}
        onClose={() => setCloseFriendsModalOpen(false)}
      />

      {/* QR Code Nametag Modal */}
      <ProfileQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile?.username || currentUser?.username}
      />

      {/* Note Creator & Viewer Modal */}
      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        currentNote={activeNote}
        onNoteUpdated={(note) => setActiveNote?.(note)}
      />

      {/* Profile Gear Menu Modal (Action Sheet matching Instagram) */}
      <ProfileGearMenuModal
        isOpen={gearMenuOpen}
        onClose={() => setGearMenuOpen(false)}
        onOpenQr={() => setQrModalOpen(true)}
        onOpenMetaVerified={() => setMetaVerifiedOpen(true)}
        onLogout={logout}
      />

      {/* Meta Verified Benefits Modal */}
      <MetaVerifiedModal
        isOpen={metaVerifiedOpen}
        onClose={() => setMetaVerifiedOpen(false)}
      />

      {/* Edit Highlight Modal */}
      {editingHighlightId && (
        <EditHighlightModal
          isOpen={Boolean(editingHighlightId)}
          onClose={() => setEditingHighlightId(null)}
          highlightId={editingHighlightId}
          onHighlightUpdated={fetchHighlights}
        />
      )}

      {/* Story Viewer Modal (Live Stories or Selected Highlight) */}
      {storyViewerOpen && effectiveStoryGroups.length > 0 && (
        <StoryViewerModal
          isOpen={storyViewerOpen}
          storyGroups={effectiveStoryGroups}
          initialGroupIdx={0}
          initialStoryIdx={0}
          onClose={() => setStoryViewerOpen(false)}
          onHighlightUpdated={fetchHighlights}
        />
      )}

      {activeHighlightGroup && activeHighlightGroup.length > 0 && (
        <StoryViewerModal
          isOpen={true}
          storyGroups={activeHighlightGroup}
          initialGroupIdx={0}
          initialStoryIdx={0}
          onClose={() => setActiveHighlightGroup(null)}
          onHighlightUpdated={fetchHighlights}
        />
      )}
    </>
  );
};

export default ProfileModals;
