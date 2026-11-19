import React from 'react';
import {
  Search,
  RefreshCw,
  Film,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import Avatar from '../../common/Avatar';
import EmptyState from '../../common/EmptyState';
import { SkeletonAdminContentGrid } from '../../ui/Skeleton';
import { timeAgo } from '../../../utils';

export const AdminContentTab = ({
  contentType,
  switchTab,
  contentQuery,
  setContentQuery,
  loadContent,
  loadingContent,
  contentItems,
  deletingContentId,
  handleDeleteContentItem,
  contentPage,
  contentTotalPages,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="users-filter-bar">
        <div className="chart-mode-pills">
          {['POSTS', 'REELS', 'STORIES'].map((typeKey) => (
            <button
              key={typeKey}
              type="button"
              className={`chart-mode-btn ${contentType === typeKey ? 'active' : ''}`}
              onClick={() => switchTab('CONTENT', typeKey)}
            >
              {typeKey === 'POSTS' ? 'Posts' : typeKey === 'REELS' ? 'Reels' : 'Stories'}
            </button>
          ))}
        </div>

        <div className="users-search-box">
          <Search size={16} color="var(--adc-text-muted)" />
          <input
            type="text"
            placeholder={`Search ${contentType.toLowerCase()} by caption or @username...`}
            value={contentQuery}
            onChange={(e) => setContentQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="table-action-btn"
          onClick={() => loadContent(contentType, 0)}
          disabled={loadingContent}
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {loadingContent ? (
        <SkeletonAdminContentGrid count={6} />
      ) : contentItems.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={`No ${contentType.toLowerCase()} found`}
          description="No platform media matched your current filter."
        />
      ) : (
        <>
          <div className="content-explorer-grid">
            {contentItems.map((item) => (
              <div key={item.id} className="content-explorer-card">
                <div className="content-explorer-media">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.caption || item.contentType}
                      loading="lazy"
                    />
                  ) : (
                    <Film size={32} color="var(--adc-text-muted)" />
                  )}
                  <span className="content-type-chip">{item.contentType}</span>
                </div>

                <div className="content-explorer-body">
                  <div className="user-cell">
                    <Avatar
                      src={item.author?.avatarUrl}
                      alt={item.author?.username || 'user'}
                      size="xs"
                    />
                    <div className="user-cell-meta">
                      <span className="user-cell-username">@{item.author?.username}</span>
                      <span className="user-cell-displayname">
                        {item.createdAt ? timeAgo(item.createdAt) : ''}
                      </span>
                    </div>
                  </div>

                  <p className="content-explorer-caption">
                    {item.caption || 'No caption provided.'}
                  </p>

                  <div className="content-explorer-footer">
                    <span>
                      {item.likesCount ?? 0} likes · {item.commentsCount ?? 0} comments
                    </span>
                    <button
                      type="button"
                      className="table-action-btn danger"
                      disabled={deletingContentId === item.id}
                      onClick={() => handleDeleteContentItem(item)}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {contentTotalPages > 1 && (
            <div className="users-table-container">
              <div className="table-pagination">
                <span>
                  Showing page {contentPage + 1} of {contentTotalPages}
                </span>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="table-action-btn"
                    disabled={contentPage === 0}
                    onClick={() => loadContent(contentType, contentPage - 1)}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    className="table-action-btn"
                    disabled={contentPage >= contentTotalPages - 1}
                    onClick={() => loadContent(contentType, contentPage + 1)}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminContentTab;
