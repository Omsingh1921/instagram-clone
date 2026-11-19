import React from 'react';
import CommentsModal from '../modals/CommentsModal';
import ShareModal from '../modals/ShareModal';
import InsightsModal from '../modals/InsightsModal';
import ReportModal from '../modals/ReportModal';
import LikesModal from '../modals/LikesModal';
import SaveToCollectionModal from '../modals/SaveToCollectionModal';

export const ReelModals = ({
  commentsModalOpen,
  selectedPostId,
  onCloseComments,
  shareModalReel,
  onCloseShare,
  onShareComplete,
  insightsReel,
  onCloseInsights,
  likesModalReelId,
  onCloseLikes,
  reportModalOpen,
  reportReelId,
  onCloseReport,
  onReportSuccess,
  saveToCollReelId,
  onCloseSaveToColl,
  onSavedToCollection,
}) => {
  return (
    <>
      {/* Reel Comments Modal if opened */}
      {commentsModalOpen && selectedPostId && (
        <CommentsModal
          isOpen={commentsModalOpen}
          onClose={onCloseComments}
          postId={selectedPostId}
          isReel={true}
        />
      )}

      {/* Reel Share Modal */}
      {shareModalReel && (
        <ShareModal
          isOpen={Boolean(shareModalReel)}
          onClose={onCloseShare}
          post={{ ...shareModalReel, isReel: true }}
          onShareComplete={onShareComplete}
        />
      )}

      {/* Reel Insights Modal */}
      {insightsReel && (
        <InsightsModal
          isOpen={Boolean(insightsReel)}
          onClose={onCloseInsights}
          post={insightsReel}
          isReel={true}
        />
      )}

      {/* Reel Likes Modal */}
      {likesModalReelId && (
        <LikesModal
          isOpen={Boolean(likesModalReelId)}
          onClose={onCloseLikes}
          targetId={likesModalReelId}
          targetType="reel"
        />
      )}

      {/* Reel Report Modal */}
      {reportModalOpen && reportReelId && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={onCloseReport}
          targetType="REEL"
          targetId={reportReelId}
          onReportSuccess={onReportSuccess}
        />
      )}

      {/* Save Reel to Collection Modal */}
      {saveToCollReelId && (
        <SaveToCollectionModal
          isOpen={Boolean(saveToCollReelId)}
          onClose={onCloseSaveToColl}
          reelId={saveToCollReelId}
          onSaved={onSavedToCollection}
        />
      )}
    </>
  );
};

export default ReelModals;
