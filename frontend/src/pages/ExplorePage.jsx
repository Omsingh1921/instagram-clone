import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Copy, Video, Film, Compass } from 'lucide-react';
import CommentsModal from '../components/modals/CommentsModal';
import EmptyState from '../components/common/EmptyState';
import { Skeleton, SkeletonMediaGrid } from '../components/ui/Skeleton';
import ProgressiveImage from '../components/common/ProgressiveImage';
import { getVideoPosterUrl } from '../utils/mediaUrl';
import feedService from '../services/feed.service';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { formatCount } from '../utils';
import './ExplorePage.css';

export const ExplorePage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const fetchExplore = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const res = await feedService.getExploreFeed(pageNum, 18);
      const list = res?.data?.content || res?.content || res?.data || [];
      const isLast = res?.data?.last ?? res?.last ?? list.length < 18;

      if (append) {
        setPosts((prev) => [...prev, ...list]);
      } else {
        setPosts(list);
      }

      setHasMore(!isLast && list.length > 0);
      setPage(pageNum);
    } catch {
      if (!append) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchExplore(0, false);
  }, [fetchExplore]);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: () => fetchExplore(page + 1, true),
  });

  return (
    <div className="explore-page-container">
      {loading ? (
        <div className="explore-grid">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="w-full aspect-square rounded-sm" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No explore posts yet"
          description="Be the first to share content on the platform to appear here."
        />
      ) : (
        <>
          <div className="explore-grid">
            {posts.map((post) => {
              const isReel = post.itemType === 'REEL' || post.type === 'REEL' || post.contentType === 'REEL' || Boolean(post.isReel);
              const firstMedia = post.media?.[0] || (isReel ? { mediaUrl: post.videoUrl || post.mediaUrl, mediaType: 'VIDEO' } : null);
              const mediaUrl = firstMedia?.mediaUrl || post.videoUrl || post.mediaUrl;
              const isVideo =
                isReel ||
                firstMedia?.mediaType === 'VIDEO' ||
                (typeof mediaUrl === 'string' && (mediaUrl.includes('/video/') || mediaUrl.endsWith('.mp4')));
              const hasMultiple = (post.media?.length || 0) > 1;
              const displayUrl = isVideo
                ? (post.thumbnailUrl || getVideoPosterUrl(mediaUrl, post.thumbnailUrl))
                : (mediaUrl || post.thumbnailUrl);

              return (
                <div
                  key={post.id}
                  className="explore-grid-item"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  {/* Media with Progressive Blur-Up loading & Poster Frame */}
                  <ProgressiveImage
                    src={displayUrl}
                    alt={post.caption || 'Explore post'}
                    className="explore-media"
                    width={600}
                    aspectRatio="1/1"
                  />

                  {/* Multiple/Video Indicator */}
                  {hasMultiple && (
                    <div className="explore-media-badge">
                      <Copy size={18} />
                    </div>
                  )}
                  {isVideo && (
                    <div className="explore-media-badge">
                      {isReel ? <Film size={18} /> : <Video size={18} />}
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="explore-item-overlay">
                    <div className="overlay-stat">
                      <Heart size={20} fill="#fff" />
                      <span>{formatCount(post.likeCount || 0)}</span>
                    </div>
                    <div className="overlay-stat">
                      <MessageCircle size={20} fill="#fff" />
                      <span>{formatCount(post.commentCount || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="w-full flex flex-col items-center mt-4">
              {loadingMore ? (
                <SkeletonMediaGrid count={3} />
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary feed-load-more-btn"
                  onClick={() => fetchExplore(page + 1, true)}
                  style={{ marginTop: '16px' }}
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Post Modal */}
      {selectedPostId && (
        <CommentsModal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
          onPostUpdated={() => fetchExplore(0, false)}
        />
      )}
    </div>
  );
};

export default ExplorePage;
