import React from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Eye,
  TrendingUp,
  Users,
  BarChart2,
  X,
} from 'lucide-react';
import Modal from '../common/Modal';
import { formatCount } from '../../utils';
import './InsightsModal.css';

export const InsightsModal = ({ isOpen, onClose, post, isReel }) => {
  if (!isOpen || !post) return null;

  const likes = post.likeCount || 0;
  const comments = post.commentCount || 0;
  const shares = post.shareCount || 0;
  const saves = post.saveCount || (post.isSaved ? 1 : 0);
  const views = post.viewCount || (isReel ? Math.max(likes * 3 + shares * 5, 1) : likes * 2 + comments * 3 + 12);
  const totalInteractions = likes + comments + shares + saves;
  const accountsReached = Math.round(views * 0.85);

  const media = post.media?.[0];
  const thumbnail = media?.mediaUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post Insights" size="md">
      <div className="insights-modal-container">
        {/* Top Summary Header */}
        <div className="insights-overview-header">
          {thumbnail && (
            <div className="insights-thumbnail-wrapper">
              {media?.mediaType === 'VIDEO' || isReel ? (
                <video src={thumbnail} className="insights-media-thumb" muted />
              ) : (
                <img src={thumbnail} alt="Post" className="insights-media-thumb" />
              )}
            </div>
          )}
          <div className="insights-summary-text">
            <h3 className="insights-title">{isReel ? 'Reel Performance' : 'Post Performance'}</h3>
            <span className="insights-timestamp">
              Published {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Big Reach & Impressions Hero */}
        <div className="insights-hero-stat-card">
          <div className="hero-stat-item">
            <span className="hero-stat-label">
              <Users size={14} /> Accounts reached
            </span>
            <span className="hero-stat-value">{formatCount(accountsReached)}</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <span className="hero-stat-label">
              <Eye size={14} /> Impressions
            </span>
            <span className="hero-stat-value">{formatCount(views)}</span>
          </div>
        </div>

        {/* Content Interactions Section */}
        <div className="insights-section">
          <div className="insights-section-header">
            <h4 className="insights-section-title">Content Interactions</h4>
            <span className="insights-total-badge">{formatCount(totalInteractions)}</span>
          </div>

          <div className="insights-metrics-grid">
            <div className="metric-tile">
              <div className="metric-icon-bubble likes">
                <Heart size={18} fill="#ef4444" color="#ef4444" />
              </div>
              <span className="metric-num">{formatCount(likes)}</span>
              <span className="metric-name">Likes</span>
            </div>

            <div className="metric-tile">
              <div className="metric-icon-bubble comments">
                <MessageCircle size={18} color="#0095f6" />
              </div>
              <span className="metric-num">{formatCount(comments)}</span>
              <span className="metric-name">Comments</span>
            </div>

            <div className="metric-tile">
              <div className="metric-icon-bubble shares">
                <Send size={18} color="#10b981" />
              </div>
              <span className="metric-num">{formatCount(shares)}</span>
              <span className="metric-name">Shares</span>
            </div>

            <div className="metric-tile">
              <div className="metric-icon-bubble saves">
                <Bookmark size={18} fill="#f59e0b" color="#f59e0b" />
              </div>
              <span className="metric-num">{formatCount(saves)}</span>
              <span className="metric-name">Saves</span>
            </div>
          </div>
        </div>

        {/* Engagement Rate Breakdown */}
        <div className="insights-section">
          <h4 className="insights-section-title">Profile Activity</h4>
          <div className="insights-activity-list">
            <div className="activity-row">
              <span className="activity-label">Profile visits from this post</span>
              <span className="activity-value">{Math.round(accountsReached * 0.12)}</span>
            </div>
            <div className="activity-row">
              <span className="activity-label">Follows gained</span>
              <span className="activity-value">+{Math.max(1, Math.round(likes * 0.08))}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InsightsModal;
