import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  Trash2,
  UserX,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { SkeletonAdminReportsList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import adminService from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils';
import './AdminReportsPage.css';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

const TARGET_TYPE_FILTERS = [
  { value: 'ALL', label: 'All Content Types' },
  { value: 'POST', label: 'Posts' },
  { value: 'REEL', label: 'Reels' },
  { value: 'COMMENT', label: 'Comments' },
  { value: 'STORY', label: 'Stories' },
  { value: 'MESSAGE', label: 'Messages' },
  { value: 'USER', label: 'User Accounts' },
];

const VALID_STATUSES = STATUS_FILTERS.map((f) => f.value);
const VALID_TARGET_TYPES = TARGET_TYPE_FILTERS.map((f) => f.value);

export const AdminReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = (searchParams.get('status') || 'ALL').toUpperCase();
  const filterStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'ALL';

  const rawTargetType = (searchParams.get('targetType') || 'ALL').toUpperCase();
  const filterTargetType = VALID_TARGET_TYPES.includes(rawTargetType) ? rawTargetType : 'ALL';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Resolution modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [moderationAction, setModerationAction] = useState('NO_ACTION');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const { showSuccess, showError } = useToast();

  const updateFilterParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam = filterStatus === 'ALL' ? null : filterStatus;
      const targetParam = filterTargetType === 'ALL' ? null : filterTargetType;
      const res = await adminService.getReports(statusParam, targetParam, 0, 50);
      const list = res?.data?.content || res?.content || res?.data || [];
      setReports(Array.isArray(list) ? list : []);
    } catch (err) {
      showError(err.message || 'Failed to fetch moderation reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTargetType, showError]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const openResolveModal = (report, defaultAction = 'NO_ACTION', defaultStatus = 'RESOLVED') => {
    setSelectedReport(report);
    setModerationAction(defaultAction);
    setResolutionStatus(defaultStatus);
    setResolutionNotes('');
  };

  const closeResolveModal = () => {
    setSelectedReport(null);
    setSubmittingResolution(false);
  };

  const notifySidebarStatsChanged = () => {
    window.dispatchEvent(new CustomEvent('admin:stats-updated'));
  };

  const submitResolution = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setSubmittingResolution(true);
      await adminService.resolveReport(selectedReport.id, {
        status: resolutionStatus,
        action: moderationAction,
        resolutionNotes: resolutionNotes.trim() || 'Processed by admin moderation panel',
      });
      showSuccess(`Report resolved with action: ${moderationAction}`);
      closeResolveModal();
      notifySidebarStatsChanged();
      loadReports();
    } catch (err) {
      showError(err.message || 'Failed to resolve report');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleQuickDismiss = async (reportId) => {
    try {
      setProcessingId(reportId);
      await adminService.resolveReport(reportId, {
        status: 'DISMISSED',
        action: 'NO_ACTION',
        resolutionNotes: 'Dismissed: No violation detected',
      });
      showSuccess('Report dismissed');
      notifySidebarStatsChanged();
      loadReports();
    } catch (err) {
      showError(err.message || 'Failed to dismiss report');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-reports-container">
      <div className="admin-reports-inner">
        {/* Header & Filter Controls */}
        <header className="admin-header-row">
          <div className="admin-title-block">
            <div className="admin-title-icon">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="admin-title">Content Moderation Queue</h1>
              <p className="admin-subtitle">
                Review reported items, inspect context, and take moderation action.
              </p>
            </div>
          </div>

          <div className="reports-toolbar">
            <div className="reports-filter-pills" role="group" aria-label="Filter reports by status">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`filter-pill ${filterStatus === value ? 'active' : ''}`}
                  aria-pressed={filterStatus === value}
                  onClick={() => updateFilterParam('status', value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="reports-toolbar-right">
              <select
                className="filter-select"
                aria-label="Filter reports by content type"
                value={filterTargetType}
                onChange={(e) => updateFilterParam('targetType', e.target.value)}
              >
                {TARGET_TYPE_FILTERS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="reports-refresh-btn"
                onClick={loadReports}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                <span>Refresh Queue</span>
              </button>
            </div>
          </div>
        </header>

        {/* Queue Content */}
        {loading ? (
          <SkeletonAdminReportsList count={4} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No Reports in Queue"
            description={`There are currently no ${filterStatus !== 'ALL' ? filterStatus.toLowerCase() : ''} reports matching the selected filters.`}
          />
        ) : (
          <div className="reports-list-table">
            {reports.map((report) => {
              const reportUuid = report.id || report.targetId;
              const showSeparateTargetId = report.targetId && report.id && report.targetId !== report.id;
              const hasResolutionInfo = Boolean(
                report.resolutionNotes || report.action || report.reviewer || report.resolvedAt
              );
              const isActionable = report.status === 'OPEN' || report.status === 'REVIEWED';

              return (
                <article key={reportUuid} className="report-card-item">
                  {/* Card Header */}
                  <div className="report-card-header">
                    <div className="report-card-meta-left">
                      <span className={`report-badge ${report.status}`}>{report.status}</span>
                      <span className="report-type-badge">{report.targetType}</span>
                      <span className="report-uuid-chip" title={`Report UUID: ${reportUuid}`}>
                        ID: {reportUuid}
                      </span>
                      {showSeparateTargetId && (
                        <span className="report-target-chip" title={`Target ID: ${report.targetId}`}>
                          Target: {report.targetId}
                        </span>
                      )}
                    </div>

                    <span
                      className="report-time-chip"
                      title={report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}
                    >
                      <Clock size={12} aria-hidden="true" />
                      <span>{timeAgo(report.createdAt)}</span>
                    </span>
                  </div>

                  {/* Balanced Details Grid */}
                  <div className="report-details-grid">
                    <div className="report-detail-cell">
                      <span className="report-detail-label">Violation Reason</span>
                      <div className="report-detail-value reason">{report.reasonCode}</div>
                    </div>
                    <div className="report-detail-cell">
                      <span className="report-detail-label">Reported By</span>
                      <div className="report-detail-value">
                        {report.reporter?.username ? `@${report.reporter.username}` : 'Platform User'}
                      </div>
                    </div>
                  </div>

                  {/* Full-width Reporter Notes */}
                  <div className="report-desc-box">
                    <span className="report-note-label">Reporter Notes:</span>{' '}
                    <span className="report-note-text">
                      {report.description || 'No additional reporter notes provided.'}
                    </span>
                  </div>

                  {/* Resolution Info (when available) */}
                  {hasResolutionInfo && (
                    <div className="report-resolution-box">
                      <div className="report-resolution-main">
                        <span className="report-resolution-label">Resolution:</span>{' '}
                        <span className="report-resolution-text">
                          {report.resolutionNotes || 'Processed by admin moderation panel'}
                        </span>
                      </div>
                      {(report.action || report.reviewer?.username || report.resolvedAt) && (
                        <div className="report-resolution-meta">
                          {report.action && (
                            <span className="report-resolution-pill">Action: {report.action}</span>
                          )}
                          {report.reviewer?.username && (
                            <span className="report-resolution-pill">
                              Reviewer: @{report.reviewer.username}
                            </span>
                          )}
                          {report.resolvedAt && (
                            <span className="report-resolution-pill">
                              Resolved {timeAgo(report.resolvedAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evenly Distributed Action Buttons */}
                  {isActionable && (
                    <div className="report-action-buttons">
                      <button
                        type="button"
                        className="report-action-btn action-dismiss"
                        onClick={() => handleQuickDismiss(report.id)}
                        disabled={processingId === report.id}
                      >
                        <X size={15} />
                        <span>Dismiss</span>
                      </button>

                      <button
                        type="button"
                        className="report-action-btn action-warn"
                        onClick={() => openResolveModal(report, 'WARN_USER', 'RESOLVED')}
                        disabled={processingId === report.id}
                      >
                        <AlertTriangle size={15} />
                        <span>Warn User</span>
                      </button>

                      <button
                        type="button"
                        className="report-action-btn action-takedown"
                        onClick={() => openResolveModal(report, 'REMOVE_CONTENT', 'RESOLVED')}
                        disabled={processingId === report.id}
                      >
                        <Trash2 size={15} />
                        <span>Takedown Content</span>
                      </button>

                      <button
                        type="button"
                        className="report-action-btn action-suspend"
                        onClick={() => openResolveModal(report, 'SUSPEND_USER', 'RESOLVED')}
                        disabled={processingId === report.id}
                      >
                        <UserX size={15} />
                        <span>Suspend Author</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution & Takedown Action Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={closeResolveModal}
          title={`Resolve Report (${selectedReport.targetType})`}
          size="md"
        >
          <form onSubmit={submitResolution} className="resolve-report-form">
            <div className="resolve-form-field">
              <label className="editor-label" htmlFor="resolve-status-select">
                Resolution Status
              </label>
              <select
                id="resolve-status-select"
                className="input"
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
              >
                <option value="RESOLVED">RESOLVED (Action Enforced)</option>
                <option value="DISMISSED">DISMISSED (No Penalty)</option>
                <option value="REVIEWED">REVIEWED (Under Review)</option>
              </select>
            </div>

            <div className="resolve-form-field">
              <label className="editor-label" htmlFor="resolve-action-select">
                Enforcement Action
              </label>
              <select
                id="resolve-action-select"
                className="input"
                value={moderationAction}
                onChange={(e) => setModerationAction(e.target.value)}
              >
                <option value="NO_ACTION">NO_ACTION (No penalty)</option>
                <option value="REMOVE_CONTENT">REMOVE_CONTENT (Takedown & delete offending item)</option>
                <option value="SUSPEND_USER">SUSPEND_USER (Suspend author's account)</option>
                <option value="WARN_USER">WARN_USER (Send warning alert to user)</option>
              </select>
            </div>

            <div className="resolve-form-field">
              <label className="editor-label" htmlFor="resolve-notes-input">
                Resolution Notes & Audit Log
              </label>
              <textarea
                id="resolve-notes-input"
                rows={3}
                className="input"
                placeholder="Explain the moderation decision..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                maxLength={500}
                required
              />
            </div>

            <div className="resolve-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeResolveModal}
                disabled={submittingResolution}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingResolution}
              >
                {submittingResolution ? 'Submitting...' : 'Confirm Resolution'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminReportsPage;
