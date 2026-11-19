import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Share2,
  Bookmark,
  MessageCircle,
  Heart,
  Compass,
  UserCheck,
  Layers,
  Check,
  Clock,
  Eye,
  Sliders,
  Film,
  Users,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const ConfigFeedAlgorithmTab = ({
  feedConfig,
  setFeedConfig,
  handleSaveFeedConfig,
  saving,
}) => {
  return (
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
              <span className="feed-field-label">
                <Share2 size={13} /> Share Weight
              </span>
              <span className="config-value-badge weight-badge">
                {Number(feedConfig.weightShare || 0).toFixed(1)}x
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="20.0"
              step="0.1"
              className="config-slider feed-slider-share"
              value={feedConfig.weightShare ?? 4.0}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, weightShare: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              Multiplier awarded when posts are forwarded or shared in Direct DMs.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <Bookmark size={13} /> Save / Bookmark Weight
              </span>
              <span className="config-value-badge weight-badge">
                {Number(feedConfig.weightSave || 0).toFixed(1)}x
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="20.0"
              step="0.1"
              className="config-slider feed-slider-save"
              value={feedConfig.weightSave ?? 3.0}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, weightSave: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              High-intent signal when users save posts to collections.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <MessageCircle size={13} /> Comment Weight
              </span>
              <span className="config-value-badge weight-badge">
                {Number(feedConfig.weightComment || 0).toFixed(1)}x
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="20.0"
              step="0.1"
              className="config-slider feed-slider-comment"
              value={feedConfig.weightComment ?? 2.5}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, weightComment: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              Conversational signal for meaningful discussion and replies.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <Heart size={13} /> Like Weight
              </span>
              <span className="config-value-badge weight-badge">
                {Number(feedConfig.weightLike || 0).toFixed(1)}x
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="20.0"
              step="0.1"
              className="config-slider feed-slider-like"
              value={feedConfig.weightLike ?? 1.0}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, weightLike: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              Baseline lightweight appreciation signal.
            </span>
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
              <span className="feed-field-label">
                <UserCheck size={13} /> Author Affinity Weight
              </span>
              <span className="config-value-badge affinity-badge">
                {Number(feedConfig.authorAffinityWeight || 0).toFixed(1)} pts
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="100.0"
              step="1.0"
              className="config-slider"
              value={feedConfig.authorAffinityWeight ?? 25.0}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, authorAffinityWeight: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              Boost based on how frequently the viewer interacts with this creator.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <Layers size={13} /> Topic / Category Affinity
              </span>
              <span className="config-value-badge affinity-badge">
                {Number(feedConfig.topicAffinityWeight || 0).toFixed(1)} pts
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="100.0"
              step="1.0"
              className="config-slider"
              value={feedConfig.topicAffinityWeight ?? 20.0}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, topicAffinityWeight: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              Matching hashtag and niche category interests.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <Check size={13} /> Following Creator Bonus
              </span>
              <span className="config-value-badge affinity-badge">
                +{Number(feedConfig.followingBonus || 0).toFixed(1)} pts
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="50.0"
              step="1.0"
              className="config-slider"
              value={feedConfig.followingBonus ?? 15.0}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, followingBonus: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              Guaranteed priority advantage for accounts directly in the user&apos;s graph.
            </span>
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
              <span className="feed-field-label">
                <Clock size={13} /> Recency Decay Gravity
              </span>
              <span className="config-value-badge decay-badge">
                {Number(feedConfig.recencyGravityDecay || 0).toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              className="config-slider"
              value={feedConfig.recencyGravityDecay ?? 0.8}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, recencyGravityDecay: parseFloat(e.target.value) })
              }
            />
            <span className="config-toggle-desc">
              Higher values decay older posts faster, prioritizing newest uploads.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <Eye size={13} /> Seen Post Penalty Multiplier
              </span>
              <span className="config-value-badge decay-badge">
                {Math.round((feedConfig.seenPostPenaltyMultiplier ?? 0.25) * 100)}% retention
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              className="config-slider"
              value={feedConfig.seenPostPenaltyMultiplier ?? 0.25}
              onChange={(e) =>
                setFeedConfig({
                  ...feedConfig,
                  seenPostPenaltyMultiplier: parseFloat(e.target.value),
                })
              }
            />
            <span className="config-toggle-desc">
              Score penalty applied to posts the user has already viewed in previous sessions.
            </span>
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
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, antiClusteringWindow: parseInt(e.target.value, 10) })
              }
            />
            <span className="config-toggle-desc">
              Minimum distance between two posts from the same creator in feed stream.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <Film size={13} /> Posts Per Reel Injected
              </span>
              <span className="config-value-badge">
                Every {feedConfig.postsPerReel ?? 3} posts
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              className="config-slider"
              value={feedConfig.postsPerReel ?? 3}
              onChange={(e) =>
                setFeedConfig({ ...feedConfig, postsPerReel: parseInt(e.target.value, 10) })
              }
            />
            <span className="config-toggle-desc">
              Injects a suggested Reel into the home feed after every N image posts.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <Users size={13} /> Suggested Creators Cadence
              </span>
              <span className="config-value-badge">
                Every {feedConfig.suggestedCreatorsInterval ?? 7} posts
              </span>
            </label>
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              className="config-slider"
              value={feedConfig.suggestedCreatorsInterval ?? 7}
              onChange={(e) =>
                setFeedConfig({
                  ...feedConfig,
                  suggestedCreatorsInterval: parseInt(e.target.value, 10),
                })
              }
            />
            <span className="config-toggle-desc">
              Frequency of &quot;Suggested for you&quot; account carousel in feed.
            </span>
          </div>

          <div className="config-field">
            <label className="config-label">
              <span className="feed-field-label">
                <CheckCircle2 size={13} /> &quot;All Caught Up&quot; Horizon
              </span>
              <span className="config-value-badge">
                {feedConfig.allCaughtUpHoursThreshold ?? 72} hours (
                {Math.round((feedConfig.allCaughtUpHoursThreshold ?? 72) / 24)} days)
              </span>
            </label>
            <input
              type="range"
              min="12"
              max="336"
              step="12"
              className="config-slider"
              value={feedConfig.allCaughtUpHoursThreshold ?? 72}
              onChange={(e) =>
                setFeedConfig({
                  ...feedConfig,
                  allCaughtUpHoursThreshold: parseInt(e.target.value, 10),
                })
              }
            />
            <span className="config-toggle-desc">
              Timeline window considered before triggering &quot;You&apos;re all caught up&quot; separator.
            </span>
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
  );
};

export default ConfigFeedAlgorithmTab;
