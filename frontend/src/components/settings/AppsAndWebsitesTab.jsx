import React from 'react';

export const AppsAndWebsitesTab = ({
  appsSubTab = 'active',
  setAppsSubTab,
}) => {
  return (
    <div className="settings-apps-websites-pane">
      <h2 className="settings-section-title">Apps and websites</h2>

      <div className="apps-subtabs-bar">
        <button
          type="button"
          className={`apps-subtab-btn ${appsSubTab === 'active' ? 'active' : ''}`}
          onClick={() => setAppsSubTab?.('active')}
        >
          Active
        </button>
        <button
          type="button"
          className={`apps-subtab-btn ${appsSubTab === 'expired' ? 'active' : ''}`}
          onClick={() => setAppsSubTab?.('expired')}
        >
          Expired
        </button>
        <button
          type="button"
          className={`apps-subtab-btn ${appsSubTab === 'removed' ? 'active' : ''}`}
          onClick={() => setAppsSubTab?.('removed')}
        >
          Removed
        </button>
      </div>

      <p className="apps-explanation-text">
        These are apps and websites that you've connected to your Instagram profile. They can access non-public information that you choose to share with them.
      </p>

      <div className="apps-empty-state">
        <p className="apps-empty-text">
          {appsSubTab === 'active'
            ? 'You have not authorised any applications to access your Instagram profile.'
            : appsSubTab === 'expired'
            ? 'These are apps and websites that you connected to your Instagram profile that you may not have used in the last 90 days.'
            : 'These are apps and websites that are no longer connected to your Instagram profile.'}
        </p>
      </div>
    </div>
  );
};

export default AppsAndWebsitesTab;
