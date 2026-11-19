import React from 'react';
import {
  AtSign,
  Music,
  HelpCircle,
  BarChart2,
  HelpCircle as QuizIcon,
  Flame,
  Clock,
  Link as LinkIcon,
  MapPin,
  Hash,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import StoryMusicPicker from './StoryMusicPicker';

export const STICKER_TYPES_DEF = [
  { type: 'mention', label: 'Mention', icon: AtSign, color: 'linear-gradient(45deg, #f09433, #e6683c)' },
  { type: 'music', label: 'Music', icon: Music, color: 'linear-gradient(45deg, #dc2743, #cc2366)' },
  { type: 'question', label: 'Question', icon: HelpCircle, color: 'linear-gradient(45deg, #8a3ab9, #bc1888)' },
  { type: 'poll', label: 'Poll', icon: BarChart2, color: 'linear-gradient(45deg, #00ba7c, #0095f6)' },
  { type: 'quiz', label: 'Quiz', icon: QuizIcon, color: 'linear-gradient(45deg, #e95950, #fccc63)' },
  { type: 'slider', label: 'Slider', icon: Flame, color: 'linear-gradient(45deg, #ff5e3a, #ff2a68)' },
  { type: 'countdown', label: 'Countdown', icon: Clock, color: 'linear-gradient(45deg, #ff9500, #ff5e3a)' },
  { type: 'link', label: 'Link', icon: LinkIcon, color: 'linear-gradient(45deg, #0095f6, #4c68d7)' },
  { type: 'location', label: 'Location', icon: MapPin, color: 'linear-gradient(45deg, #e1306c, #fd1d1d)' },
  { type: 'hashtag', label: 'Hashtag', icon: Hash, color: 'linear-gradient(45deg, #5851db, #833ab4)' },
];

export const StoryStickersTab = ({
  attachedCount,
  activeStickerType,
  setActiveStickerType,
  interactiveType,
  setInteractiveType,
  isMusicActive,
  isMentionActive,
  audioTitle,
  setAudioTitle,
  audioArtist,
  setAudioArtist,
  selectedMentionUsers,
  setSelectedMentionUsers,
  handleRemoveCurrentSticker,
  handleSetPresetPosition,
  stickerPos,
  showMentionsOnScreen,
  setShowMentionsOnScreen,
  mentionSearch,
  setMentionSearch,
  isSearchingMention,
  mentionUserResults,
  setMentionUserResults,
  questionPrompt,
  setQuestionPrompt,
  pollQuestion,
  setPollQuestion,
  pollOptionA,
  setPollOptionA,
  pollOptionB,
  setPollOptionB,
  quizQuestion,
  setQuizQuestion,
  quizOptionA,
  setQuizOptionA,
  quizOptionB,
  setQuizOptionB,
  quizOptionC,
  setQuizOptionC,
  quizCorrectIndex,
  setQuizCorrectIndex,
  sliderQuestion,
  setSliderQuestion,
  sliderEmoji,
  setSliderEmoji,
  countdownTitle,
  setCountdownTitle,
  countdownDate,
  setCountdownDate,
  isLinkActive,
  linkUrl,
  setLinkUrl,
  linkText,
  setLinkText,
  isLocationActive,
  locationName,
  setLocationName,
  isHashtagActive,
  hashtagTag,
  setHashtagTag,
}) => {
  return (
    <div className="story-stickers-panel">
      {/* Attached stickers summary banner */}
      {attachedCount > 0 && (
        <div className="story-applied-features-strip">
          <span className="story-applied-strip-title">Applied to Story:</span>
          <div className="story-applied-chips-list">
            {isMusicActive && (
              <div
                className={`story-feature-chip ${activeStickerType === 'music' ? 'selected' : ''}`}
                onClick={() => setActiveStickerType('music')}
                title="Click to edit music"
              >
                <span className="story-feature-chip-label">🎵 {audioTitle || 'Music'}</span>
                <button
                  type="button"
                  className="story-feature-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAudioTitle('');
                    setAudioArtist('');
                    if (activeStickerType === 'music') setActiveStickerType('none');
                  }}
                  title="Remove music"
                >
                  ×
                </button>
              </div>
            )}
            {selectedMentionUsers.length > 0 && (
              <div
                className={`story-feature-chip ${activeStickerType === 'mention' ? 'selected' : ''}`}
                onClick={() => setActiveStickerType('mention')}
                title="Click to edit mentions"
              >
                <span className="story-feature-chip-label">@ {selectedMentionUsers.length} Tagged</span>
                <button
                  type="button"
                  className="story-feature-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMentionUsers([]);
                    if (activeStickerType === 'mention') setActiveStickerType('none');
                  }}
                  title="Remove mentions"
                >
                  ×
                </button>
              </div>
            )}
            {interactiveType !== 'none' && (
              <div
                className={`story-feature-chip ${[
                  'question',
                  'poll',
                  'quiz',
                  'slider',
                  'countdown',
                ].includes(activeStickerType) ? 'selected' : ''}`}
                onClick={() => setActiveStickerType(interactiveType)}
                title="Click to edit interactive widget"
              >
                <span className="story-feature-chip-label">
                  {interactiveType === 'question' && '❓ Question'}
                  {interactiveType === 'poll' && '📊 Poll'}
                  {interactiveType === 'quiz' && '💡 Quiz'}
                  {interactiveType === 'slider' && '🔥 Slider'}
                  {interactiveType === 'countdown' && '⏱️ Countdown'}
                </span>
                <button
                  type="button"
                  className="story-feature-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInteractiveType('none');
                    if (
                      ['question', 'poll', 'quiz', 'slider', 'countdown'].includes(
                        activeStickerType
                      )
                    ) {
                      setActiveStickerType('none');
                    }
                  }}
                  title="Remove interactive sticker"
                >
                  ×
                </button>
              </div>
            )}
            {isLinkActive && (
              <div
                className={`story-feature-chip ${activeStickerType === 'link' ? 'selected' : ''}`}
                onClick={() => setActiveStickerType('link')}
                title="Click to edit link"
              >
                <span className="story-feature-chip-label">🔗 {linkText || 'Link'}</span>
                <button
                  type="button"
                  className="story-feature-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLinkUrl('');
                    setLinkText('');
                    if (activeStickerType === 'link') setActiveStickerType('none');
                  }}
                  title="Remove link"
                >
                  ×
                </button>
              </div>
            )}
            {isLocationActive && (
              <div
                className={`story-feature-chip ${activeStickerType === 'location' ? 'selected' : ''}`}
                onClick={() => setActiveStickerType('location')}
                title="Click to edit location"
              >
                <span className="story-feature-chip-label">📍 {locationName}</span>
                <button
                  type="button"
                  className="story-feature-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocationName('');
                    if (activeStickerType === 'location') setActiveStickerType('none');
                  }}
                  title="Remove location"
                >
                  ×
                </button>
              </div>
            )}
            {isHashtagActive && (
              <div
                className={`story-feature-chip ${activeStickerType === 'hashtag' ? 'selected' : ''}`}
                onClick={() => setActiveStickerType('hashtag')}
                title="Click to edit hashtag"
              >
                <span className="story-feature-chip-label">#{hashtagTag.replace(/^#/, '')}</span>
                <button
                  type="button"
                  className="story-feature-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHashtagTag('');
                    if (activeStickerType === 'hashtag') setActiveStickerType('none');
                  }}
                  title="Remove hashtag"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stickers Selector Grid */}
      <div className="story-stickers-grid">
        {STICKER_TYPES_DEF.map(({ type, label, icon: Icon, color }) => {
          const isAttached =
            (type === 'mention' && isMentionActive) ||
            (type === 'music' && isMusicActive) ||
            (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(type) &&
              interactiveType === type) ||
            (type === 'link' && isLinkActive) ||
            (type === 'location' && isLocationActive) ||
            (type === 'hashtag' && isHashtagActive);

          const count = type === 'mention' ? selectedMentionUsers.length : null;
          const isEditing = activeStickerType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                if (isEditing) {
                  setActiveStickerType('none');
                } else {
                  setActiveStickerType(type);
                  if (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(type)) {
                    setInteractiveType(type);
                  }
                }
              }}
              className={`story-sticker-card-btn ${isEditing ? 'active' : ''} ${
                isAttached ? 'attached' : ''
              }`}
            >
              <span className="story-sticker-icon-badge" style={{ background: color }}>
                <Icon size={14} />
              </span>
              <span className="story-sticker-label-text">{label}</span>
              {isAttached && (
                <span className="story-sticker-attached-badge" title="Applied to story">
                  ✓{count ? ` ${count}` : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Sticker Configuration Form */}
      <div className="story-sticker-config-form">
        {/* Preset Position Buttons */}
        {activeStickerType !== 'none' && (
          <div className="sticker-pos-presets">
            <div className="sticker-pos-header">
              <label>
                {activeStickerType.charAt(0).toUpperCase() + activeStickerType.slice(1)} Position
              </label>
              <button
                type="button"
                className="sticker-remove-text-btn"
                onClick={() => handleRemoveCurrentSticker(activeStickerType)}
              >
                Remove from story
              </button>
            </div>
            <div className="ig-pos-btn-group">
              <button
                type="button"
                className={`ig-pos-btn ${stickerPos.y <= 28 ? 'active' : ''}`}
                onClick={() => handleSetPresetPosition('top')}
              >
                Top
              </button>
              <button
                type="button"
                className={`ig-pos-btn ${
                  stickerPos.y > 28 && stickerPos.y < 60 ? 'active' : ''
                }`}
                onClick={() => handleSetPresetPosition('center')}
              >
                Center
              </button>
              <button
                type="button"
                className={`ig-pos-btn ${stickerPos.y >= 60 ? 'active' : ''}`}
                onClick={() => handleSetPresetPosition('bottom')}
              >
                Bottom
              </button>
            </div>
            <p className="sticker-drag-tip-text">
              💡 You can also drag this sticker anywhere on the story preview.
            </p>
          </div>
        )}

        {/* 1. Mention Editor */}
        {activeStickerType === 'mention' && (
          <div className="sticker-input-group">
            <div className="mention-visibility-header">
              <label style={{ margin: 0 }}>Mention Users (@username)</label>
              <button
                type="button"
                className={`ig-mention-vis-toggle-btn ${
                  showMentionsOnScreen ? 'active' : 'hidden-state'
                }`}
                onClick={() => setShowMentionsOnScreen((prev) => !prev)}
                title={
                  showMentionsOnScreen
                    ? 'Click to hide mentions from video screen'
                    : 'Click to show mentions on video screen'
                }
              >
                {showMentionsOnScreen ? (
                  <>
                    <Eye size={13} />
                    <span>Show on screen</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={13} />
                    <span>Don&apos;t show on screen</span>
                  </>
                )}
              </button>
            </div>

            {!showMentionsOnScreen && (
              <div className="mention-invisible-alert">
                <EyeOff size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Invisible Mentions Active:</strong>
                  <span>
                    {' '}
                    Mentioned friends will still receive a notification and DM, but their
                    names will NOT show on the video.
                  </span>
                </div>
              </div>
            )}

            <input
              type="text"
              value={mentionSearch}
              onChange={(e) => setMentionSearch(e.target.value)}
              placeholder="@search username to add..."
              className="ig-details-input"
              autoFocus
            />

            {/* Selected Mention Chips */}
            {selectedMentionUsers.length > 0 && (
              <div className="mention-selected-chips-list">
                {selectedMentionUsers.map((u) => (
                  <span key={u.id || u.userId} className="mention-user-chip">
                    <Avatar src={u.avatarUrl || u.profilePictureUrl} size="xs" />
                    <span className="chip-username">@{u.username}</span>
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() =>
                        setSelectedMentionUsers((prev) =>
                          prev.filter((m) => (m.id || m.userId) !== (u.id || u.userId))
                        )
                      }
                      title={`Remove @${u.username}`}
                      aria-label={`Remove @${u.username}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {isSearchingMention && (
              <div style={{ padding: '8px', fontSize: '12px', color: '#8e8e8e' }}>
                Searching users...
              </div>
            )}

            {mentionUserResults.length > 0 && (
              <div
                style={{
                  marginTop: '6px',
                  background: '#1c1c1c',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {mentionUserResults
                  .filter(
                    (u) =>
                      !selectedMentionUsers.some(
                        (m) => (m.id || m.userId) === (u.id || u.userId)
                      )
                  )
                  .map((u) => (
                    <div
                      key={u.id || u.userId}
                      onClick={() => {
                        setSelectedMentionUsers((prev) => [...prev, u]);
                        setMentionSearch('');
                        setMentionUserResults([]);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #262626',
                      }}
                      className="mention-user-row"
                    >
                      <Avatar src={u.avatarUrl || u.profilePictureUrl} size="sm" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          @{u.username}
                        </span>
                        {u.displayName && (
                          <span style={{ fontSize: '11px', color: '#8e8e8e' }}>
                            {u.displayName}
                          </span>
                        )}
                      </div>
                      <span className="mention-add-pill">+ Add</span>
                    </div>
                  ))}
              </div>
            )}
            <p className="sticker-drag-tip-text">
              💡 You can mention multiple users. Each will receive an instant notification
              and auto-DM with &quot;Add to Story&quot;!
            </p>
          </div>
        )}

        {/* 2. Question Editor */}
        {activeStickerType === 'question' && (
          <div className="sticker-input-group">
            <label>Question Prompt</label>
            <input
              type="text"
              value={questionPrompt}
              onChange={(e) => setQuestionPrompt(e.target.value)}
              placeholder="Ask me a question"
              maxLength={150}
              className="ig-details-input"
            />
            <p className="sticker-drag-tip-text">
              💡 Viewers can type answers into the box. You will see all responses in your
              story viewers list.
            </p>
          </div>
        )}

        {/* 3. Poll Editor */}
        {activeStickerType === 'poll' && (
          <div className="sticker-input-group">
            <label>Poll Question</label>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              maxLength={150}
              className="ig-details-input"
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                value={pollOptionA}
                onChange={(e) => setPollOptionA(e.target.value)}
                placeholder="Option 1"
                className="ig-details-input"
              />
              <input
                type="text"
                value={pollOptionB}
                onChange={(e) => setPollOptionB(e.target.value)}
                placeholder="Option 2"
                className="ig-details-input"
              />
            </div>
          </div>
        )}

        {/* 4. Quiz Editor */}
        {activeStickerType === 'quiz' && (
          <div className="sticker-input-group">
            <label>Quiz Question & Options</label>
            <input
              type="text"
              value={quizQuestion}
              onChange={(e) => setQuizQuestion(e.target.value)}
              placeholder="Quiz question..."
              maxLength={150}
              className="ig-details-input"
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginTop: '8px',
              }}
            >
              {[
                { val: quizOptionA, set: setQuizOptionA, idx: 0 },
                { val: quizOptionB, set: setQuizOptionB, idx: 1 },
                { val: quizOptionC, set: setQuizOptionC, idx: 2 },
              ].map(({ val, set, idx }) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background:
                      quizCorrectIndex === idx
                        ? 'rgba(0, 186, 124, 0.15)'
                        : 'transparent',
                    border:
                      quizCorrectIndex === idx
                        ? '1px solid #00ba7c'
                        : '1px solid #333',
                    borderRadius: '8px',
                    padding: '4px 8px',
                  }}
                >
                  <input
                    type="radio"
                    name="quizCorrectOption"
                    checked={quizCorrectIndex === idx}
                    onChange={() => setQuizCorrectIndex(idx)}
                    title="Mark as correct option"
                  />
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="ig-details-input"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '4px 0',
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="sticker-drag-tip-text">
              💡 Select the radio button next to the correct answer.
            </p>
          </div>
        )}

        {/* 5. Slider Editor */}
        {activeStickerType === 'slider' && (
          <div className="sticker-input-group">
            <label>Slider Question</label>
            <input
              type="text"
              value={sliderQuestion}
              onChange={(e) => setSliderQuestion(e.target.value)}
              placeholder="How hot is this?"
              maxLength={100}
              className="ig-details-input"
            />
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', color: '#8e8e8e' }}>Emoji:</span>
              {['🔥', '❤️', '😍', '😂', '👏', '🎉', '🙌'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSliderEmoji(emoji)}
                  style={{
                    background: sliderEmoji === emoji ? '#333' : 'transparent',
                    border:
                      sliderEmoji === emoji
                        ? '1px solid #0095f6'
                        : '1px solid transparent',
                    borderRadius: '6px',
                    fontSize: '18px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. Countdown Editor */}
        {activeStickerType === 'countdown' && (
          <div className="sticker-input-group">
            <label>Countdown Event Name</label>
            <input
              type="text"
              value={countdownTitle}
              onChange={(e) => setCountdownTitle(e.target.value)}
              placeholder="Upcoming event..."
              maxLength={60}
              className="ig-details-input"
            />
            <label style={{ marginTop: '10px' }}>End Date & Time</label>
            <input
              type="datetime-local"
              value={countdownDate}
              onChange={(e) => setCountdownDate(e.target.value)}
              className="ig-details-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}

        {/* 7. Link Editor */}
        {activeStickerType === 'link' && (
          <div className="sticker-input-group">
            <label>Link URL</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="ig-details-input"
            />
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Sticker text (optional)"
              className="ig-details-input"
              style={{ marginTop: '6px' }}
            />
          </div>
        )}

        {/* 8. Location Editor */}
        {activeStickerType === 'location' && (
          <div className="sticker-input-group">
            <label>Location</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Add location (e.g. Mumbai, India)"
              className="ig-details-input"
            />
          </div>
        )}

        {/* 9. Hashtag Editor */}
        {activeStickerType === 'hashtag' && (
          <div className="sticker-input-group">
            <label>Hashtag</label>
            <input
              type="text"
              value={hashtagTag}
              onChange={(e) => setHashtagTag(e.target.value)}
              placeholder="#travel"
              className="ig-details-input"
            />
          </div>
        )}

        {/* 10. Music Editor (Delegated to StoryMusicPicker) */}
        {activeStickerType === 'music' && (
          <StoryMusicPicker
            audioTitle={audioTitle}
            setAudioTitle={setAudioTitle}
            audioArtist={audioArtist}
            setAudioArtist={setAudioArtist}
            onRemoveMusic={() => {
              setAudioTitle('');
              setAudioArtist('');
              setActiveStickerType('none');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StoryStickersTab;
