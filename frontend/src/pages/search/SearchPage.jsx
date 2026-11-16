import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  X,
  User,
  Grid,
  Hash,
  Compass,
  Heart,
  MessageCircle,
  Film,
  Play,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import CommentsModal from '../../components/modals/CommentsModal';
import { Skeleton, SkeletonMediaGrid } from '../../components/ui/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import searchService from '../../services/search.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCount } from '../../utils';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import './SearchPage.css';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'tags', 'posts'
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // Recent searches & Explore feed
  const [recentSearches, setRecentSearches] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const debouncedQuery = useDebounce(query, 300);
  const { user: currentUser, isFollowing, toggleFollow } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // 1. Initial Load: Fetch Recent Searches & Explore Feed
  const fetchRecentAndExplore = useCallback(async () => {
    try {
      setLoadingExplore(true);
      const [recentRes, exploreRes] = await Promise.allSettled([
        searchService.getRecentSearches(),
        searchService.getExploreFeed(0, 18),
      ]);

      if (recentRes.status === 'fulfilled') {
        const recentList = recentRes.value?.data || recentRes.value || [];
        const seen = new Set();
        const unique = [];
        for (const item of (Array.isArray(recentList) ? recentList : [])) {
          const key = item.targetUser?.id
            ? `USER:${item.targetUser.id}`
            : `QUERY:${item.query?.trim()?.toLowerCase() || ''}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        setRecentSearches(unique);
      }

      if (exploreRes.status === 'fulfilled') {
        const exploreList =
          exploreRes.value?.data?.content ||
          exploreRes.value?.content ||
          exploreRes.value?.data ||
          [];
        setExplorePosts(Array.isArray(exploreList) ? exploreList : []);
      }
    } catch {
      // Non-critical fallback
    } finally {
      setLoadingExplore(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentAndExplore();
  }, [fetchRecentAndExplore]);

  // 2. Perform Live Search when query or tab changes
  useEffect(() => {
    if (!debouncedQuery.trim() && !selectedTag) {
      setUsers([]);
      setTags([]);
      setPosts([]);
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);

        if (selectedTag && activeTab === 'posts') {
          const res = await searchService.getPostsByHashtag(selectedTag, 0, 20);
          const list = res?.data?.content || res?.content || res?.data || [];
          setPosts(list);
          return;
        }

        if (activeTab === 'users') {
          const res = await searchService.searchUsers(debouncedQuery, 0, 20);
          const list = res?.data?.content || res?.content || res?.data || [];
          setUsers(
            list.filter(
              (u) =>
                String(u.id) !== String(currentUser?.id) &&
                u.username !== currentUser?.username &&
                u.role !== 'ROLE_ADMIN' &&
                u.role !== 'ADMIN' &&
                u.username?.toLowerCase() !== 'admin'
            )
          );
        } else if (activeTab === 'tags') {
          const res = await searchService.searchHashtags(debouncedQuery);
          const list = res?.data || res || [];
          setTags(Array.isArray(list) ? list : []);
        } else {
          const res = await searchService.searchPosts(debouncedQuery, 0, 20);
          const list = res?.data?.content || res?.content || res?.data || [];
          setPosts(
            list.filter(
              (p) =>
                p.author?.role !== 'ROLE_ADMIN' &&
                p.author?.role !== 'ADMIN' &&
                p.author?.username?.toLowerCase() !== 'admin'
            )
          );
        }
      } catch {
        if (activeTab === 'users') setUsers([]);
        else if (activeTab === 'tags') setTags([]);
        else setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, activeTab, selectedTag, currentUser?.id, currentUser?.username]);

  // 3. User interaction: Clicking an account (navigate + record search)
  const handleUserClick = async (targetUser) => {
    try {
      await searchService.recordSearch({
        targetUserId: targetUser.id,
        searchType: 'USER',
      });
    } catch {
      // Non-critical
    }
    navigate(`/profile/${targetUser.id}`);
  };

  // 4. User interaction: Clicking a hashtag (switch tab + filter posts + record search)
  const handleTagClick = async (tagName) => {
    const cleanTag = tagName.replace(/^#/, '');
    setSelectedTag(cleanTag);
    setActiveTab('posts');
    setQuery(`#${cleanTag}`);

    try {
      await searchService.recordSearch({
        query: `#${cleanTag}`,
        searchType: 'HASHTAG',
      });
    } catch {
      // Non-critical
    }
  };

  // 5. Follow / Unfollow user
  const handleFollowToggle = async (e, targetUserId) => {
    e.stopPropagation();
    try {
      const nextState = await toggleFollow(targetUserId);
      if (nextState) {
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  // 6. Delete individual recent search
  const handleDeleteRecent = async (e, id) => {
    e.stopPropagation();
    try {
      await searchService.deleteRecentSearch(id);
      setRecentSearches((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      showError(err.message || 'Could not remove recent search');
    }
  };

  // 7. Clear all recent searches
  const handleClearAllRecent = async () => {
    try {
      await searchService.clearAllRecentSearches();
      setRecentSearches([]);
      showSuccess('Recent searches cleared');
    } catch (err) {
      showError(err.message || 'Failed to clear recent searches');
    }
  };

  // 8. Clear search bar input & active tag
  const handleClearInput = () => {
    setQuery('');
    setSelectedTag(null);
  };

  const renderPostTile = (post, fallbackAlt) => {
    const media = post.media?.[0] || post;
    const mediaUrl = media?.mediaUrl || post.mediaUrl || post.videoUrl;
    const isVideo =
      post.type === 'REEL' ||
      post.contentType === 'REEL' ||
      Boolean(post.isReel) ||
      media?.mediaType === 'VIDEO' ||
      (typeof mediaUrl === 'string' && (mediaUrl.includes('/video/') || mediaUrl.endsWith('.mp4')));
    const isReel = post.type === 'REEL' || post.contentType === 'REEL' || Boolean(post.isReel);
    const isCarousel = (post.media?.length || 1) > 1;

    const posterUrl = isVideo
      ? (post.thumbnailUrl || getVideoPosterUrl(mediaUrl, post.thumbnailUrl))
      : mediaUrl;

    return (
      <div
        key={post.id}
        className="search-grid-item"
        onClick={() => setSelectedPostId(post.id)}
        onMouseEnter={(e) => {
          if (isVideo) {
            const vid = e.currentTarget.querySelector('video');
            if (vid) {
              const playPromise = vid.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {});
              }
            }
          }
        }}
        onMouseLeave={(e) => {
          if (isVideo) {
            const vid = e.currentTarget.querySelector('video');
            if (vid) {
              vid.pause();
              vid.currentTime = 0;
            }
          }
        }}
      >
        {isVideo ? (
          <video
            src={mediaUrl}
            poster={posterUrl}
            className="search-grid-media"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={mediaUrl}
            alt={post.caption || fallbackAlt}
            className="search-grid-media"
            loading="lazy"
          />
        )}

        {/* Corner Type Badge */}
        {isReel ? (
          <div className="search-corner-badge" title="Reel">
            <Film size={13} />
          </div>
        ) : isCarousel ? (
          <div className="search-corner-badge" title="Carousel">
            <Layers size={13} />
          </div>
        ) : isVideo ? (
          <div className="search-corner-badge" title="Video">
            <Play size={13} fill="currentColor" strokeWidth={0} />
          </div>
        ) : null}

        {/* Hover Overlay with Stats */}
        <div className="search-item-overlay">
          <div className="search-overlay-stat">
            <Heart size={18} fill="#fff" />
            <span>{formatCount(post.likeCount || 0)}</span>
          </div>
          <div className="search-overlay-stat">
            <MessageCircle size={18} fill="#fff" />
            <span>{formatCount(post.commentCount || 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  const isQueryEmpty = !query.trim() && !selectedTag;

  return (
    <div className="search-page-wrapper">
      <div className="search-page-container">
        {/* Header & Search Bar */}
        <div className="search-header-area">
          <h1 className="search-page-title">Search</h1>
          <div className="search-input-wrapper">
            <SearchIcon size={18} className="search-leading-icon" />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search accounts, #tags, or posts..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedTag) setSelectedTag(null);
              }}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearInput}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Categories Tabs */}
          <div className="search-tabs-row" role="tablist" aria-label="Search categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'users'}
              className={`search-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('users');
                setSelectedTag(null);
              }}
            >
              <User size={15} />
              <span>Accounts</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'tags'}
              className={`search-tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
              onClick={() => setActiveTab('tags')}
            >
              <Hash size={15} />
              <span>Tags</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'posts'}
              className={`search-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <Grid size={15} />
              <span>Posts</span>
            </button>
          </div>
        </div>

        {/* ACTIVE TAG FILTER BANNER */}
        {selectedTag && (
          <div className="search-tag-banner">
            <div className="search-tag-badge">
              <Hash size={15} />
              <span>{selectedTag}</span>
            </div>
            <button
              type="button"
              className="search-tag-clear-btn"
              onClick={handleClearInput}
            >
              Clear filter <X size={14} />
            </button>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        {loading ? (
          activeTab === 'posts' ? (
            <SkeletonMediaGrid count={6} className="max-w-none gap-3.5 [&>div]:rounded-2xl" />
          ) : activeTab === 'tags' ? (
            <div className="search-tags-list">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="search-skeleton-row">
                  <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="w-32 h-3.5" />
                    <Skeleton className="w-20 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="search-loading-skeletons">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="search-skeleton-row justify-between">
                  <div className="flex items-center gap-3.5 flex-1">
                    <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="w-1/2 h-3.5" />
                      <Skeleton className="w-1/4 h-2.5" />
                    </div>
                  </div>
                  <Skeleton className="w-20 h-8 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          )
        ) : isQueryEmpty ? (
          /* ==================== EMPTY QUERY STATE (RECENT SEARCHES + EXPLORE) ==================== */
          <div className="search-empty-flow">
            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <section className="search-recent-section">
                <div className="search-recent-header">
                  <span className="search-section-label">
                    <Clock size={16} className="search-section-icon" /> Recent
                  </span>
                  <button
                    type="button"
                    className="search-clear-all-btn"
                    onClick={handleClearAllRecent}
                  >
                    Clear all
                  </button>
                </div>

                <div className="search-recent-list">
                  {recentSearches.map((item) => {
                    const isUser = item.searchType === 'USER' && item.targetUser;
                    const isTag = item.searchType === 'HASHTAG';
                    const hasStory = Boolean(
                      item.targetUser?.hasActiveStory || item.targetUser?.hasStory
                    );

                    return (
                      <div
                        key={item.id}
                        className="search-recent-item"
                        onClick={() => {
                          if (isUser) navigate(`/profile/${item.targetUser.id}`);
                          else if (isTag) handleTagClick(item.query);
                          else setQuery(item.query || '');
                        }}
                      >
                        <div className="search-recent-info">
                          {isUser ? (
                            <Avatar
                              src={
                                item.targetUser.avatarUrl ||
                                item.targetUser.profilePictureUrl
                              }
                              alt={item.targetUser.username}
                              size="md"
                              hasStory={hasStory}
                            />
                          ) : (
                            <div className="search-tag-avatar">
                              <Hash size={19} />
                            </div>
                          )}
                          <div className="search-recent-text">
                            <span className="search-item-primary">
                              {isUser
                                ? item.targetUser.username
                                : item.query || 'Search'}
                            </span>
                            <span className="search-item-secondary">
                              {isUser
                                ? item.targetUser.displayName || 'Instagram user'
                                : 'Hashtag'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="search-recent-remove-btn"
                          onClick={(e) => handleDeleteRecent(e, item.id)}
                          title="Remove from history"
                          aria-label="Remove recent search"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Explore / Trending Discovery Section */}
            <section className="search-explore-section">
              <div className="search-explore-header">
                <span className="search-section-label">
                  <Sparkles size={16} className="search-section-icon" /> Discover
                </span>
              </div>

              {loadingExplore ? (
                <SkeletonMediaGrid count={6} className="max-w-none gap-3.5 [&>div]:rounded-2xl" />
              ) : explorePosts.length === 0 ? (
                <div className="search-empty-glass">
                  <EmptyState
                    icon={Compass}
                    title="Search Instagram"
                    description="Search for accounts, hashtags, or keywords above."
                  />
                </div>
              ) : (
                <div className="search-grid">
                  {explorePosts.map((post) => renderPostTile(post, 'Explore post'))}
                </div>
              )}
            </section>
          </div>
        ) : activeTab === 'users' ? (
          /* ==================== USERS TAB RESULTS ==================== */
          users.length === 0 ? (
            <div className="search-empty-glass">
              <EmptyState
                icon={User}
                title={query ? 'No accounts found' : 'Find friends and creators'}
                description={
                  query
                    ? 'Try searching for another name or username.'
                    : 'Search for accounts by typing in the search bar above.'
                }
              />
            </div>
          ) : (
            <div className="search-results-list">
              {users.map((u) => {
                const isMe = currentUser?.id === u.id;
                const isTargetFollowing = isFollowing(u.id);
                const hasStory = Boolean(u.hasActiveStory || u.hasStory);

                return (
                  <div
                    key={u.id}
                    className="search-user-row"
                    onClick={() => handleUserClick(u)}
                  >
                    <div className="search-user-info">
                      <Avatar
                        src={u.profilePictureUrl || u.avatarUrl}
                        alt={u.username}
                        size="md"
                        hasStory={hasStory}
                      />
                      <div className="search-user-text">
                        <span className="search-user-uname">{u.username}</span>
                        <span className="search-user-fname">
                          {u.displayName || u.fullName}
                        </span>
                      </div>
                    </div>

                    {!isMe && (
                      <button
                        type="button"
                        className={`search-follow-btn ${isTargetFollowing ? 'secondary' : 'primary'
                          }`}
                        onClick={(e) => handleFollowToggle(e, u.id)}
                      >
                        {isTargetFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === 'tags' ? (
          /* ==================== TAGS TAB RESULTS ==================== */
          tags.length === 0 ? (
            <div className="search-empty-glass">
              <EmptyState
                icon={Hash}
                title="No hashtags found"
                description="Try searching for a different topic or tag."
              />
            </div>
          ) : (
            <div className="search-tags-list">
              {tags.map((tag) => (
                <div
                  key={tag.name}
                  className="search-tag-row"
                  onClick={() => handleTagClick(tag.name)}
                >
                  <div className="search-tag-icon-circle">
                    <Hash size={19} />
                  </div>
                  <div className="search-tag-meta">
                    <span className="search-tag-name">#{tag.name}</span>
                    <span className="search-tag-count">
                      {formatCount(tag.postCount || 0)} posts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : /* ==================== POSTS TAB RESULTS ==================== */
          posts.length === 0 ? (
            <div className="search-empty-glass">
              <EmptyState
                icon={Grid}
                title={query ? 'No posts found' : 'Search for posts'}
                description={
                  query ? 'No posts matched your query.' : 'Search keywords or tags.'
                }
              />
            </div>
          ) : (
            <div className="search-grid">
              {posts.map((post) => renderPostTile(post, 'Post'))}
            </div>
          )}

        {/* Post Modal on Click */}
        {selectedPostId && (
          <CommentsModal
            isOpen={!!selectedPostId}
            onClose={() => setSelectedPostId(null)}
            postId={selectedPostId}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
