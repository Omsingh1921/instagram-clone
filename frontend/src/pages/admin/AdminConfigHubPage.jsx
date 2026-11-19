import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layers,
  RotateCcw,
  Sliders,
  Sparkles,
  Mail,
  Trash2,
  Film,
  Flag,
  ShieldCheck,
} from 'lucide-react';
import adminConfigService from '../../services/adminConfig.service';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ConfigDynamicTab,
  ConfigFeedAlgorithmTab,
  ConfigEmailTab,
  ConfigDeletionTab,
  ConfigMediaTab,
  ConfigFeaturesTab,
  ConfigModerationTab,
} from '../../components/admin/config';
import './AdminConfigHubPage.css';

export const AdminConfigHubPage = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const validTabs = [
    'DYNAMIC_CONFIG',
    'FEED_ALGORITHM',
    'EMAIL',
    'DELETION',
    'MEDIA',
    'FEATURES',
    'MODERATION',
  ];
  const [activeTab, setActiveTab] = useState(
    queryTab && validTabs.includes(queryTab.toUpperCase())
      ? queryTab.toUpperCase()
      : 'DYNAMIC_CONFIG'
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
    maintenanceMessage:
      'Instagram is currently undergoing scheduled maintenance. Please check back shortly.',
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
        adminConfigService.getEmailServerConfig
          ? adminConfigService.getEmailServerConfig()
          : Promise.resolve({ data: null }),
        adminConfigService.getDeletionConfig
          ? adminConfigService.getDeletionConfig()
          : Promise.resolve({ data: null }),
        adminConfigService.getMediaConfig
          ? adminConfigService.getMediaConfig()
          : Promise.resolve({ data: null }),
        adminConfigService.getFeatureFlagConfig
          ? adminConfigService.getFeatureFlagConfig()
          : Promise.resolve({ data: null }),
        adminConfigService.getModerationConfig
          ? adminConfigService.getModerationConfig()
          : Promise.resolve({ data: null }),
        adminConfigService.getDynamicConfigs
          ? adminConfigService.getDynamicConfigs()
          : Promise.resolve({ data: [] }),
        adminConfigService.getFeedConfig
          ? adminConfigService.getFeedConfig()
          : Promise.resolve({ data: null }),
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
          {resetting ? 'Resetting...' : 'Reset Tab to Default'}
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

      {/* TAB 1: DYNAMIC CONFIG */}
      {activeTab === 'DYNAMIC_CONFIG' && (
        <ConfigDynamicTab
          loading={loading}
          configSearch={configSearch}
          setConfigSearch={setConfigSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          dynamicConfigs={dynamicConfigs}
          editedValues={editedValues}
          handleConfigValueChange={handleConfigValueChange}
          toggleSecretReveal={toggleSecretReveal}
          revealedSecrets={revealedSecrets}
          savingKey={savingKey}
          resettingKey={resettingKey}
          handleSaveSingleConfig={handleSaveSingleConfig}
          handleResetSingleConfig={handleResetSingleConfig}
        />
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
          {/* TAB 2: FEED ALGORITHM */}
          {activeTab === 'FEED_ALGORITHM' && (
            <ConfigFeedAlgorithmTab
              feedConfig={feedConfig}
              setFeedConfig={setFeedConfig}
              handleSaveFeedConfig={handleSaveFeedConfig}
              saving={saving}
            />
          )}

          {/* TAB 3: EMAIL & SMTP */}
          {activeTab === 'EMAIL' && (
            <ConfigEmailTab
              emailServer={emailServer}
              setEmailServer={setEmailServer}
              testRecipient={testRecipient}
              setTestRecipient={setTestRecipient}
              handleTestEmailHandshake={handleTestEmailHandshake}
              sendingTest={sendingTest}
              handleSaveEmailServer={handleSaveEmailServer}
              saving={saving}
            />
          )}

          {/* TAB 4: DELETION & RETENTION */}
          {activeTab === 'DELETION' && (
            <ConfigDeletionTab
              deletion={deletion}
              setDeletion={setDeletion}
              handleSaveDeletion={handleSaveDeletion}
              saving={saving}
            />
          )}

          {/* TAB 5: MEDIA & STORAGE */}
          {activeTab === 'MEDIA' && (
            <ConfigMediaTab
              media={media}
              setMedia={setMedia}
              handleSaveMedia={handleSaveMedia}
              saving={saving}
            />
          )}

          {/* TAB 6: FEATURE FLAGS */}
          {activeTab === 'FEATURES' && (
            <ConfigFeaturesTab
              features={features}
              setFeatures={setFeatures}
              handleSaveFeatures={handleSaveFeatures}
              saving={saving}
            />
          )}

          {/* TAB 7: SAFETY & MODERATION */}
          {activeTab === 'MODERATION' && (
            <ConfigModerationTab
              moderation={moderation}
              setModeration={setModeration}
              handleSaveModeration={handleSaveModeration}
              saving={saving}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdminConfigHubPage;
