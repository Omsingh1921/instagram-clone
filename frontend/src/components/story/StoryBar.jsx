import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Plus, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import Avatar from '../common/Avatar';
import { Skeleton } from '../ui/Skeleton';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useUpload } from '../../context/UploadContext';
import { useToast } from '../../context/ToastContext';
import './StoryBar.css';

const StoryViewerModal = lazy(() => import('./StoryViewerModal'));
const CreateStoryModal = lazy(() => import('../modals/CreateStoryModal'));

export const StoryBar = () => {
  const [groupedStories, setGroupedStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeStoryGroupIdx, setActiveStoryGroupIdx] = useState(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const uploadCtx = useUpload();
  const { showSuccess } = useToast() || {};

  const storyUpload = uploadCtx?.uploads?.find(
    (u) => u.type === 'story' && u.status === 'uploading'
  );
  const isStoryUploading = Boolean(storyUpload);
  const storyScrollRef = useRef(null);
  const storyMouseDragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, dragged: false });
  const storySuppressClickRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollState = () => {
    if (storyScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storyScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const drag = storyMouseDragRef.current;
      const el = storyScrollRef.current;
      if (!drag.active || !el) return;
      const deltaX = e.clientX - drag.startX;
      if (Math.abs(deltaX) > 6) {
        drag.dragged = true;
        storySuppressClickRef.current = true;
        el.classList.add('is-dragging');
      }
      if (drag.dragged) {
        el.scrollLeft = drag.startScrollLeft - deltaX;
      }
    };

    const handleMouseUp = () => {
      const drag = storyMouseDragRef.current;
      const el = storyScrollRef.current;
      if (!drag.active) return;
      drag.active = false;
      el?.classList.remove('is-dragging');
      if (drag.dragged) {
        setTimeout(() => {
          storySuppressClickRef.current = false;
        }, 60);
      }
      drag.dragged = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleStoryBarMouseDown = (e) => {
    if (e.button !== 0 || !storyScrollRef.current) return;
    storyMouseDragRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: storyScrollRef.current.scrollLeft,
      dragged: false,
    };
  };

  const handleStoryBarWheel = (e) => {
    const el = storyScrollRef.current;
    if (!el) return;
    // Allow Shift+wheel or horizontal trackpad swipe to scroll stories smoothly without hijacking vertical page scroll
    if (e.shiftKey && Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0) {
      el.scrollLeft += e.deltaX;
    }
  };

  useEffect(() => {
    checkScrollState();
    const handleResize = () => checkScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [groupedStories]);

  const handleScrollRight = () => {
    if (storyScrollRef.current) {
      storyScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const handleScrollLeft = () => {
    if (storyScrollRef.current) {
      storyScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const loadStoryFeed = useCallback(async () => {
    try {
      const res = await storyService.getStoryFeed();
      const rawData = res?.data?.data || res?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : [];

      const parsedGroups = [];

      list.forEach((item) => {
        if (!item) return;

        // Case A: Backend UserStoriesResponse { user, stories, allViewed }
        if (item.user && Array.isArray(item.stories)) {
          if (item.stories.length === 0) return;
          const author = {
            id: String(item.user.id || item.user.userId || ''),
            username: item.user.username,
            displayName: item.user.displayName || item.user.fullName,
            avatarUrl: item.user.avatarUrl || item.user.profilePictureUrl,
          };
          const hasUnviewed = !item.allViewed || item.stories.some((s) => !s.viewed);
          const isCloseFriends = item.stories.some((s) => s.isCloseFriends);
          parsedGroups.push({
            author,
            stories: item.stories,
            hasUnviewed,
            isCloseFriends,
          });
          return;
        }

        // Case B: Flat story object { author, mediaUrl, viewed, ... }
        const author = item.author || item.user;
        const authorId = String(author?.id || author?.userId || '');
        if (!authorId) return;

        let existing = parsedGroups.find((g) => String(g.author?.id) === authorId);
        if (!existing) {
          existing = {
            author: {
              id: authorId,
              username: author.username,
              displayName: author.displayName || author.fullName,
              avatarUrl: author.avatarUrl || author.profilePictureUrl,
            },
            stories: [],
            hasUnviewed: false,
            isCloseFriends: false,
          };
          parsedGroups.push(existing);
        }
        existing.stories.push(item);
        if (!item.viewed) {
          existing.hasUnviewed = true;
        }
        if (item.isCloseFriends) {
          existing.isCloseFriends = true;
        }
      });

      // Ensure current user's existing stories are fetched if getStoryFeed missed them
      const curId = currentUser?.id || currentUser?.userId;
      if (curId) {
        const hasMyGroup = parsedGroups.some((g) => {
          const authorId = String(g.author?.id || g.author?.userId || '');
          const authorUsername = g.author?.username?.toLowerCase();
          const myUsername = currentUser?.username?.toLowerCase();
          return (authorId && authorId === String(curId)) || (myUsername && authorUsername === myUsername);
        });

        if (!hasMyGroup) {
          try {
            const userStoriesRes = await storyService.getUserStories(curId);
            const myData = userStoriesRes?.data?.data || userStoriesRes?.data || userStoriesRes;
            if (myData?.stories && Array.isArray(myData.stories) && myData.stories.length > 0) {
              const myAuthor = {
                id: String(myData.user?.id || curId),
                username: myData.user?.username || currentUser?.username,
                displayName: myData.user?.displayName || currentUser?.displayName,
                avatarUrl: myData.user?.avatarUrl || currentUser?.avatarUrl,
              };
              parsedGroups.unshift({
                author: myAuthor,
                stories: myData.stories,
                hasUnviewed: !myData.allViewed || myData.stories.some((s) => !s.viewed),
                isCloseFriends: myData.stories.some((s) => s.isCloseFriends),
              });
            }
          } catch {
            // ignore if no active stories
          }
        }
      }

      setGroupedStories(parsedGroups);
    } catch {
      setGroupedStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, [currentUser?.id, currentUser?.userId, currentUser?.username, currentUser?.displayName, currentUser?.avatarUrl]);

  useEffect(() => {
    loadStoryFeed();

    const handleRefresh = () => loadStoryFeed();
    window.addEventListener('story:refresh', handleRefresh);
    window.addEventListener('feed:refresh', handleRefresh);

    return () => {
      window.removeEventListener('story:refresh', handleRefresh);
      window.removeEventListener('feed:refresh', handleRefresh);
    };
  }, [loadStoryFeed, currentUser?.id]);

  const currentUserIdStr =
    currentUser?.id || currentUser?.userId
      ? String(currentUser.id || currentUser.userId)
      : null;
  const currentUsernameStr = currentUser?.username
    ? String(currentUser.username).toLowerCase()
    : null;

  const isMyGroup = useCallback(
    (g) => {
      if (!g || !g.author) return false;
      const authorId = String(g.author.id || g.author.userId || '');
      if (currentUserIdStr && authorId && authorId === currentUserIdStr) return true;
      if (authorId === 'current-user') return true;
      if (
        currentUsernameStr &&
        g.author.username &&
        g.author.username.toLowerCase() === currentUsernameStr
      ) {
        return true;
      }
      return false;
    },
    [currentUserIdStr, currentUsernameStr]
  );

  const effectiveGroupedStories = React.useMemo(() => {
    if (!isStoryUploading || !storyUpload) {
      return groupedStories;
    }

    const uploadingStoryItem = {
      id: `uploading-story-${storyUpload.id}`,
      mediaUrl: storyUpload.mediaUrl || storyUpload.thumbnail,
      mediaType: storyUpload.mediaType || 'IMAGE',
      isUploading: true,
      uploadProgress: storyUpload.progress || 10,
      createdAt: new Date().toISOString(),
      isCloseFriends: storyUpload.isCloseFriends || false,
      question: storyUpload.question ? { prompt: storyUpload.question, totalResponses: 0 } : null,
      poll: storyUpload.poll,
      quiz: storyUpload.quiz,
      slider: storyUpload.slider,
      countdown: storyUpload.countdown,
      link: storyUpload.link,
      location: storyUpload.location,
      hashtag: storyUpload.hashtag,
      audioTitle: storyUpload.audioTitle,
      audioArtist: storyUpload.audioArtist,
      viewCount: 0,
    };

    const existingGroupIdx = groupedStories.findIndex(isMyGroup);

    if (existingGroupIdx >= 0) {
      return groupedStories.map((group, idx) => {
        if (idx !== existingGroupIdx) return group;
        // Keep all previously uploaded stories and append currently uploading story at the end
        const existingStories = (group.stories || []).filter((s) => !s.isUploading);
        return {
          ...group,
          stories: [...existingStories, uploadingStoryItem],
          hasUnviewed: true,
        };
      });
    }

    // No existing group found for current user: create one with uploading story
    const myUploadingGroup = {
      author: {
        id: currentUserIdStr || 'current-user',
        username: currentUser?.username || 'You',
        displayName: currentUser?.displayName || currentUser?.fullName || 'You',
        avatarUrl: currentUser?.avatarUrl || currentUser?.profilePictureUrl || storyUpload.thumbnail,
      },
      stories: [uploadingStoryItem],
      hasUnviewed: true,
      isCloseFriends: storyUpload.isCloseFriends || false,
    };

    return [myUploadingGroup, ...groupedStories];
  }, [groupedStories, isStoryUploading, storyUpload, isMyGroup, currentUserIdStr, currentUser]);

  const myGroup = effectiveGroupedStories.find(isMyGroup);
  const otherGroups = effectiveGroupedStories.filter((g) => !isMyGroup(g));

  const handleMyStoryClick = () => {
    if (myGroup && myGroup.stories?.length > 0) {
      const myIdx = effectiveGroupedStories.indexOf(myGroup);
      setActiveStoryGroupIdx(myIdx >= 0 ? myIdx : 0);
      setActiveStoryIdx(0);
    } else {
      setCreateStoryOpen(true);
    }
  };

  return (
    <>
      <div className="story-bar-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="story-scroll-btn prev"
            onClick={handleScrollLeft}
            aria-label="Previous stories"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div
          className="story-bar-container"
          ref={storyScrollRef}
          onScroll={checkScrollState}
          onMouseDown={handleStoryBarMouseDown}
          onWheel={handleStoryBarWheel}
          onClickCapture={(e) => {
            if (storySuppressClickRef.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        >
          {/* Current User Story Item */}
          <div className="story-bar-item">
            <div
              className="story-avatar-holder"
              onClick={handleMyStoryClick}
              title={isStoryUploading ? `Story is uploading (${storyUpload.progress}%)...` : 'Your story'}
            >
              <Avatar
                src={
                  currentUser?.avatarUrl ||
                  currentUser?.profilePictureUrl ||
                  myGroup?.author?.avatarUrl ||
                  (isStoryUploading && storyUpload.mediaType !== 'VIDEO' ? storyUpload.thumbnail : null)
                }
                alt="Your story"
                size="lg"
                hasStory={isStoryUploading || (!!myGroup && myGroup.stories?.length > 0)}
                storyViewed={isStoryUploading ? false : (myGroup ? !myGroup.hasUnviewed : false)}
                isCloseFriends={myGroup ? myGroup.isCloseFriends : false}
                isUploading={isStoryUploading}
              />
              <div
                className={`add-story-badge ${isStoryUploading ? 'uploading-badge' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isStoryUploading) {
                    setCreateStoryOpen(true);
                  } else if (showSuccess) {
                    showSuccess(`Story is uploading (${storyUpload.progress}%)...`);
                  }
                }}
                title={isStoryUploading ? `Uploading story (${storyUpload.progress}%)...` : 'Add to story'}
              >
                {isStoryUploading ? (
                  <RotateCw size={11} strokeWidth={2.8} className="story-upload-spinning-icon" />
                ) : (
                  <Plus size={12} strokeWidth={3} />
                )}
              </div>
            </div>
            <span className={`story-username-label ${isStoryUploading ? 'uploading-story-label' : ''}`}>
              {isStoryUploading ? 'Uploading...' : 'Your story'}
            </span>
          </div>

          {/* Other Users' Stories */}
          {loadingStories && otherGroups.length === 0 ? (
            [...Array(5)].map((_, i) => (
              <div key={`story-sk-${i}`} className="story-bar-item" aria-hidden="true">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="w-12 h-2.5 mt-1" />
              </div>
            ))
          ) : (
            otherGroups.map((group) => {
              const groupIdx = effectiveGroupedStories.indexOf(group);
              return (
                <button
                  key={group.author?.id}
                  type="button"
                  className="story-bar-item"
                  onClick={() => {
                    setActiveStoryGroupIdx(groupIdx >= 0 ? groupIdx : 0);
                    setActiveStoryIdx(0);
                  }}
                >
                  <div className="story-avatar-holder">
                    <Avatar
                      src={(group.author?.avatarUrl || group.author?.profilePictureUrl)}
                      alt={group.author?.username}
                      size="lg"
                      hasStory={true}
                      storyViewed={!group.hasUnviewed}
                      isCloseFriends={group.isCloseFriends}
                    />
                  </div>
                  <span className="story-username-label">{group.author?.username}</span>
                </button>
              );
            })
          )}
        </div>
        {canScrollRight && (
          <button
            type="button"
            className="story-scroll-btn next"
            onClick={handleScrollRight}
            aria-label="Next stories"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Story Viewer Modal */}
      {activeStoryGroupIdx !== null && (
        <Suspense fallback={null}>
          <StoryViewerModal
            isOpen={activeStoryGroupIdx !== null}
            storyGroups={effectiveGroupedStories}
            initialGroupIdx={activeStoryGroupIdx}
            initialStoryIdx={activeStoryIdx}
            onClose={() => {
              setActiveStoryGroupIdx(null);
              setActiveStoryIdx(0);
              loadStoryFeed();
            }}
          />
        </Suspense>
      )}

      {/* Create Story Modal */}
      {createStoryOpen && (
        <Suspense fallback={null}>
          <CreateStoryModal
            isOpen={createStoryOpen}
            onClose={() => setCreateStoryOpen(false)}
            onStoryCreated={() => {
              loadStoryFeed();
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default StoryBar;
