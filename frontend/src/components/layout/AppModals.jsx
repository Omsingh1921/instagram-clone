import React, { Suspense, lazy } from 'react';

const CreateModal = lazy(() => import('../modals/CreateModal'));
const CreatePostModal = lazy(() => import('../modals/CreatePostModal'));
const CreateStoryModal = lazy(() => import('../modals/CreateStoryModal'));
const CreateReelModal = lazy(() => import('../modals/CreateReelModal'));
const ReportProblemModal = lazy(() => import('../modals/ReportProblemModal'));
const SwitchAccountsModal = lazy(() => import('../modals/SwitchAccountsModal'));
const BreakReminderModal = lazy(() => import('../common/BreakReminderModal'));

export const AppModals = ({
  createModalOpen,
  setCreateModalOpen,
  createPostOpen,
  setCreatePostOpen,
  createStoryOpen,
  setCreateStoryOpen,
  createReelOpen,
  setCreateReelOpen,
  reportProblemOpen,
  setReportProblemOpen,
  switchAccountsOpen,
  setSwitchAccountsOpen,
  breakModalOpen,
  breakReminderMinutes,
  dismissBreakReminder,
  navigate,
}) => {
  const isAnyModalOpen =
    createModalOpen ||
    createPostOpen ||
    createStoryOpen ||
    createReelOpen ||
    reportProblemOpen ||
    switchAccountsOpen ||
    breakModalOpen;

  if (!isAnyModalOpen) return null;

  return (
    <Suspense fallback={null}>
      {createModalOpen && (
        <CreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSelectPost={() => setCreatePostOpen(true)}
          onSelectStory={() => setCreateStoryOpen(true)}
          onSelectReel={() => setCreateReelOpen(true)}
        />
      )}

      {createPostOpen && (
        <CreatePostModal
          isOpen={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          onPostCreated={() => {
            window.dispatchEvent(new Event('feed:refresh'));
          }}
        />
      )}

      {createStoryOpen && (
        <CreateStoryModal
          isOpen={createStoryOpen}
          onClose={() => setCreateStoryOpen(false)}
          onStoryCreated={() => {
            window.dispatchEvent(new Event('story:refresh'));
          }}
        />
      )}

      {createReelOpen && (
        <CreateReelModal
          isOpen={createReelOpen}
          onClose={() => setCreateReelOpen(false)}
          onReelCreated={() => {
            window.dispatchEvent(new Event('reel:refresh'));
          }}
        />
      )}

      {reportProblemOpen && (
        <ReportProblemModal
          isOpen={reportProblemOpen}
          onClose={() => setReportProblemOpen(false)}
        />
      )}

      {switchAccountsOpen && (
        <SwitchAccountsModal
          isOpen={switchAccountsOpen}
          onClose={() => setSwitchAccountsOpen(false)}
        />
      )}

      {breakModalOpen && (
        <BreakReminderModal
          isOpen={breakModalOpen}
          minutes={breakReminderMinutes}
          onContinue={dismissBreakReminder}
          onManageReminder={() => {
            dismissBreakReminder();
            navigate('/your-activity?tab=time');
          }}
        />
      )}
    </Suspense>
  );
};

export default AppModals;
