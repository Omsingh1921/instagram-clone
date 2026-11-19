import React from 'react';
import CommentsModal from '../modals/CommentsModal';

export const ReelCommentsDrawer = ({
  isOpen = false,
  postId = null,
  onClose,
  onCommentCountChange,
}) => {
  if (!isOpen || !postId) return null;

  return (
    <CommentsModal
      isOpen={isOpen}
      onClose={onClose}
      postId={postId}
      isReel={true}
      onCommentCountChange={onCommentCountChange}
    />
  );
};

export default ReelCommentsDrawer;
