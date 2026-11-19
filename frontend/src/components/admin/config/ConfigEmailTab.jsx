import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Server,
  Info,
  ExternalLink,
  Send,
  Save,
} from 'lucide-react';

export const ConfigEmailTab = ({
  emailServer,
  setEmailServer,
  testRecipient,
  setTestRecipient,
  handleTestEmailHandshake,
  sendingTest,
  handleSaveEmailServer,
  saving,
}) => {
  return (
    <div>
      <div className="subtab-nav">
        <span className="subtab-btn active">Mail Server (SMTP)</span>
        <NavLink to="/admin/email" className="subtab-btn">
          Category Senders & Identities <ExternalLink size={12} style={{ marginLeft: 4 }} />
        </NavLink>
        <NavLink to="/admin/email" className="subtab-btn">
          HTML Email Templates <ExternalLink size={12} style={{ marginLeft: 4 }} />
        </NavLink>
      </div>

      <div className="config-card">
        <div className="config-card-header">
          <h2 className="config-card-title">
            <Server size={18} color="#0095f6" />
            Mail Server & SMTP Connection
          </h2>
          <span className="config-value-badge">
            {emailServer.simulationMode ? 'Simulation Mode Active' : 'Live SMTP Active'}
          </span>
        </div>

        {emailServer.simulationMode && (
          <div className="alert-banner warning">
            <Info size={18} />
            <span>
              Simulation Mode is enabled: outgoing emails will be safely logged without hitting external SMTP servers.
            </span>
          </div>
        )}

        <div className="config-grid">
          <div className="config-field">
            <label className="config-label">Provider Name</label>
            <input
              type="text"
              className="config-input"
              value={emailServer.providerName || ''}
              onChange={(e) => setEmailServer({ ...emailServer, providerName: e.target.value })}
            />
          </div>

          <div className="config-field">
            <label className="config-label">SMTP Host</label>
            <input
              type="text"
              className="config-input"
              value={emailServer.host || ''}
              onChange={(e) => setEmailServer({ ...emailServer, host: e.target.value })}
            />
          </div>

          <div className="config-field">
            <label className="config-label">Port</label>
            <input
              type="number"
              className="config-input"
              value={emailServer.port || 587}
              onChange={(e) => setEmailServer({ ...emailServer, port: parseInt(e.target.value, 10) || 587 })}
            />
          </div>

          <div className="config-field">
            <label className="config-label">SMTP Username</label>
            <input
              type="text"
              className="config-input"
              placeholder="e.g. apikey or user@domain.com"
              value={emailServer.username || ''}
              onChange={(e) => setEmailServer({ ...emailServer, username: e.target.value })}
            />
          </div>

          <div className="config-field">
            <label className="config-label">
              SMTP Password / API Key
              {emailServer.hasPassword && <span style={{ color: '#00ba7c', fontSize: 11 }}> • Configured</span>}
            </label>
            <input
              type="password"
              className="config-input"
              placeholder={emailServer.hasPassword ? '•••••••• (leave blank to keep unchanged)' : 'Enter SMTP password or API key'}
              value={emailServer.password || ''}
              onChange={(e) => setEmailServer({ ...emailServer, password: e.target.value })}
            />
          </div>

          <div className="config-field">
            <label className="config-label">Rate Limit (Emails / Hour)</label>
            <input
              type="number"
              className="config-input"
              value={emailServer.rateLimitPerHour || 1000}
              onChange={(e) => setEmailServer({ ...emailServer, rateLimitPerHour: parseInt(e.target.value, 10) || 1000 })}
            />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div className="config-toggle-row">
            <div className="config-toggle-info">
              <span className="config-toggle-title">Simulation Mode</span>
              <span className="config-toggle-desc">Log emails locally without sending via network</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={emailServer.simulationMode}
                onChange={(e) => setEmailServer({ ...emailServer, simulationMode: e.target.checked })}
              />
              <span className="slider-toggle"></span>
            </label>
          </div>

          <div className="config-toggle-row">
            <div className="config-toggle-info">
              <span className="config-toggle-title">STARTTLS Enabled</span>
              <span className="config-toggle-desc">Upgrade connection to TLS (Port 587)</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={emailServer.starttlsEnabled}
                onChange={(e) => setEmailServer({ ...emailServer, starttlsEnabled: e.target.checked })}
              />
              <span className="slider-toggle"></span>
            </label>
          </div>

          <div className="config-toggle-row">
            <div className="config-toggle-info">
              <span className="config-toggle-title">SSL / SMTPS</span>
              <span className="config-toggle-desc">Implicit SSL encryption (Port 465)</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={emailServer.sslEnabled}
                onChange={(e) => setEmailServer({ ...emailServer, sslEnabled: e.target.checked })}
              />
              <span className="slider-toggle"></span>
            </label>
          </div>
        </div>

        {/* Live Test Handshake */}
        <div style={{ marginTop: 24, padding: 18, background: '#121212', borderRadius: 10, border: '1px solid #262626' }}>
          <label className="config-label" style={{ marginBottom: 8 }}>Test SMTP Connection Live</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="email"
              className="config-input"
              style={{ flex: 1 }}
              placeholder="Recipient email address"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
            />
            <button
              className="btn-secondary"
              onClick={handleTestEmailHandshake}
              disabled={sendingTest}
            >
              <Send size={15} />
              {sendingTest ? 'Sending...' : 'Send Test Handshake'}
            </button>
          </div>
        </div>

        <div className="config-actions-bar">
          <span style={{ fontSize: 13, color: '#8e8e8e' }}>Changes take effect instantly without restarting Spring Boot.</span>
          <button className="btn-primary" onClick={handleSaveEmailServer} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Mail Server Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigEmailTab;
