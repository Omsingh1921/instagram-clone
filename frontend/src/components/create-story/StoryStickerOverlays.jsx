import React from 'react';
import { X, Music, Link as LinkIcon, MapPin } from 'lucide-react';

export const StoryStickerOverlays = ({
  isMusicActive,
  activeStickerType,
  setActiveStickerType,
  draggingStickerKey,
  stickerPositions,
  handleStickerPointerDown,
  setAudioTitle,
  setAudioArtist,
  audioTitle,
  audioArtist,
  showMentionsOnScreen,
  setShowMentionsOnScreen,
  selectedMentionUsers,
  mentionSearch,
  handleRemoveMentionUser,
  isInteractiveActive,
  interactiveType,
  setInteractiveType,
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
  countdownTitle,
  countdownDate,
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
    <>
      {/* 1. Music Sticker Overlay */}
      {(isMusicActive || activeStickerType === 'music') && (
        <div
          className={`story-sticker-overlay-wrapper ${draggingStickerKey === 'music' ? 'dragging' : ''} ${activeStickerType === 'music' ? 'selected' : ''}`}
          style={{
            left: `${stickerPositions.music.x}%`,
            top: `${stickerPositions.music.y}%`,
          }}
          onMouseDown={(e) => handleStickerPointerDown(e, 'music')}
          onTouchStart={(e) => handleStickerPointerDown(e, 'music')}
        >
          <button
            type="button"
            className="story-sticker-corner-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              setAudioTitle('');
              setAudioArtist('');
              if (activeStickerType === 'music') setActiveStickerType('none');
            }}
            title="Remove music"
            aria-label="Remove music"
          >
            <X size={12} strokeWidth={2.8} />
          </button>
          <div className="story-sticker-drag-handle" title="Drag to reposition music">
            <span className="story-sticker-drag-pill" />
          </div>
          <div className="story-sticker-overlay ig-music-sticker-card">
            <div className="ig-music-art-disc">
              <Music size={15} />
            </div>
            <div className="ig-music-meta">
              <span className="ig-music-title">{audioTitle || 'Song Name'}</span>
              <span className="ig-music-artist">{audioArtist || 'Instagram Music'}</span>
            </div>
            <div className="ig-music-eq" aria-hidden="true">
              <span className="ig-eq-bar bar-1" />
              <span className="ig-eq-bar bar-2" />
              <span className="ig-eq-bar bar-3" />
              <span className="ig-eq-bar bar-4" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Mentions Overlay */}
      {showMentionsOnScreen && (selectedMentionUsers.length > 0 || (activeStickerType === 'mention' && (mentionSearch.trim() || selectedMentionUsers.length === 0))) && (
        <div
          className={`story-sticker-overlay-wrapper ${draggingStickerKey === 'mention' ? 'dragging' : ''} ${activeStickerType === 'mention' ? 'selected' : ''}`}
          style={{
            left: `${stickerPositions.mention.x}%`,
            top: `${stickerPositions.mention.y}%`,
          }}
          onMouseDown={(e) => handleStickerPointerDown(e, 'mention')}
          onTouchStart={(e) => handleStickerPointerDown(e, 'mention')}
        >
          <button
            type="button"
            className="story-sticker-corner-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMentionsOnScreen(false);
            }}
            title="Don't show on screen"
            aria-label="Don't show on screen"
          >
            <X size={12} strokeWidth={2.8} />
          </button>
          <div className="story-sticker-drag-handle" title="Drag to reposition mentions">
            <span className="story-sticker-drag-pill" />
          </div>
          <div className="story-sticker-overlay ig-mention-sticker-group">
            {selectedMentionUsers.length > 0 ? (
              selectedMentionUsers.map((u) => (
                <div key={u.id || u.userId} className="ig-mention-sticker-pill">
                  <span className="ig-mention-gradient-at">@</span>
                  <span className="ig-mention-username">{u.username}</span>
                  <button
                    type="button"
                    className="ig-mention-mini-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMentionUser(u.id || u.userId);
                    }}
                    title={`Remove @${u.username}`}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))
            ) : (
              <div className="ig-mention-sticker-pill placeholder">
                <span className="ig-mention-gradient-at">@</span>
                <span className="ig-mention-username">{mentionSearch.replace(/^@/, '') || 'mention'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Interactive Widget Overlay */}
      {(isInteractiveActive || ['question', 'poll', 'quiz', 'slider', 'countdown'].includes(activeStickerType)) && (
        (() => {
          const activeWidget = ['question', 'poll', 'quiz', 'slider', 'countdown'].includes(activeStickerType)
            ? activeStickerType
            : interactiveType;
          return (
            <div
              className={`story-sticker-overlay-wrapper ${draggingStickerKey === 'interactive' ? 'dragging' : ''} ${['question', 'poll', 'quiz', 'slider', 'countdown'].includes(activeStickerType) ? 'selected' : ''}`}
              style={{
                left: `${stickerPositions.interactive.x}%`,
                top: `${stickerPositions.interactive.y}%`,
              }}
              onMouseDown={(e) => handleStickerPointerDown(e, 'interactive')}
              onTouchStart={(e) => handleStickerPointerDown(e, 'interactive')}
            >
              <button
                type="button"
                className="story-sticker-corner-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setInteractiveType('none');
                  if (['question', 'poll', 'quiz', 'slider', 'countdown'].includes(activeStickerType)) {
                    setActiveStickerType('none');
                  }
                }}
                title="Remove interactive sticker"
                aria-label="Remove interactive sticker"
              >
                <X size={12} strokeWidth={2.8} />
              </button>
              <div className="story-sticker-drag-handle" title="Drag to reposition widget">
                <span className="story-sticker-drag-pill" />
              </div>

              {activeWidget === 'question' && (
                <div className="story-sticker-overlay question-overlay">
                  <div className="question-header">
                    <input
                      type="text"
                      value={questionPrompt}
                      onChange={(e) => setQuestionPrompt(e.target.value)}
                      placeholder="Ask me a question"
                      maxLength={150}
                      className="sticker-prompt-input"
                    />
                  </div>
                  <div className="question-placeholder">Type something...</div>
                </div>
              )}

              {activeWidget === 'poll' && (
                <div className="story-sticker-overlay poll-overlay">
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    maxLength={150}
                    className="sticker-prompt-input"
                  />
                  <div className="poll-options-row">
                    <input
                      type="text"
                      value={pollOptionA}
                      onChange={(e) => setPollOptionA(e.target.value)}
                      placeholder="Option 1"
                      maxLength={40}
                      className="poll-option-input"
                    />
                    <input
                      type="text"
                      value={pollOptionB}
                      onChange={(e) => setPollOptionB(e.target.value)}
                      placeholder="Option 2"
                      maxLength={40}
                      className="poll-option-input"
                    />
                  </div>
                </div>
              )}

              {activeWidget === 'quiz' && (
                <div className="story-sticker-overlay quiz-overlay">
                  <input
                    type="text"
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="Guess the answer!"
                    maxLength={150}
                    className="sticker-prompt-input"
                  />
                  <div className="quiz-options-list">
                    {[
                      { val: quizOptionA, set: setQuizOptionA, idx: 0 },
                      { val: quizOptionB, set: setQuizOptionB, idx: 1 },
                      { val: quizOptionC, set: setQuizOptionC, idx: 2 },
                    ].map(({ val, set, idx }) => (
                      <div
                        key={idx}
                        className={`quiz-option-row ${quizCorrectIndex === idx ? 'correct' : ''}`}
                        onClick={() => setQuizCorrectIndex(idx)}
                        title={quizCorrectIndex === idx ? 'Correct answer' : 'Click to set correct answer'}
                      >
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="quiz-option-input"
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeWidget === 'slider' && (
                <div className="story-sticker-overlay slider-overlay">
                  <input
                    type="text"
                    value={sliderQuestion}
                    onChange={(e) => setSliderQuestion(e.target.value)}
                    placeholder="How hot is this?"
                    maxLength={100}
                    className="sticker-prompt-input"
                  />
                  <div className="slider-track-preview">
                    <span className="slider-emoji">{sliderEmoji}</span>
                  </div>
                </div>
              )}

              {activeWidget === 'countdown' && (
                <div className="story-sticker-overlay countdown-overlay">
                  <div className="countdown-title">{countdownTitle || 'Upcoming Event'}</div>
                  <div className="countdown-timer-box">03d : 12h : 45m</div>
                </div>
              )}
            </div>
          );
        })()
      )}

      {/* 4. Link Sticker Overlay */}
      {(isLinkActive || (activeStickerType === 'link' && linkUrl.trim())) && (
        <div
          className={`story-sticker-overlay-wrapper ${draggingStickerKey === 'link' ? 'dragging' : ''} ${activeStickerType === 'link' ? 'selected' : ''}`}
          style={{
            left: `${stickerPositions.link.x}%`,
            top: `${stickerPositions.link.y}%`,
          }}
          onMouseDown={(e) => handleStickerPointerDown(e, 'link')}
          onTouchStart={(e) => handleStickerPointerDown(e, 'link')}
        >
          <button
            type="button"
            className="story-sticker-corner-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              setLinkUrl('');
              setLinkText('');
              if (activeStickerType === 'link') setActiveStickerType('none');
            }}
            title="Remove link"
            aria-label="Remove link"
          >
            <X size={12} strokeWidth={2.8} />
          </button>
          <div className="story-sticker-drag-handle" title="Drag to reposition link">
            <span className="story-sticker-drag-pill" />
          </div>
          <div className="story-sticker-overlay link-overlay">
            <LinkIcon size={14} />
            <span>{linkText || linkUrl.replace(/^https?:\/\//, '') || 'Visit Link'}</span>
          </div>
        </div>
      )}

      {/* 5. Location Sticker Overlay */}
      {(isLocationActive || (activeStickerType === 'location' && locationName.trim())) && (
        <div
          className={`story-sticker-overlay-wrapper ${draggingStickerKey === 'location' ? 'dragging' : ''} ${activeStickerType === 'location' ? 'selected' : ''}`}
          style={{
            left: `${stickerPositions.location.x}%`,
            top: `${stickerPositions.location.y}%`,
          }}
          onMouseDown={(e) => handleStickerPointerDown(e, 'location')}
          onTouchStart={(e) => handleStickerPointerDown(e, 'location')}
        >
          <button
            type="button"
            className="story-sticker-corner-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              setLocationName('');
              if (activeStickerType === 'location') setActiveStickerType('none');
            }}
            title="Remove location"
            aria-label="Remove location"
          >
            <X size={12} strokeWidth={2.8} />
          </button>
          <div className="story-sticker-drag-handle" title="Drag to reposition location">
            <span className="story-sticker-drag-pill" />
          </div>
          <div className="story-sticker-overlay location-overlay">
            <MapPin size={14} />
            <span>{locationName || 'Location'}</span>
          </div>
        </div>
      )}

      {/* 6. Hashtag Sticker Overlay */}
      {(isHashtagActive || (activeStickerType === 'hashtag' && hashtagTag.trim())) && (
        <div
          className={`story-sticker-overlay-wrapper ${draggingStickerKey === 'hashtag' ? 'dragging' : ''} ${activeStickerType === 'hashtag' ? 'selected' : ''}`}
          style={{
            left: `${stickerPositions.hashtag.x}%`,
            top: `${stickerPositions.hashtag.y}%`,
          }}
          onMouseDown={(e) => handleStickerPointerDown(e, 'hashtag')}
          onTouchStart={(e) => handleStickerPointerDown(e, 'hashtag')}
        >
          <button
            type="button"
            className="story-sticker-corner-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              setHashtagTag('');
              if (activeStickerType === 'hashtag') setActiveStickerType('none');
            }}
            title="Remove hashtag"
            aria-label="Remove hashtag"
          >
            <X size={12} strokeWidth={2.8} />
          </button>
          <div className="story-sticker-drag-handle" title="Drag to reposition hashtag">
            <span className="story-sticker-drag-pill" />
          </div>
          <div className="story-sticker-overlay hashtag-overlay">
            <span>#{hashtagTag ? hashtagTag.replace(/^#/, '') : 'hashtag'}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default StoryStickerOverlays;
