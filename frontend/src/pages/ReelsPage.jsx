import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';
import {
  ReelFeedTabs,
  ReelPreviewCard,
  ReelVideoCard,
  ReelActionRail,
  ReelOptionsMenu,
  ReelModals,
  useReelsFeed,
  useReelsGestures,
  useReelsInteractions,
  useReelsModals,
} from '../components/reels';
import './ReelsPage.css';

export const ReelsPage = () => {
  const { reelId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isFollowing, toggleFollow, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();

  const interactionsRef = useRef(null);
  const modalsRef = useRef(null);

  // 1. Feed management hook
  const feed = useReelsFeed({
    reelId,
    currentUser,
    uploadCtx,
    onReelsLoaded: (incomingList) => interactionsRef.current?.initializeReelsState(incomingList),
  });

  // 2. Vertical swipe and gesture navigation hook
  const gestures = useReelsGestures({
    activeIndex: feed.activeIndex,
    totalReels: feed.effectiveReels.length,
    setActiveIndex: feed.setActiveIndex,
    onIndexChange: () => interactionsRef.current?.setVideoProgress(0),
    getIsModalOpen: () => Boolean(modalsRef.current?.isModalOpen),
    getIsMenuOpen: () => Boolean(modalsRef.current?.isMenuOpenForCurrent),
    onCloseMenu: () => modalsRef.current?.closeMenu(),
  });

  // 3. Media playback, audio state & social reactions hook
  const interactions = useReelsInteractions({
    currentReel: feed.currentReel,
    wasDraggedRef: gestures.wasDraggedRef,
    recordCurrentReelView: feed.recordCurrentReelView,
    toggleFollow,
    showSuccess,
    showError,
  });
  interactionsRef.current = interactions;

  // 4. Modals, sheets & 3-dot options menu hook
  const modals = useReelsModals({
    currentReel: feed.currentReel,
    feedType: feed.feedType,
    currentUser,
    isAdmin,
    setReels: feed.setReels,
    handleNextReel: gestures.handleNextReel,
    handleSaveToggle: interactions.handleSaveToggle,
    setSharesMap: interactions.setSharesMap,
    setSavedMap: interactions.setSavedMap,
    showSuccess,
    showError,
  });
  modalsRef.current = modals;

  return (
    <div
      className={`reels-page-container ${gestures.isDraggingReel ? 'is-dragging' : ''}`}
      ref={gestures.containerRef}
      onMouseDown={gestures.handleMouseDown}
      onTouchStart={gestures.handleTouchStart}
      onTouchMove={gestures.handleTouchMove}
      onTouchEnd={gestures.handleTouchEnd}
      onTouchCancel={gestures.handleTouchCancel}
    >
      {/* Top Stage Header: Centered Feed Switcher + Right Mute/Options Controls */}
      <ReelFeedTabs
        feedType={feed.feedType}
        onSwitchFeed={feed.handleSwitchFeed}
        currentReel={feed.currentReel}
        isMuted={interactions.isMuted}
        onToggleMute={() => interactions.setIsMuted((prev) => !prev)}
        topMenuBtnRef={modals.topMenuBtnRef}
        isMenuOpen={modals.isMenuOpenForCurrent}
        menuAnchor={modals.menuState?.anchor}
        onToggleMenu={modals.toggleReelMenu}
      />

      {feed.loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <Skeleton className="w-[320px] sm:w-[360px] h-[540px] sm:h-[620px] rounded-2xl" />
        </div>
      ) : feed.effectiveReels.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No Reels Available"
          description="Be the first creator to record and share a reel on the platform."
        />
      ) : feed.currentReel ? (
        <div className="reels-carousel-wrapper">
          <div
            className={`reels-carousel-stage ${gestures.isDraggingReel ? 'is-dragging' : ''}`}
            style={
              gestures.dragOffsetY
                ? { transform: `translateY(${gestures.dragOffsetY}px)`, transition: 'none' }
                : { transform: 'translateY(0px)', transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)' }
            }
          >
            {/* Prev Preview Card (if activeIndex > 0) */}
            {feed.prevReel && <ReelPreviewCard reel={feed.prevReel} type="prev" />}

            {/* Active Reel Card (One by One) */}
            <ReelVideoCard
              currentReel={feed.currentReel}
              activeIndex={feed.activeIndex}
              videoRef={interactions.videoRef}
              isMuted={interactions.isMuted}
              isPlaying={interactions.isPlaying}
              showHeartAnim={interactions.showHeartAnim}
              videoProgress={interactions.videoProgress}
              slideDirection={gestures.slideDirection}
              isDraggingReel={gestures.isDraggingReel}
              onTogglePlay={interactions.toggleVideoPlay}
              onDoubleTap={interactions.handleDoubleTap}
              onTouchStart={interactions.handleVideoTouchStart}
              onTimeUpdate={interactions.handleTimeUpdate}
              onSeekProgress={interactions.handleSeekProgress}
              currentUser={currentUser}
              isFollowing={isFollowing}
              onFollowToggle={interactions.handleFollowToggle}
              navigate={navigate}
            >
              {/* Right Action Rail */}
              <ReelActionRail
                currentReel={feed.currentReel}
                likesMap={interactions.likesMap}
                savedMap={interactions.savedMap}
                sharesMap={interactions.sharesMap}
                isMenuOpen={modals.isMenuOpenForCurrent}
                menuAnchor={modals.menuState?.anchor}
                bottomMenuBtnRef={modals.bottomMenuBtnRef}
                onLikeToggle={interactions.handleLikeToggle}
                onOpenLikesModal={(id) => modals.setLikesModalReelId(id)}
                onOpenComments={(id) => {
                  modals.setSelectedPostId(id);
                  modals.setCommentsModalOpen(true);
                }}
                onOpenShare={(reel) => modals.setShareModalReel(reel)}
                onSaveToggle={interactions.handleSaveToggle}
                onOpenInsights={(reel) => modals.setInsightsReel(reel)}
                onToggleMenu={modals.toggleReelMenu}
                isAuthor={modals.isReelAuthor}
              />
            </ReelVideoCard>

            {/* Next Preview Card with Next Video Preloading */}
            {feed.nextReel && <ReelPreviewCard reel={feed.nextReel} type="next" />}
          </div>
        </div>
      ) : null}

      {/* Reel Options Anchored Popover (Desktop Floating Menu / Mobile Bottom Sheet) */}
      <ReelOptionsMenu
        isOpen={modals.isMenuOpenForCurrent}
        currentReel={feed.currentReel}
        menuState={modals.menuState}
        menuPosition={modals.menuPosition}
        isMobileViewport={modals.isMobileViewport}
        menuRef={modals.menuRef}
        canDeleteReel={modals.canDeleteReel}
        isReelAuthor={modals.isReelAuthor}
        isSaved={Boolean(interactions.savedMap[modals.menuState?.reelId])}
        onDeleteReel={modals.handleDeleteReel}
        onArchiveReel={modals.handleArchiveReel}
        onReportReel={(id) => {
          modals.closeMenu();
          modals.setReportReelId(id);
          modals.setReportModalOpen(true);
        }}
        onNotInterested={modals.handleNotInterested}
        onSaveToggle={(id) => {
          interactions.handleSaveToggle(id);
          modals.closeMenu();
        }}
        onSaveToCollection={(id) => {
          modals.closeMenu();
          modals.setSaveToCollReelId(id);
        }}
        onCopyLink={modals.handleCopyLink}
        onClose={modals.closeMenu}
      />

      {/* Reel Modals (Comments Drawer, Share, Insights, Likes, Report, SaveToCollection) */}
      <ReelModals
        commentsModalOpen={modals.commentsModalOpen}
        selectedPostId={modals.selectedPostId}
        onCloseComments={() => {
          modals.setCommentsModalOpen(false);
          modals.setSelectedPostId(null);
        }}
        shareModalReel={modals.shareModalReel}
        onCloseShare={() => modals.setShareModalReel(null)}
        onShareComplete={modals.handleShareComplete}
        insightsReel={modals.insightsReel}
        onCloseInsights={() => modals.setInsightsReel(null)}
        likesModalReelId={modals.likesModalReelId}
        onCloseLikes={() => modals.setLikesModalReelId(null)}
        reportModalOpen={modals.reportModalOpen}
        reportReelId={modals.reportReelId}
        onCloseReport={() => {
          modals.setReportModalOpen(false);
          modals.setReportReelId(null);
        }}
        onReportSuccess={() => modals.handleReportSuccess(feed.reels)}
        saveToCollReelId={modals.saveToCollReelId}
        onCloseSaveToColl={() => modals.setSaveToCollReelId(null)}
        onSavedToCollection={modals.handleSavedToCollection}
      />
    </div>
  );
};

export default ReelsPage;
