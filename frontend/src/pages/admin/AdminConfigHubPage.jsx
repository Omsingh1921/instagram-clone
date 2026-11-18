import React, { useState, useEffect } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Trash2,
  Film,
  Flag,
  ShieldCheck,
  Save,
  RotateCcw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Server,
  Layers,
  Lock,
  ExternalLink,
  Info,
  Sliders,
  Search,
  Eye,
  EyeOff,
  Check,
  Globe,
  KeyRound,
  UserCheck,
  Bell,
  Sparkles,
  X,
  Share2,
  Bookmark,
  MessageCircle,
  Heart,
  Clock,
  Compass,
  TrendingUp,
  Users,
} from 'lucide-react';
import adminConfigService from '../../services/adminConfig.service';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';
import './AdminConfigHubPage.css';

export const AdminConfigHubPage = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const validTabs = ['DYNAMIC_CONFIG', 'FEED_ALGORITHM', 'EMAIL', 'DELETION', 'MEDIA', 'FEATURES', 'MODERATION'];
  const [activeTab, setActiveTab] = useState(
    queryTab && validTabs.includes(queryTab.toUpperCase()) ? queryTab.toUpperCase() : 'DYNAMIC_CONFIG'
  );

  useEffect(() => {
    if (queryTab && validTabs.includes(queryTab.toUpperCase())) {
      setActiveTab(queryTab.toUpperCase());
    }
  }, [queryTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Dynamic System Settings State
  const [dynamicConfigs, setDynamicConfigs] = useState([]);
  const [configSearch, setConfigSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editedValues, setEditedValues] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [resettingKey, setResettingKey] = useState(null);
  const [revealedSecrets, setRevealedSecrets] = useState({});

  // Feed Algorithm State
  const [feedConfig, setFeedConfig] = useState({
    weightShare: 4.0,
    weightSave: 3.0,
    weightComment: 2.5,
    weightLike: 1.0,
    authorAffinityWeight: 25.0,
    topicAffinityWeight: 20.0,
    followingBonus: 15.0,
    recencyGravityDecay: 0.8,
    antiClusteringWindow: 4,
    postsPerReel: 3,
    seenPostPenaltyMultiplier: 0.25,
    suggestedCreatorsInterval: 7,
    allCaughtUpHoursThreshold: 72,
    isActive: true,
  });

  // Domain states
  const [emailServer, setEmailServer] = useState({
    providerName: 'SMTP',
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    hasPassword: false,
    authEnabled: true,
    starttlsEnabled: true,
    sslEnabled: false,
    connectionTimeoutMs: 10000,
    simulationMode: true,
    rateLimitPerHour: 1000,
  });
  const [testRecipient, setTestRecipient] = useState('admin@instagramclone.com');
  const [sendingTest, setSendingTest] = useState(false);

  const [deletion, setDeletion] = useState({
    trashRetentionDays: 30,
    pseudoPermanentEnabled: true,
    mediaPurgeDelayDays: 30,
    legalHoldEnabled: false,
    adminTakedownPreserveDays: 365,
    accountGraceDays: 30,
    cronBatchSize: 500,
  });

  const [media, setMedia] = useState({
    maxReelBytes: 262144000,
    maxPostBytes: 104857600,
    maxReelDurationSec: 90,
    maxStoryDurationSec: 60,
    allowedMimeTypes: 'video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp',
  });

  const [features, setFeatures] = useState({
    reelsUploadEnabled: true,
    storyCreationEnabled: true,
    voiceMessagesEnabled: true,
    maintenanceModeEnabled: false,
    maintenanceMessage: 'Instagram is currently undergoing scheduled maintenance. Please check back shortly.',
  });

  const [moderation, setModeration] = useState({
    autoQuarantineReportThreshold: 5,
    profanityBannedWords: 'spam,scam,fraud,hate,abuse,harassment,malware',
    nsfwBlurThreshold: 0.85,
    copyrightStrikeLimit: 3,
  });

  useEffect(() => {
    fetchAllConfigs();
  }, []);

  const fetchAllConfigs = async () => {
    setLoading(true);
    try {
      const [emailRes, delRes, mediaRes, featRes, modRes, dynRes, feedRes] = await Promise.all([
        adminConfigService.getEmailServerConfig ? adminConfigService.getEmailServerConfig() : Promise.resolve({ data: null }),
        adminConfigService.getDeletionConfig ? adminConfigService.getDeletionConfig() : Promise.resolve({ data: null }),
        adminConfigService.getMediaConfig ? adminConfigService.getMediaConfig() : Promise.resolve({ data: null }),
        adminConfigService.getFeatureFlagConfig ? adminConfigService.getFeatureFlagConfig() : Promise.resolve({ data: null }),
        adminConfigService.getModerationConfig ? adminConfigService.getModerationConfig() : Promise.resolve({ data: null }),
        adminConfigService.getDynamicConfigs ? adminConfigService.getDynamicConfigs() : Promise.resolve({ data: [] }),
        adminConfigService.getFeedConfig ? adminConfigService.getFeedConfig() : Promise.resolve({ data: null }),
      ]);

      if (emailRes?.data) setEmailServer(emailRes.data);
      if (delRes?.data) setDeletion(delRes.data);
      if (mediaRes?.data) setMedia(mediaRes.data);
      if (featRes?.data) setFeatures(featRes.data);
      if (modRes?.data) setModeration(modRes.data);
      if (feedRes?.data) setFeedConfig(feedRes.data);
      if (dynRes?.data) {
        const list = Array.isArray(dynRes.data) ? dynRes.data : dynRes.data?.content || [];
        setDynamicConfigs(list);
        const initialMap = {};
        list.forEach((c) => {
          initialMap[c.key] = c.value;
        });
        setEditedValues(initialMap);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load system configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigValueChange = (key, val) => {
    setEditedValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSingleConfig = async (config) => {
    const key = config.key;
    const value = editedValues[key];
    setSavingKey(key);
    try {
      const res = await adminConfigService.updateDynamicConfig(key, value);
      const updatedVal = res?.data?.value !== undefined ? res.data.value : value;
      showToast(`Setting "${key}" updated successfully`, 'success');
      setDynamicConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, ...(res?.data || {}), value: updatedVal } : c))
      );
      setEditedValues((prev) => ({ ...prev, [key]: updatedVal }));
    } catch (err) {
      showToast(err.message || `Failed to update ${key}`, 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetSingleConfig = async (config) => {
    const key = config.key;
    if (!window.confirm(`Reset "${key}" back to factory default "${config.defaultValue}"?`)) return;
    setResettingKey(key);
    try {
      const res = await adminConfigService.resetDynamicConfig(key);
      const defVal = res?.data?.value !== undefined ? res.data.value : config.defaultValue;
      showToast(`Setting "${key}" reset to factory default`, 'success');
      setEditedValues((prev) => ({ ...prev, [key]: defVal }));
      setDynamicConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, ...(res?.data || {}), value: defVal } : c))
      );
    } catch (err) {
      showToast(err.message || `Failed to reset ${key}`, 'error');
    } finally {
      setResettingKey(null);
    }
  };

  const toggleSecretReveal = (key) => {
    setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Save Handlers per domain
  const handleSaveEmailServer = async () => {
    setSaving(true);
    try {
      const res = await adminConfigService.updateEmailServerConfig(emailServer);
      if (res?.data) setEmailServer(res.data);
      showToast('Mail Server & SMTP settings saved successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update email server settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmailHandshake = async () => {
    if (!testRecipient) {
      showToast('Please enter a recipient email address', 'error');
      return;
    }
    setSendingTest(true);
    try {
      await adminConfigService.testEmailServer(testRecipient);
      showToast(`Test email dispatched successfully to ${testRecipient}`, 'success');
    } catch (err) {
      showToast(err.message || 'SMTP handshake test failed', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveDeletion = async () => {
    setSaving(true);
    try {
      const res = await adminConfigService.updateDeletionConfig(deletion);
      if (res?.data) setDeletion(res.data);
      showToast('Deletion & Data Lifecycle configuration updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update deletion config', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMedia = async () => {
    setSaving(true);
    try {
      const res = await adminConfigService.updateMediaConfig(media);
      if (res?.data) setMedia(res.data);
      showToast('Media & Upload Limits updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update media config', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    try {
      const res = await adminConfigService.updateFeatureFlagConfig(features);
      if (res?.data) setFeatures(res.data);
      showToast('Feature Flags & Platform Controls updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update feature flags', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModeration = async () => {
    setSaving(true);
    try {
      const res = await adminConfigService.updateModerationConfig(moderation);
      if (res?.data) setModeration(res.data);
      showToast('Moderation & Safety Rules updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update moderation config', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeedConfig = async () => {
    setSaving(true);
    try {
      const payload = {
        weightShare: Number(feedConfig.weightShare),
        weightSave: Number(feedConfig.weightSave),
        weightComment: Number(feedConfig.weightComment),
        weightLike: Number(feedConfig.weightLike),
        authorAffinityWeight: Number(feedConfig.authorAffinityWeight),
        topicAffinityWeight: Number(feedConfig.topicAffinityWeight),
        followingBonus: Number(feedConfig.followingBonus),
        recencyGravityDecay: Number(feedConfig.recencyGravityDecay),
        antiClusteringWindow: parseInt(feedConfig.antiClusteringWindow, 10),
        postsPerReel: parseInt(feedConfig.postsPerReel, 10),
        seenPostPenaltyMultiplier: Number(feedConfig.seenPostPenaltyMultiplier),
        suggestedCreatorsInterval: parseInt(feedConfig.suggestedCreatorsInterval, 10),
        allCaughtUpHoursThreshold: parseInt(feedConfig.allCaughtUpHoursThreshold, 10),
      };
      const res = await adminConfigService.updateFeedConfig(payload);
      if (res?.data) setFeedConfig(res.data);
      showToast('Feed ranking algorithm configuration updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update feed algorithm config', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset Handlers
  const handleResetCurrentDomain = async () => {
    if (!window.confirm(`Reset ${activeTab} configurations to factory defaults?`)) return;
    setResetting(true);
    try {
      if (activeTab === 'DYNAMIC_CONFIG') {
        const res = await adminConfigService.resetAllDynamicConfigs();
        const list = Array.isArray(res?.data) ? res.data : res?.data?.content || [];
        setDynamicConfigs(list);
        const resetMap = {};
        list.forEach((c) => {
          resetMap[c.key] = c.value;
        });
        setEditedValues(resetMap);
      } else if (activeTab === 'EMAIL') {
        const res = await adminConfigService.resetEmailServerConfig();
        if (res?.data) setEmailServer(res.data);
      } else if (activeTab === 'DELETION') {
        const res = await adminConfigService.resetDeletionConfig();
        if (res?.data) setDeletion(res.data);
      } else if (activeTab === 'MEDIA') {
        const res = await adminConfigService.resetMediaConfig();
        if (res?.data) setMedia(res.data);
      } else if (activeTab === 'FEATURES') {
        const res = await adminConfigService.resetFeatureFlagConfig();
        if (res?.data) setFeatures(res.data);
      } else if (activeTab === 'MODERATION') {
        const res = await adminConfigService.resetModerationConfig();
        if (res?.data) setModeration(res.data);
      } else if (activeTab === 'FEED_ALGORITHM') {
        const res = await adminConfigService.resetFeedConfig();
        if (res?.data) setFeedConfig(res.data);
      }
      showToast(`${activeTab} configuration reverted to factory defaults`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reset configuration', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="admin-config-container">
      {/* Page Header (always visible, static) */}
      <div className="admin-config-header">
        <div>
          <h1 className="admin-config-title">
            <Layers size={26} color="#0095f6" />
            Dynamic System Configurations
          </h1>
          <p className="admin-config-subtitle">
            Configure live operational parameters, pseudo-permanent lifecycle retention, media upload limits, safety rules, and mail servers with zero service downtime.
          </p>
        </div>
        <button
          className="btn-danger-outline"
          onClick={handleResetCurrentDomain}
          disabled={resetting}
        >
          <RotateCcw size={16} />
          Reset Tab to Default
        </button>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="admin-config-tabs">
        <button
          className={`admin-config-tab-btn ${activeTab === 'DYNAMIC_CONFIG' ? 'active' : ''}`}
          onClick={() => handleTabChange('DYNAMIC_CONFIG')}
        >
          <Sliders size={16} />
          Dynamic Settings
        </button>
        <button
          className={`admin-config-tab-btn ${activeTab === 'FEED_ALGORITHM' ? 'active' : ''}`}
          onClick={() => handleTabChange('FEED_ALGORITHM')}
        >
          <Sparkles size={16} />
          Feed Algorithm & Ranking
        </button>
        <button
          className={`admin-config-tab-btn ${activeTab === 'EMAIL' ? 'active' : ''}`}
          onClick={() => handleTabChange('EMAIL')}
        >
          <Mail size={16} />
          Email & Delivery
        </button>
        <button
          className={`admin-config-tab-btn ${activeTab === 'DELETION' ? 'active' : ''}`}
          onClick={() => handleTabChange('DELETION')}
        >
          <Trash2 size={16} />
          Deletion & Retention
        </button>
        <button
          className={`admin-config-tab-btn ${activeTab === 'MEDIA' ? 'active' : ''}`}
          onClick={() => handleTabChange('MEDIA')}
        >
          <Film size={16} />
          Media & Storage
        </button>
        <button
          className={`admin-config-tab-btn ${activeTab === 'FEATURES' ? 'active' : ''}`}
          onClick={() => handleTabChange('FEATURES')}
        >
          <Flag size={16} />
          Feature Flags & Maintenance
        </button>
        <button
          className={`admin-config-tab-btn ${activeTab === 'MODERATION' ? 'active' : ''}`}
          onClick={() => handleTabChange('MODERATION')}
        >
          <ShieldCheck size={16} />
          Moderation & Safety
        </button>
      </div>

      {/* ==================== 0. DYNAMIC SYSTEM SETTINGS ==================== */}
      {activeTab === 'DYNAMIC_CONFIG' && (
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
      )}

      {loading && activeTab !== 'DYNAMIC_CONFIG' && (
        <div className="config-card flex flex-col gap-4">
          <Skeleton className="w-60 h-5 rounded" />
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="w-28 h-3 rounded" />
                <Skeleton className="w-full h-[38px] rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
      {/* ==================== FEED ALGORITHM & RANKING DOMAIN ==================== */}
      {activeTab === 'FEED_ALGORITHM' && (
        <div className="config-card">
          <div className="config-card-header">
            <h2 className="config-card-title">
              <Sparkles size={18} color="#9333ea" />
              Feed Ranking Algorithm & Pacing Controls
            </h2>
            <span className="config-value-badge feed-active-badge">
              {feedConfig.isActive !== false ? 'Live Algorithm Active' : 'Fallback Ranking'}
            </span>
          </div>

          <p className="feed-config-intro-text">
            Tune user home feed scoring formulas in real-time. Adjust the relative influence of shares, saves, comments, and likes, calibrate recency time-decay gravity, creator affinity bonuses, and reel injection cadence without server restarts.
          </p>

          {/* Group 1: Engagement Signal Weights */}
          <div className="feed-config-section">
            <h3 className="feed-config-section-title">
              <TrendingUp size={16} />
              1. Engagement Signal Scoring Weights (0.0 – 20.0)
            </h3>
            <div className="config-grid">
              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Share2 size={13} /> Share Weight</span>
                  <span className="config-value-badge weight-badge">{Number(feedConfig.weightShare || 0).toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="20.0"
                  step="0.1"
                  className="config-slider feed-slider-share"
                  value={feedConfig.weightShare ?? 4.0}
                  onChange={(e) => setFeedConfig({ ...feedConfig, weightShare: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Multiplier awarded when posts are forwarded or shared in Direct DMs.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Bookmark size={13} /> Save / Bookmark Weight</span>
                  <span className="config-value-badge weight-badge">{Number(feedConfig.weightSave || 0).toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="20.0"
                  step="0.1"
                  className="config-slider feed-slider-save"
                  value={feedConfig.weightSave ?? 3.0}
                  onChange={(e) => setFeedConfig({ ...feedConfig, weightSave: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">High-intent signal when users save posts to collections.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><MessageCircle size={13} /> Comment Weight</span>
                  <span className="config-value-badge weight-badge">{Number(feedConfig.weightComment || 0).toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="20.0"
                  step="0.1"
                  className="config-slider feed-slider-comment"
                  value={feedConfig.weightComment ?? 2.5}
                  onChange={(e) => setFeedConfig({ ...feedConfig, weightComment: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Conversational signal for meaningful discussion and replies.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Heart size={13} /> Like Weight</span>
                  <span className="config-value-badge weight-badge">{Number(feedConfig.weightLike || 0).toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="20.0"
                  step="0.1"
                  className="config-slider feed-slider-like"
                  value={feedConfig.weightLike ?? 1.0}
                  onChange={(e) => setFeedConfig({ ...feedConfig, weightLike: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Baseline lightweight appreciation signal.</span>
              </div>
            </div>
          </div>

          {/* Group 2: Relevance & Affinity */}
          <div className="feed-config-section">
            <h3 className="feed-config-section-title">
              <Compass size={16} />
              2. Relevance & Affinity Multipliers
            </h3>
            <div className="config-grid">
              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><UserCheck size={13} /> Author Affinity Weight</span>
                  <span className="config-value-badge affinity-badge">{Number(feedConfig.authorAffinityWeight || 0).toFixed(1)} pts</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="100.0"
                  step="1.0"
                  className="config-slider"
                  value={feedConfig.authorAffinityWeight ?? 25.0}
                  onChange={(e) => setFeedConfig({ ...feedConfig, authorAffinityWeight: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Boost based on how frequently the viewer interacts with this creator.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Layers size={13} /> Topic / Category Affinity</span>
                  <span className="config-value-badge affinity-badge">{Number(feedConfig.topicAffinityWeight || 0).toFixed(1)} pts</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="100.0"
                  step="1.0"
                  className="config-slider"
                  value={feedConfig.topicAffinityWeight ?? 20.0}
                  onChange={(e) => setFeedConfig({ ...feedConfig, topicAffinityWeight: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Matching hashtag and niche category interests.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Check size={13} /> Following Creator Bonus</span>
                  <span className="config-value-badge affinity-badge">+{Number(feedConfig.followingBonus || 0).toFixed(1)} pts</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="50.0"
                  step="1.0"
                  className="config-slider"
                  value={feedConfig.followingBonus ?? 15.0}
                  onChange={(e) => setFeedConfig({ ...feedConfig, followingBonus: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Guaranteed priority advantage for accounts directly in the user's graph.</span>
              </div>
            </div>
          </div>

          {/* Group 3: Time Decay & Seen Penalties */}
          <div className="feed-config-section">
            <h3 className="feed-config-section-title">
              <Clock size={16} />
              3. Time Decay & Fatigue Penalties
            </h3>
            <div className="config-grid">
              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Clock size={13} /> Recency Decay Gravity</span>
                  <span className="config-value-badge decay-badge">{Number(feedConfig.recencyGravityDecay || 0).toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  className="config-slider"
                  value={feedConfig.recencyGravityDecay ?? 0.8}
                  onChange={(e) => setFeedConfig({ ...feedConfig, recencyGravityDecay: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Higher values decay older posts faster, prioritizing newest uploads.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Eye size={13} /> Seen Post Penalty Multiplier</span>
                  <span className="config-value-badge decay-badge">{Math.round((feedConfig.seenPostPenaltyMultiplier ?? 0.25) * 100)}% retention</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  className="config-slider"
                  value={feedConfig.seenPostPenaltyMultiplier ?? 0.25}
                  onChange={(e) => setFeedConfig({ ...feedConfig, seenPostPenaltyMultiplier: parseFloat(e.target.value) })}
                />
                <span className="config-toggle-desc">Score penalty applied to posts the user has already viewed in previous sessions.</span>
              </div>
            </div>
          </div>

          {/* Group 4: Feed Composition & Pacing */}
          <div className="feed-config-section">
            <h3 className="feed-config-section-title">
              <Sliders size={16} />
              4. Feed Composition & Pacing Rules
            </h3>
            <div className="config-grid">
              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label">Anti-Clustering Window</span>
                  <span className="config-value-badge">{feedConfig.antiClusteringWindow ?? 4} posts</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  className="config-slider"
                  value={feedConfig.antiClusteringWindow ?? 4}
                  onChange={(e) => setFeedConfig({ ...feedConfig, antiClusteringWindow: parseInt(e.target.value, 10) })}
                />
                <span className="config-toggle-desc">Minimum distance between two posts from the same creator in feed stream.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Film size={13} /> Posts Per Reel Injected</span>
                  <span className="config-value-badge">Every {feedConfig.postsPerReel ?? 3} posts</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  className="config-slider"
                  value={feedConfig.postsPerReel ?? 3}
                  onChange={(e) => setFeedConfig({ ...feedConfig, postsPerReel: parseInt(e.target.value, 10) })}
                />
                <span className="config-toggle-desc">Injects a suggested Reel into the home feed after every N image posts.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><Users size={13} /> Suggested Creators Cadence</span>
                  <span className="config-value-badge">Every {feedConfig.suggestedCreatorsInterval ?? 7} posts</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  className="config-slider"
                  value={feedConfig.suggestedCreatorsInterval ?? 7}
                  onChange={(e) => setFeedConfig({ ...feedConfig, suggestedCreatorsInterval: parseInt(e.target.value, 10) })}
                />
                <span className="config-toggle-desc">Frequency of "Suggested for you" account carousel in feed.</span>
              </div>

              <div className="config-field">
                <label className="config-label">
                  <span className="feed-field-label"><CheckCircle2 size={13} /> "All Caught Up" Horizon</span>
                  <span className="config-value-badge">{feedConfig.allCaughtUpHoursThreshold ?? 72} hours ({Math.round((feedConfig.allCaughtUpHoursThreshold ?? 72) / 24)} days)</span>
                </label>
                <input
                  type="range"
                  min="12"
                  max="336"
                  step="12"
                  className="config-slider"
                  value={feedConfig.allCaughtUpHoursThreshold ?? 72}
                  onChange={(e) => setFeedConfig({ ...feedConfig, allCaughtUpHoursThreshold: parseInt(e.target.value, 10) })}
                />
                <span className="config-toggle-desc">Timeline window considered before triggering "You're all caught up" separator.</span>
              </div>
            </div>
          </div>

          <div className="config-actions-bar">
            <span style={{ fontSize: 13, color: '#8e8e8e' }}>
              Live dynamic parameters applied instantly to FeedService ranker and Explore recommendations.
            </span>
            <button className="btn-primary" onClick={handleSaveFeedConfig} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Feed Algorithm Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== 1. EMAIL DOMAIN ==================== */}
      {activeTab === 'EMAIL' && (
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
                <span>Simulation Mode is enabled: outgoing emails will be safely logged without hitting external SMTP servers.</span>
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
                  onChange={(e) => setEmailServer({ ...emailServer, port: parseInt(e.target.value) || 587 })}
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
                  {emailServer.hasPassword && <span style={{ color: '#00ba7c', fontSize: 11 }}>• Configured</span>}
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
                  onChange={(e) => setEmailServer({ ...emailServer, rateLimitPerHour: parseInt(e.target.value) || 1000 })}
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
      )}

      {/* ==================== 2. DELETION & RETENTION DOMAIN ==================== */}
      {activeTab === 'DELETION' && (
        <div className="config-card">
          <div className="config-card-header">
            <h2 className="config-card-title">
              <Trash2 size={18} color="#0095f6" />
              Deletion & Data Lifecycle Policy
            </h2>
            <span className="config-value-badge">
              {deletion.pseudoPermanentEnabled ? 'Pretend Purge Enabled' : 'Hard Purge Enabled'}
            </span>
          </div>

          {deletion.legalHoldEnabled && (
            <div className="alert-banner danger">
              <AlertTriangle size={18} />
              <span>EMERGENCY LEGAL HOLD ACTIVE: All automated cron purges and permanent deletion operations are strictly frozen.</span>
            </div>
          )}

          <div className="config-grid">
            <div className="config-field">
              <label className="config-label">
                <span>Recently Deleted Trash Lifespan</span>
                <span className="config-value-badge">{deletion.trashRetentionDays} Days</span>
              </label>
              <input
                type="range"
                min="1"
                max="90"
                className="config-slider"
                value={deletion.trashRetentionDays}
                onChange={(e) => setDeletion({ ...deletion, trashRetentionDays: parseInt(e.target.value) })}
              />
              <span className="config-toggle-desc">Duration items remain recoverable in the user's trash bin.</span>
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>Cloudinary & Media Purge Buffer</span>
                <span className="config-value-badge">{deletion.mediaPurgeDelayDays} Days</span>
              </label>
              <input
                type="range"
                min="0"
                max="90"
                className="config-slider"
                value={deletion.mediaPurgeDelayDays}
                onChange={(e) => setDeletion({ ...deletion, mediaPurgeDelayDays: parseInt(e.target.value) })}
              />
              <span className="config-toggle-desc">Grace period before deleted media is permanently cleaned from CDN storage.</span>
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>Account Deletion Grace Window</span>
                <span className="config-value-badge">{deletion.accountGraceDays} Days</span>
              </label>
              <input
                type="range"
                min="0"
                max="60"
                className="config-slider"
                value={deletion.accountGraceDays}
                onChange={(e) => setDeletion({ ...deletion, accountGraceDays: parseInt(e.target.value) })}
              />
              <span className="config-toggle-desc">Days a user can log back in to cancel account self-deletion.</span>
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>Admin Takedown Preservation</span>
                <span className="config-value-badge">{deletion.adminTakedownPreserveDays} Days</span>
              </label>
              <input
                type="number"
                className="config-input"
                value={deletion.adminTakedownPreserveDays}
                onChange={(e) => setDeletion({ ...deletion, adminTakedownPreserveDays: parseInt(e.target.value) || 365 })}
              />
              <span className="config-toggle-desc">Retention period for administrative copyright and violation evidence.</span>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div className="config-toggle-row">
              <div className="config-toggle-info">
                <span className="config-toggle-title">Pseudo-Permanent "Pretend Purge"</span>
                <span className="config-toggle-desc">User believes content is permanently destroyed, but database retains for legal buffer</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={deletion.pseudoPermanentEnabled}
                  onChange={(e) => setDeletion({ ...deletion, pseudoPermanentEnabled: e.target.checked })}
                />
                <span className="slider-toggle"></span>
              </label>
            </div>

            <div className="config-toggle-row">
              <div className="config-toggle-info">
                <span className="config-toggle-title">Emergency Legal Hold Freeze</span>
                <span className="config-toggle-desc">Instantly halts all background purge jobs for regulatory investigations</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={deletion.legalHoldEnabled}
                  onChange={(e) => setDeletion({ ...deletion, legalHoldEnabled: e.target.checked })}
                />
                <span className="slider-toggle"></span>
              </label>
            </div>
          </div>

          <div className="config-actions-bar">
            <span style={{ fontSize: 13, color: '#8e8e8e' }}>Controls dynamic cutoff in ReelService, PostService, and Cloudinary Purge cron jobs.</span>
            <button className="btn-primary" onClick={handleSaveDeletion} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Deletion Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== 3. MEDIA & STORAGE DOMAIN ==================== */}
      {activeTab === 'MEDIA' && (
        <div className="config-card">
          <div className="config-card-header">
            <h2 className="config-card-title">
              <Film size={18} color="#0095f6" />
              Media Upload Limits & Storage Constraints
            </h2>
            <span className="config-value-badge">Publicly Exposed to Web App</span>
          </div>

          <div className="config-grid">
            <div className="config-field">
              <label className="config-label">
                <span>Max Reel Video Size</span>
                <span className="config-value-badge">{Math.round(media.maxReelBytes / (1024 * 1024))} MB</span>
              </label>
              <input
                type="range"
                min="10"
                max="500"
                className="config-slider"
                value={Math.round(media.maxReelBytes / (1024 * 1024))}
                onChange={(e) => setMedia({ ...media, maxReelBytes: parseInt(e.target.value) * 1024 * 1024 })}
              />
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>Max Post File Size</span>
                <span className="config-value-badge">{Math.round(media.maxPostBytes / (1024 * 1024))} MB</span>
              </label>
              <input
                type="range"
                min="5"
                max="250"
                className="config-slider"
                value={Math.round(media.maxPostBytes / (1024 * 1024))}
                onChange={(e) => setMedia({ ...media, maxPostBytes: parseInt(e.target.value) * 1024 * 1024 })}
              />
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>Max Reel Duration</span>
                <span className="config-value-badge">{media.maxReelDurationSec} Seconds</span>
              </label>
              <input
                type="range"
                min="15"
                max="300"
                className="config-slider"
                value={media.maxReelDurationSec}
                onChange={(e) => setMedia({ ...media, maxReelDurationSec: parseInt(e.target.value) })}
              />
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>Max Story Duration</span>
                <span className="config-value-badge">{media.maxStoryDurationSec} Seconds</span>
              </label>
              <input
                type="range"
                min="10"
                max="120"
                className="config-slider"
                value={media.maxStoryDurationSec}
                onChange={(e) => setMedia({ ...media, maxStoryDurationSec: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="config-label" style={{ marginBottom: 8 }}>Permitted MIME Types (Whitelist)</label>
            <input
              type="text"
              className="config-input"
              style={{ width: '100%' }}
              value={media.allowedMimeTypes || ''}
              onChange={(e) => setMedia({ ...media, allowedMimeTypes: e.target.value })}
            />
            <span className="config-toggle-desc" style={{ marginTop: 4, display: 'block' }}>
              Comma-separated list of MIME types accepted by file upload validation.
            </span>
          </div>

          <div className="config-actions-bar">
            <span style={{ fontSize: 13, color: '#8e8e8e' }}>Cached in Redis and shared with the client frontend for live validation.</span>
            <button className="btn-primary" onClick={handleSaveMedia} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Media Limits'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== 4. FEATURE FLAGS DOMAIN ==================== */}
      {activeTab === 'FEATURES' && (
        <div className="config-card">
          <div className="config-card-header">
            <h2 className="config-card-title">
              <Flag size={18} color="#0095f6" />
              Platform Feature Switches & Maintenance Mode
            </h2>
            <span className="config-value-badge">
              {features.maintenanceModeEnabled ? 'MAINTENANCE ACTIVE' : 'Platform Online'}
            </span>
          </div>

          {features.maintenanceModeEnabled && (
            <div className="alert-banner warning">
              <AlertTriangle size={18} />
              <span>MAINTENANCE MODE IS ENABLED: Non-admin users will receive HTTP 503 Service Unavailable and a broadcast message.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div className="config-toggle-row">
              <div className="config-toggle-info">
                <span className="config-toggle-title">Reel Creation & Uploads</span>
                <span className="config-toggle-desc">Enable or disable creator reel video publishing</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={features.reelsUploadEnabled}
                  onChange={(e) => setFeatures({ ...features, reelsUploadEnabled: e.target.checked })}
                />
                <span className="slider-toggle"></span>
              </label>
            </div>

            <div className="config-toggle-row">
              <div className="config-toggle-info">
                <span className="config-toggle-title">Story Creation</span>
                <span className="config-toggle-desc">Enable or disable 24-hour ephemeral story uploads</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={features.storyCreationEnabled}
                  onChange={(e) => setFeatures({ ...features, storyCreationEnabled: e.target.checked })}
                />
                <span className="slider-toggle"></span>
              </label>
            </div>

            <div className="config-toggle-row">
              <div className="config-toggle-info">
                <span className="config-toggle-title">Voice Messages in DMs</span>
                <span className="config-toggle-desc">Enable or disable audio notes in Direct Messaging</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={features.voiceMessagesEnabled}
                  onChange={(e) => setFeatures({ ...features, voiceMessagesEnabled: e.target.checked })}
                />
                <span className="slider-toggle"></span>
              </label>
            </div>

            <div className="config-toggle-row">
              <div className="config-toggle-info">
                <span className="config-toggle-title">Platform Maintenance Mode</span>
                <span className="config-toggle-desc">Switch platform to read-only; admins bypass restrictions</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={features.maintenanceModeEnabled}
                  onChange={(e) => setFeatures({ ...features, maintenanceModeEnabled: e.target.checked })}
                />
                <span className="slider-toggle"></span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="config-label" style={{ marginBottom: 8 }}>Maintenance Broadcast Message</label>
            <textarea
              className="config-textarea"
              rows="3"
              style={{ width: '100%' }}
              value={features.maintenanceMessage || ''}
              onChange={(e) => setFeatures({ ...features, maintenanceMessage: e.target.value })}
            />
          </div>

          <div className="config-actions-bar">
            <span style={{ fontSize: 13, color: '#8e8e8e' }}>Disables mutation operations in ReelServiceImpl, StoryServiceImpl, and returns 400/503.</span>
            <button className="btn-primary" onClick={handleSaveFeatures} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Feature Switches'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== 5. MODERATION DOMAIN ==================== */}
      {activeTab === 'MODERATION' && (
        <div className="config-card">
          <div className="config-card-header">
            <h2 className="config-card-title">
              <ShieldCheck size={18} color="#0095f6" />
              Automated Moderation & Safety Governance
            </h2>
            <span className="config-value-badge">Active Engine</span>
          </div>

          <div className="config-grid">
            <div className="config-field">
              <label className="config-label">
                <span>Auto-Quarantine Report Threshold</span>
                <span className="config-value-badge">{moderation.autoQuarantineReportThreshold} Reports</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="config-input"
                value={moderation.autoQuarantineReportThreshold}
                onChange={(e) => setModeration({ ...moderation, autoQuarantineReportThreshold: parseInt(e.target.value) || 5 })}
              />
              <span className="config-toggle-desc">Unique reports needed to automatically hide content pending admin review.</span>
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>Copyright Strike Limit</span>
                <span className="config-value-badge">{moderation.copyrightStrikeLimit} Strikes</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="config-input"
                value={moderation.copyrightStrikeLimit}
                onChange={(e) => setModeration({ ...moderation, copyrightStrikeLimit: parseInt(e.target.value) || 3 })}
              />
              <span className="config-toggle-desc">Number of verified takedowns before creator account is flagged for suspension.</span>
            </div>

            <div className="config-field">
              <label className="config-label">
                <span>AI NSFW Blur Sensitivity</span>
                <span className="config-value-badge">{Math.round(moderation.nsfwBlurThreshold * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                className="config-slider"
                value={moderation.nsfwBlurThreshold}
                onChange={(e) => setModeration({ ...moderation, nsfwBlurThreshold: parseFloat(e.target.value) })}
              />
              <span className="config-toggle-desc">Confidence score required to automatically apply sensitivity blur cover.</span>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="config-label" style={{ marginBottom: 8 }}>Banned Words & Profanity Dictionary</label>
            <textarea
              className="config-textarea"
              rows="4"
              style={{ width: '100%' }}
              value={moderation.profanityBannedWords || ''}
              onChange={(e) => setModeration({ ...moderation, profanityBannedWords: e.target.value })}
            />
            <span className="config-toggle-desc" style={{ marginTop: 4, display: 'block' }}>
              Comma-separated terms that automatically trigger comment quarantine and spam flagging.
            </span>
          </div>

          <div className="config-actions-bar">
            <span style={{ fontSize: 13, color: '#8e8e8e' }}>Enforced dynamically in ModerationService and automated content safety checks.</span>
            <button className="btn-primary" onClick={handleSaveModeration} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Safety Rules'}
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AdminConfigHubPage;
