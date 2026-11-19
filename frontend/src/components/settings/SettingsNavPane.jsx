import React from 'react';
import { Search, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';

export const SettingsNavPane = ({
  isUserAdmin = false,
  searchQuery = '',
  setSearchQuery,
  openGroups = new Set(),
  setOpenGroups,
  activeTab = 'profile',
  setActiveTab,
  filteredCategories = [],
  isMobile = false,
  onBackToProfile,
}) => {
  return (
    <nav className={`settings-nav-pane ${isMobile ? 'is-mobile-hub' : ''}`}>
      <div className="settings-nav-header-row">
        {isMobile && onBackToProfile && (
          <button
            type="button"
            className="settings-nav-mobile-back-btn"
            onClick={onBackToProfile}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="settings-nav-title">
          {isMobile ? 'Settings and privacy' : 'Settings'}
        </h2>
      </div>

      {!isUserAdmin && (
        <div className="settings-search-wrapper">
          <Search size={15} className="settings-search-icon" />
          <input
            type="text"
            className="settings-search-input"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
          />
        </div>
      )}

      <div className="settings-nav-groups-container">
        {filteredCategories.map((cat) => {
          const isGroupExpanded =
            Boolean(searchQuery.trim()) || openGroups.has(cat.group);
          return (
            <div key={cat.group} className="settings-nav-group">
              <button
                type="button"
                className={`settings-nav-group-trigger ${
                  isGroupExpanded ? 'open' : ''
                }`}
                aria-expanded={isGroupExpanded}
                onClick={() => {
                  setOpenGroups?.((prev) => {
                    const next = new Set(prev);
                    if (next.has(cat.group)) next.delete(cat.group);
                    else next.add(cat.group);
                    return next;
                  });
                }}
              >
                <span className="settings-nav-group-title">{cat.group}</span>
                <ChevronDown
                  size={14}
                  className="settings-nav-group-chevron"
                  aria-hidden="true"
                />
              </button>
              <div
                className={`settings-nav-group-items ${
                  isGroupExpanded ? 'expanded' : 'collapsed'
                }`}
              >
                {cat.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      tabIndex={isGroupExpanded ? 0 : -1}
                      className={`settings-nav-button ${
                        isSelected ? 'active' : ''
                      }`}
                      onClick={() => {
                        setActiveTab?.(item.id);
                        setOpenGroups?.((prev) => {
                          if (prev.has(cat.group)) return prev;
                          const next = new Set(prev);
                          next.add(cat.group);
                          return next;
                        });
                      }}
                    >
                      <ItemIcon size={17} className="settings-nav-button-icon" />
                      <span className="settings-nav-button-label">{item.label}</span>
                      {isMobile && (
                        <ChevronRight size={16} className="settings-nav-button-arrow" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default SettingsNavPane;
