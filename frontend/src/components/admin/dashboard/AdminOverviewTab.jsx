import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Mail,
  Film,
  PlusCircle,
  BarChart3,
  PieChart,
  ShieldAlert,
  Flag,
  Clock,
  CheckCircle2,
  Activity,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Zap,
  Gavel,
  FileText,
  Sliders,
  Play,
  Image as ImageIcon,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import EmptyState from '../../common/EmptyState';
import Avatar from '../../common/Avatar';
import { Skeleton, SkeletonUserRows } from '../../ui/Skeleton';
import { PlatformGrowthChart, ContentDistributionDonut } from '../AdminCharts';
import { timeAgo } from '../../../utils';

export const AdminOverviewTab = ({
  stats,
  loadingStats,
  isStatsLoading,
  periodDays,
  loadStats,
  usersDelta,
  postsDelta,
  reelsDelta,
  storiesDelta,
  likesDelta,
  commentsDelta,
  sharesDelta,
  savesDelta,
  chartMode,
  setChartMode,
  activities,
  loadingActivity,
  handleOpenAllActivity,
  switchTab,
}) => {
  const kpiMetricSlot = (value) =>
    isStatsLoading ? <Skeleton className="w-12 h-7 my-0.5 rounded-md" /> : (value ?? 0).toLocaleString();

  const renderKpiDelta = (delta, periodNote) => (
    <div className="kpi-delta-row">
      {isStatsLoading ? (
        <Skeleton className="w-16 h-4 rounded-full" />
      ) : (
        <span className={`kpi-delta ${delta.direction}`}>
          {delta.direction === 'down' ? (
            <ArrowDownRight size={13} />
          ) : (
            <ArrowUpRight size={13} />
          )}
          {delta.label}
        </span>
      )}
      <span className="kpi-period-note">{periodNote}</span>
    </div>
  );

  const renderActivityVisual = (act) => {
    if (act.previewUrl) {
      return <img src={act.previewUrl} alt="" className="activity-thumb" loading="lazy" />;
    }
    if (act.type === 'REPORT_SUBMITTED') {
      return (
        <div className="activity-type-badge report">
          <Flag size={16} />
        </div>
      );
    }
    if (act.type === 'USER_FOLLOWED') {
      return (
        <div className="activity-type-badge">
          <Users size={16} />
        </div>
      );
    }
    return (
      <div className="activity-type-badge">
        <Play size={16} />
      </div>
    );
  };

  if (!loadingStats && !stats) {
    return (
      <EmptyState
        icon={Activity}
        title="No Statistics Available"
        description="Could not load platform metrics."
        actionLabel="Retry"
        onAction={() => loadStats(periodDays)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ROW 1: 4 Glassmorphism KPI Cards */}
      <div className="admin-kpi-grid">
        {/* Card 1: Total Users */}
        <button
          type="button"
          className="kpi-card kpi-users"
          onClick={() => switchTab('USERS')}
        >
          <div className="kpi-icon-badge kpi-badge-users">
            <Users size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Total Users</span>
            <span className="kpi-value">{kpiMetricSlot(stats?.totalUsers)}</span>
            {renderKpiDelta(usersDelta, `vs. previous ${stats?.periodDays ?? periodDays} days`)}
          </div>
          <Users size={38} className="kpi-watermark" />
        </button>

        {/* Card 2: Feed Posts */}
        <button
          type="button"
          className="kpi-card kpi-posts"
          onClick={() => switchTab('CONTENT', 'POSTS')}
        >
          <div className="kpi-icon-badge kpi-badge-posts">
            <Mail size={21} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Feed Posts</span>
            <span className="kpi-value">{kpiMetricSlot(stats?.totalPosts)}</span>
            {renderKpiDelta(postsDelta, `vs. previous ${stats?.periodDays ?? periodDays} days`)}
          </div>
          <ImageIcon size={38} className="kpi-watermark" />
        </button>

        {/* Card 3: Reels */}
        <button
          type="button"
          className="kpi-card kpi-reels"
          onClick={() => switchTab('CONTENT', 'REELS')}
        >
          <div className="kpi-icon-badge kpi-badge-reels">
            <Play size={20} fill="currentColor" />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Reels</span>
            <span className="kpi-value">{kpiMetricSlot(stats?.totalReels)}</span>
            {renderKpiDelta(reelsDelta, `vs. previous ${stats?.periodDays ?? periodDays} days`)}
          </div>
          <Film size={38} className="kpi-watermark" />
        </button>

        {/* Card 4: Stories */}
        <button
          type="button"
          className="kpi-card kpi-stories"
          onClick={() => switchTab('CONTENT', 'STORIES')}
        >
          <div className="kpi-icon-badge kpi-badge-stories">
            <PlusCircle size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Stories</span>
            <span className="kpi-value">
              {kpiMetricSlot(stats?.totalStories ?? stats?.activeStories)}
            </span>
            {renderKpiDelta(
              storiesDelta,
              <>
                {isStatsLoading ? (
                  <Skeleton className="w-5 h-3.5 inline-block align-middle rounded" />
                ) : (
                  stats?.activeStories ?? 0
                )}{' '}
                live now
              </>
            )}
          </div>
          <PlusCircle size={38} className="kpi-watermark" />
        </button>
      </div>

      {/* ROW 2: Platform Growth + Content Distribution + Moderation Overview */}
      <div className="admin-analytics-grid">
        {/* Platform Growth Card */}
        <section className="adc-card">
          <div className="adc-card-header">
            <div className="adc-card-title-group">
              <div className="adc-title-icon">
                <BarChart3 size={16} />
              </div>
              <div>
                <h2 className="adc-card-title">Platform Growth</h2>
                <p className="adc-card-subtitle">
                  User registrations and content activity over time.
                </p>
              </div>
            </div>

            <div className="chart-mode-pills" role="tablist" aria-label="Growth metric selector">
              {['USERS', 'CONTENT', 'ENGAGEMENT'].map((modeKey) => (
                <button
                  key={modeKey}
                  type="button"
                  className={`chart-mode-btn ${chartMode === modeKey ? 'active' : ''}`}
                  onClick={() => setChartMode(modeKey)}
                >
                  {modeKey === 'USERS'
                    ? 'Users'
                    : modeKey === 'CONTENT'
                      ? 'Content'
                      : 'Engagement'}
                </button>
              ))}
            </div>
          </div>

          {isStatsLoading ? (
            <div className="flex flex-col gap-3 pt-2">
              <Skeleton className="w-full h-[155px] rounded-xl" />
              <div className="flex justify-between px-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="w-7 h-2.5 rounded" />
                ))}
              </div>
            </div>
          ) : (
            <PlatformGrowthChart series={stats?.growthSeries || []} mode={chartMode} />
          )}
        </section>

        {/* Content Distribution Card */}
        <section className="adc-card">
          <div className="adc-card-header">
            <div className="adc-card-title-group">
              <div className="adc-title-icon pink">
                <PieChart size={16} />
              </div>
              <div>
                <h2 className="adc-card-title">Content Distribution</h2>
              </div>
            </div>
          </div>

          {isStatsLoading ? (
            <div className="flex items-center gap-5 px-1 py-4">
              <Skeleton className="w-[108px] h-[108px] rounded-full flex-shrink-0 !bg-transparent border-[16px] border-[var(--bg-hover)]" />
              <div className="flex-1 flex flex-col gap-2.5">
                {[
                  { label: 'Feed Posts', color: '#8b5cf6' },
                  { label: 'Stories', color: '#ec4899' },
                  { label: 'Reels', color: '#f59e0b' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center text-[13px]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </span>
                    <Skeleton className="w-10 h-3.5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ContentDistributionDonut
              posts={stats?.totalPosts ?? 0}
              stories={stats?.totalStories ?? stats?.activeStories ?? 0}
              reels={stats?.totalReels ?? 0}
            />
          )}
        </section>

        {/* Moderation Overview Card */}
        <section className="adc-card">
          <div className="adc-card-header">
            <div className="adc-card-title-group">
              <div className="adc-title-icon amber">
                <ShieldAlert size={16} />
              </div>
              <div>
                <h2 className="adc-card-title">Moderation Overview</h2>
              </div>
            </div>
            {isStatsLoading ? (
              <Skeleton className="w-6 h-6 rounded-full" />
            ) : (
              <span className="mod-total-pill" title="Total Filed Reports">
                {stats?.totalReports ?? 0}
              </span>
            )}
          </div>

          <div className="mod-overview-list">
            <NavLink to="/admin/reports?status=OPEN" className="mod-status-row">
              <span className="mod-status-left">
                <Flag size={15} color="#f87171" />
                <span>Reports (Open)</span>
              </span>
              {isStatsLoading ? (
                <Skeleton className="w-7 h-6 rounded-full" />
              ) : (
                <span className="mod-count-pill red">{stats?.openReports ?? 0}</span>
              )}
            </NavLink>

            <NavLink to="/admin/reports?status=REVIEWED" className="mod-status-row">
              <span className="mod-status-left">
                <Clock size={15} color="#fbbf24" />
                <span>Under Review</span>
              </span>
              {isStatsLoading ? (
                <Skeleton className="w-7 h-6 rounded-full" />
              ) : (
                <span className="mod-count-pill amber">{stats?.reviewedReports ?? 0}</span>
              )}
            </NavLink>

            <NavLink to="/admin/reports?status=RESOLVED" className="mod-status-row">
              <span className="mod-status-left">
                <CheckCircle2 size={15} color="#34d399" />
                <span>Actioned (This Week)</span>
              </span>
              {isStatsLoading ? (
                <Skeleton className="w-7 h-6 rounded-full" />
              ) : (
                <span className="mod-count-pill green">
                  {stats?.actionedThisWeek ?? stats?.resolvedReports ?? 0}
                </span>
              )}
            </NavLink>
          </div>
        </section>
      </div>

      {/* ROW 3: Recent Activity + Engagement + Quick Actions */}
      <div className="admin-bottom-grid">
        {/* Recent User Activity */}
        <section className="adc-card">
          <div className="adc-card-header">
            <div className="adc-card-title-group">
              <div className="adc-title-icon">
                <Activity size={16} />
              </div>
              <div>
                <h2 className="adc-card-title">Recent User Activity</h2>
                <p className="adc-card-subtitle">Live platform activity in real time.</p>
              </div>
            </div>
            <button
              type="button"
              className="view-all-link-btn"
              onClick={handleOpenAllActivity}
            >
              View All
            </button>
          </div>

          {loadingActivity && activities.length === 0 ? (
            <SkeletonUserRows count={4} compact />
          ) : activities.length === 0 ? (
            <div style={{ padding: '28px 12px', textAlign: 'center', fontSize: '13px', color: 'var(--adc-text-muted)' }}>
              No recent platform activity recorded yet.
            </div>
          ) : (
            <div className="activity-feed-list">
              {activities.slice(0, 4).map((act) => (
                <div key={act.id} className="activity-feed-item">
                  <div className="activity-item-left">
                    <Avatar
                      src={act.actor?.avatarUrl}
                      alt={act.actor?.username || 'user'}
                      size="sm"
                    />
                    <div className="activity-item-copy">
                      <span className="activity-item-text">
                        <strong>{act.actor?.username || 'user'}</strong> {act.actionText}
                      </span>
                      <span className="activity-item-time">
                        {act.createdAt ? timeAgo(act.createdAt) : 'Just now'}
                      </span>
                    </div>
                  </div>
                  {renderActivityVisual(act)}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Engagement Metrics */}
        <section className="adc-card">
          <div className="adc-card-header">
            <div className="adc-card-title-group">
              <div className="adc-title-icon pink">
                <Heart size={16} />
              </div>
              <div>
                <h2 className="adc-card-title">Engagement Metrics</h2>
                <p className="adc-card-subtitle">User interaction on your platform.</p>
              </div>
            </div>
          </div>

          <div className="engagement-metrics-list">
            {[
              {
                label: 'Likes',
                icon: <Heart size={16} color="#f43f5e" />,
                value: stats?.totalLikes,
                delta: likesDelta,
              },
              {
                label: 'Comments',
                icon: <MessageSquare size={16} color="#60a5fa" />,
                value: stats?.totalEngagementComments ?? stats?.totalComments,
                delta: commentsDelta,
              },
              {
                label: 'Shares',
                icon: <Share2 size={16} color="#c084fc" />,
                value: stats?.totalShares,
                delta: sharesDelta,
              },
              {
                label: 'Saves',
                icon: <Bookmark size={16} color="#f472b6" />,
                value: stats?.totalSaves,
                delta: savesDelta,
              },
            ].map((metric) => (
              <div key={metric.label} className="engagement-metric-row">
                <span className="engagement-metric-left">
                  {metric.icon}
                  <span>{metric.label}</span>
                </span>
                <div className="engagement-metric-right">
                  {isStatsLoading ? (
                    <>
                      <Skeleton className="w-8 h-4 rounded" />
                      <Skeleton className="w-12 h-4 rounded-full" />
                    </>
                  ) : (
                    <>
                      <span className="engagement-metric-value">
                        {(metric.value ?? 0).toLocaleString()}
                      </span>
                      <span
                        className={`kpi-delta ${metric.delta.direction}`}
                        style={{ fontSize: '11.5px' }}
                      >
                        {metric.delta.label}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="adc-card">
          <div className="adc-card-header">
            <div className="adc-card-title-group">
              <div className="adc-title-icon amber">
                <Zap size={16} />
              </div>
              <div>
                <h2 className="adc-card-title">Quick Actions</h2>
                <p className="adc-card-subtitle">Frequently used admin actions.</p>
              </div>
            </div>
          </div>

          <div className="quick-actions-grid">
            <button
              type="button"
              className="quick-action-tile qa-blue"
              onClick={() => switchTab('USERS')}
            >
              <Users size={19} />
              <span>Manage Users</span>
            </button>

            <NavLink to="/admin/reports" className="quick-action-tile qa-crimson">
              <Flag size={19} />
              <span>Review Reports</span>
            </NavLink>

            <NavLink to="/admin/reports?status=OPEN" className="quick-action-tile qa-amber">
              <Gavel size={19} />
              <span>Take Action</span>
            </NavLink>

            <NavLink to="/admin/email" className="quick-action-tile qa-violet">
              <Mail size={19} />
              <span>Send Email</span>
            </NavLink>

            <NavLink to="/admin/email?tab=templates" className="quick-action-tile qa-emerald">
              <FileText size={19} />
              <span>Create Template</span>
            </NavLink>

            <NavLink to="/admin/configs" className="quick-action-tile qa-sky">
              <Sliders size={19} />
              <span>System Config</span>
            </NavLink>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
