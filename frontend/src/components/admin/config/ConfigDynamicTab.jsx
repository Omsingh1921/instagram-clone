import React from 'react';
import {
  Sliders,
  Search,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';

export const ConfigDynamicTab = ({
  loading,
  configSearch,
  setConfigSearch,
  selectedCategory,
  setSelectedCategory,
  dynamicConfigs = [],
  editedValues = {},
  handleConfigValueChange,
  toggleSecretReveal,
  revealedSecrets = {},
  savingKey,
  resettingKey,
  handleSaveSingleConfig,
  handleResetSingleConfig,
}) => {
  return (
    <div>
      {/* Toolbar: Search + Category Filters */}
      <div className="dynamic-config-toolbar">
        <div className="dynamic-config-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="dynamic-config-search-input"
            placeholder="Search settings by key name or description..."
            value={configSearch}
            onChange={(e) => setConfigSearch(e.target.value)}
          />
          {configSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setConfigSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="dynamic-category-pills">
          {['ALL', 'GENERAL', 'AUTH', 'USER', 'SECURITY', 'NOTIFICATIONS'].map((cat) => {
            const count =
              cat === 'ALL'
                ? dynamicConfigs.length
                : dynamicConfigs.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className={`dynamic-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Cards List */}
      <div className="dynamic-settings-list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="dynamic-setting-card">
              <div className="flex justify-between items-center mb-2.5">
                <Skeleton className="w-56 h-4 rounded" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="w-3/4 h-3 mb-3 rounded" />
              <div className="flex gap-2.5 items-center">
                <Skeleton className="w-full h-9 rounded-lg" />
                <Skeleton className="w-20 h-9 rounded-lg flex-shrink-0" />
              </div>
            </div>
          ))
        ) : (
          dynamicConfigs
            .filter((cfg) => {
              const matchesCat = selectedCategory === 'ALL' || cfg.category === selectedCategory;
              const matchesSearch =
                !configSearch.trim() ||
                cfg.key.toLowerCase().includes(configSearch.toLowerCase()) ||
                (cfg.description && cfg.description.toLowerCase().includes(configSearch.toLowerCase()));
              return matchesCat && matchesSearch;
            })
            .map((cfg) => {
              const currentValue = editedValues[cfg.key] !== undefined ? editedValues[cfg.key] : cfg.value;
              const isDirty = currentValue !== cfg.value;
              const isSecret = cfg.isSecret;
              const isRevealed = revealedSecrets[cfg.key];
              const isSaving = savingKey === cfg.key;
              const isResetting = resettingKey === cfg.key;
              const isDefault = currentValue === cfg.defaultValue;

              return (
                <div key={cfg.key} className={`dynamic-setting-card ${isDirty ? 'dirty' : ''}`}>
                  <div className="dynamic-setting-header">
                    <div className="dynamic-setting-title-row">
                      <span className="dynamic-setting-key">
                        <KeyRound size={14} color="#0095f6" />
                        <code>{cfg.key}</code>
                      </span>
                      <div className="dynamic-setting-badges">
                        <span className={`badge-category category-${cfg.category?.toLowerCase() || 'general'}`}>
                          {cfg.category || 'GENERAL'}
                        </span>
                        {cfg.isPublic && <span className="badge-pill badge-public">Public API</span>}
                        {cfg.isSecret && <span className="badge-pill badge-secret">Protected Secret</span>}
                        {isDirty && <span className="badge-pill badge-modified">Unsaved</span>}
                      </div>
                    </div>
                    {cfg.description && (
                      <p className="dynamic-setting-description">{cfg.description}</p>
                    )}
                  </div>

                  <div className="dynamic-setting-controls">
                    <div className="dynamic-setting-input-wrapper">
                      <input
                        type={isSecret && !isRevealed ? 'password' : 'text'}
                        className={`dynamic-setting-input ${isDirty ? 'input-modified' : ''}`}
                        value={currentValue}
                        onChange={(e) => handleConfigValueChange(cfg.key, e.target.value)}
                        placeholder={`Default: ${cfg.defaultValue}`}
                      />
                      {isSecret && (
                        <button
                          type="button"
                          className="btn-reveal-secret"
                          onClick={() => toggleSecretReveal(cfg.key)}
                          title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                        >
                          {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>

                    <div className="dynamic-setting-actions">
                      <button
                        type="button"
                        className="btn-save-setting"
                        onClick={() => handleSaveSingleConfig(cfg)}
                        disabled={!isDirty || isSaving}
                        title="Persist update to database & Redis cache"
                      >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn-reset-setting"
                        onClick={() => handleResetSingleConfig(cfg)}
                        disabled={isDefault || isResetting}
                        title={`Reset to factory default (${cfg.defaultValue})`}
                      >
                        <RotateCcw size={14} />
                        {isResetting ? 'Resetting...' : 'Reset'}
                      </button>
                    </div>
                  </div>

                  <div className="dynamic-setting-footer">
                    <span className="default-val-hint">
                      Factory Default: <strong>{cfg.defaultValue}</strong>
                    </span>
                    {cfg.updatedAt && (
                      <span className="updated-meta">
                        Last Updated: {new Date(cfg.updatedAt).toLocaleString()} {cfg.updatedBy ? `by ${cfg.updatedBy}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default ConfigDynamicTab;
