import React, { useState } from 'react';
import { AlertCircle, Upload, CheckCircle2, X } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import adminService from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './ReportProblemModal.css';

const PROBLEM_CATEGORIES = [
  { code: 'BUG', label: "Something isn't working" },
  { code: 'FEEDBACK', label: 'Feedback / General suggestion' },
  { code: 'CRASH', label: 'Unexpected error or crash' },
  { code: 'MEDIA_ISSUE', label: 'Media upload / playback problem' },
  { code: 'OTHER', label: 'Something else' },
];

export const ReportProblemModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [category, setCategory] = useState('BUG');
  const [description, setDescription] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Screenshot must be smaller than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setLoading(true);
      const diagnosticInfo = `[Client: ${navigator.userAgent.slice(0, 120)} | Screen: ${window.innerWidth}x${window.innerHeight} | URL: ${window.location.pathname}]`;
      const fullDescription = `${description.trim()}\n\nDiagnostic: ${diagnosticInfo}`;

      // targetId is reporter's user id or fallback random uuid
      const targetId = user?.id || '00000000-0000-0000-0000-000000000000';

      await adminService.createReport({
        targetType: 'PROBLEM',
        targetId,
        reasonCode: category,
        description: fullDescription,
      });

      setSubmitted(true);
      showSuccess('Problem report submitted. Thank you for your feedback!');
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        setScreenshotPreview(null);
        setCategory('BUG');
        onClose();
      }, 1500);
    } catch (err) {
      showError(err.message || 'Failed to submit problem report.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    if (!loading) {
      setDescription('');
      setScreenshotPreview(null);
      setSubmitted(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Report a problem" size="sm">
      {submitted ? (
        <div className="report-problem-success">
          <CheckCircle2 size={48} className="report-problem-success-icon" />
          <h3>Thank you for letting us know</h3>
          <p>Your feedback helps make Instagram better for everyone.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="report-problem-form">
          <p className="report-problem-subtitle">
            Please briefly describe what happened and what steps we can take to reproduce the issue.
          </p>

          <div className="report-problem-field">
            <label htmlFor="problem-category-select">Category</label>
            <select
              id="problem-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="report-problem-select"
            >
              {PROBLEM_CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="report-problem-field">
            <label htmlFor="problem-description-input">Description</label>
            <textarea
              id="problem-description-input"
              className="report-problem-textarea"
              placeholder="Please include as much detail as possible..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Screenshot Upload */}
          <div className="report-problem-attachment">
            {screenshotPreview ? (
              <div className="report-screenshot-preview">
                <img src={screenshotPreview} alt="Bug screenshot preview" />
                <button
                  type="button"
                  className="remove-screenshot-btn"
                  onClick={removeScreenshot}
                  title="Remove screenshot"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="upload-screenshot-label">
                <Upload size={16} />
                <span>Attach screenshot (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <div className="report-problem-disclaimer">
            <AlertCircle size={14} />
            <span>
              Your browser version, screen dimensions, and username will be automatically included in your report.
            </span>
          </div>

          <div className="report-problem-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleModalClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !description.trim()}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Send report'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReportProblemModal;
