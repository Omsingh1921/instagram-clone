import React from 'react';
import {
  Bell,
  BellRing,
  ExternalLink,
  MapPin,
  Hash,
  Camera,
} from 'lucide-react';

export const StoryInteractiveWidgets = ({
  currentStory,
  isMyStory,
  handleOpenQuestionResponses,
  hasAnsweredQuestion,
  questionAnswer,
  setQuestionAnswer,
  setIsPaused,
  showQuestionResponses,
  showViewers,
  handleSubmitQuestionAnswer,
  pollState,
  votingPoll,
  handleVotePoll,
  quizState,
  votingQuiz,
  handleVoteQuiz,
  sliderState,
  sliderValue,
  setSliderValue,
  votingSlider,
  handleVoteSlider,
  countdownState,
  timeLeft,
  handleToggleCountdownReminder,
  togglingReminder,
  onClose,
  navigate,
}) => {
  return (
    <>
      {/* Question Sticker Overlay */}
      {currentStory?.question && (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '260px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            textAlign: 'center',
            zIndex: 25,
            border: '1px solid rgba(0,0,0,0.08)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              background: '#f5f5f7',
              padding: '12px 14px',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#8e8e8e',
                fontWeight: 600,
              }}
            >
              Question
            </span>
            <p
              style={{
                margin: '4px 0 0',
                fontWeight: 700,
                color: '#1a1a1a',
                fontSize: '14px',
                wordBreak: 'break-word',
              }}
            >
              {currentStory.question.prompt || 'Ask me a question'}
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: '#ffffff' }}>
            {isMyStory ? (
              <button
                type="button"
                onClick={handleOpenQuestionResponses}
                style={{
                  width: '100%',
                  background: '#0095f6',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                View Responses ({currentStory.question.totalResponses || 0})
              </button>
            ) : hasAnsweredQuestion ? (
              <div
                style={{
                  color: '#00ba7c',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '4px 0',
                }}
              >
                ✓ Response sent!
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Type something..."
                  value={questionAnswer}
                  onChange={(e) => setQuestionAnswer(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => !showQuestionResponses && !showViewers && setIsPaused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitQuestionAnswer();
                  }}
                  style={{
                    flex: 1,
                    background: '#f0f2f5',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    outline: 'none',
                    color: '#1a1a1a',
                  }}
                />
                <button
                  type="button"
                  disabled={!questionAnswer.trim()}
                  onClick={handleSubmitQuestionAnswer}
                  style={{
                    background: questionAnswer.trim() ? '#0095f6' : '#cccccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: questionAnswer.trim() ? 'pointer' : 'default',
                  }}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Story Poll Sticker */}
      {pollState && (
        <div
          className="story-poll-sticker"
          style={{
            position: 'absolute',
            top: currentStory.question ? '68%' : '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '260px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            textAlign: 'center',
            zIndex: 25,
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '14px 16px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontWeight: 700,
              color: '#1a1a1a',
              fontSize: '15px',
              wordBreak: 'break-word',
              lineHeight: 1.3,
            }}
          >
            {pollState.question || 'Poll'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Option A */}
            <button
              type="button"
              disabled={votingPoll || pollState.userVote != null || isMyStory}
              onClick={() => handleVotePoll(1)}
              style={{
                position: 'relative',
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: pollState.userVote === 1 ? '2px solid #0095f6' : '1px solid rgba(0,0,0,0.1)',
                background: '#f8f9fa',
                overflow: 'hidden',
                cursor: pollState.userVote != null || isMyStory ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                fontWeight: 600,
                fontSize: '13px',
                color: '#1a1a1a',
              }}
            >
              {(pollState.userVote != null || isMyStory) && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.round(pollState.percentA || 0)}%`,
                    background: pollState.userVote === 1 ? 'rgba(0,149,246,0.22)' : 'rgba(0,0,0,0.07)',
                    transition: 'width 0.4s ease',
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {pollState.userVote === 1 ? '✓ ' : ''}
                {pollState.optionA || 'Yes'}
              </span>
              {(pollState.userVote != null || isMyStory) && (
                <span style={{ position: 'relative', zIndex: 1, fontWeight: 700 }}>
                  {Math.round(pollState.percentA || 0)}%
                </span>
              )}
            </button>

            {/* Option B */}
            <button
              type="button"
              disabled={votingPoll || pollState.userVote != null || isMyStory}
              onClick={() => handleVotePoll(2)}
              style={{
                position: 'relative',
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: pollState.userVote === 2 ? '2px solid #0095f6' : '1px solid rgba(0,0,0,0.1)',
                background: '#f8f9fa',
                overflow: 'hidden',
                cursor: pollState.userVote != null || isMyStory ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                fontWeight: 600,
                fontSize: '13px',
                color: '#1a1a1a',
              }}
            >
              {(pollState.userVote != null || isMyStory) && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.round(pollState.percentB || 0)}%`,
                    background: pollState.userVote === 2 ? 'rgba(0,149,246,0.22)' : 'rgba(0,0,0,0.07)',
                    transition: 'width 0.4s ease',
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {pollState.userVote === 2 ? '✓ ' : ''}
                {pollState.optionB || 'No'}
              </span>
              {(pollState.userVote != null || isMyStory) && (
                <span style={{ position: 'relative', zIndex: 1, fontWeight: 700 }}>
                  {Math.round(pollState.percentB || 0)}%
                </span>
              )}
            </button>
          </div>

          {(pollState.userVote != null || isMyStory) && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#8e8e8e', fontWeight: 500 }}>
              {pollState.totalVotes || 0} {pollState.totalVotes === 1 ? 'vote' : 'votes'}
            </div>
          )}
        </div>
      )}

      {/* Interactive Quiz Sticker */}
      {quizState && (
        <div
          className="story-interactive-sticker story-quiz-sticker"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#8e8e8e',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Quiz
          </div>
          <p
            style={{
              margin: '0 0 10px',
              fontWeight: 700,
              color: '#1a1a1a',
              fontSize: '14px',
              lineHeight: 1.3,
            }}
          >
            {quizState.question || 'Guess the answer!'}
          </p>

          {[
            { idx: 0, text: quizState.optionA, pct: quizState.percentA },
            { idx: 1, text: quizState.optionB, pct: quizState.percentB },
            { idx: 2, text: quizState.optionC, pct: quizState.percentC },
            { idx: 3, text: quizState.optionD, pct: quizState.percentD },
          ]
            .filter((opt) => Boolean(opt.text))
            .map((opt) => {
              const hasVoted = quizState.userVote != null || isMyStory;
              const isSelected = quizState.userVote === opt.idx;
              const isCorrect = opt.idx === quizState.correctOptionIndex;
              let optClass = 'story-quiz-option';
              if (hasVoted) {
                if (isCorrect) optClass += ' correct';
                else if (isSelected) optClass += ' selected-wrong';
              }

              return (
                <button
                  key={opt.idx}
                  type="button"
                  className={optClass}
                  disabled={hasVoted || votingQuiz}
                  onClick={() => handleVoteQuiz(opt.idx)}
                >
                  {hasVoted && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${Math.round(opt.pct || 0)}%`,
                        background: isCorrect ? 'rgba(0,186,124,0.18)' : 'rgba(0,0,0,0.06)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {hasVoted && isCorrect ? '✓ ' : ''}
                    {opt.text}
                  </span>
                  {hasVoted && (
                    <span style={{ position: 'relative', zIndex: 1, fontWeight: 700 }}>
                      {Math.round(opt.pct || 0)}%
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}

      {/* Interactive Emoji Slider Sticker */}
      {sliderState && (
        <div
          className="story-interactive-sticker story-slider-sticker"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="story-slider-emoji">{sliderState.emoji || '🔥'}</span>
          <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#1a1a1a', fontSize: '14px' }}>
            {sliderState.question || 'How hot is this?'}
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            disabled={sliderState.userVote != null || isMyStory || votingSlider}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            onMouseUp={() => handleVoteSlider(sliderValue)}
            onTouchEnd={() => handleVoteSlider(sliderValue)}
            className="story-slider-input"
          />
          {(sliderState.userVote != null || isMyStory) && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0095f6',
              }}
            >
              Average: {Math.round(sliderState.averageRating || 0)}% ({sliderState.totalVotes || 0} votes)
            </div>
          )}
        </div>
      )}

      {/* Interactive Countdown Sticker */}
      {countdownState && (
        <div
          className="story-interactive-sticker story-countdown-sticker"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="story-countdown-title">{countdownState.title || 'Event Countdown'}</div>
          <div className="story-countdown-digits">
            <div className="story-countdown-box">
              <span className="story-countdown-num">{timeLeft?.days ?? '0'}</span>
              <span className="story-countdown-unit">Days</span>
            </div>
            <div className="story-countdown-box">
              <span className="story-countdown-num">{timeLeft?.hours ?? '0'}</span>
              <span className="story-countdown-unit">Hours</span>
            </div>
            <div className="story-countdown-box">
              <span className="story-countdown-num">{timeLeft?.minutes ?? '0'}</span>
              <span className="story-countdown-unit">Mins</span>
            </div>
            <div className="story-countdown-box">
              <span className="story-countdown-num">{timeLeft?.seconds ?? '0'}</span>
              <span className="story-countdown-unit">Secs</span>
            </div>
          </div>

          {!isMyStory && (
            <button
              type="button"
              className="story-countdown-btn"
              onClick={handleToggleCountdownReminder}
              disabled={togglingReminder}
            >
              {countdownState.isSubscribed ? (
                <>
                  <BellRing size={14} />
                  <span>Reminder Set</span>
                </>
              ) : (
                <>
                  <Bell size={14} />
                  <span>Remind Me</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Link Sticker(s) */}
      {(currentStory?.links?.length
        ? currentStory.links
        : currentStory?.link
        ? [currentStory.link]
        : []
      ).map((lnk, idx) => (
        <a
          key={lnk.id || idx}
          href={lnk.url}
          target="_blank"
          rel="noopener noreferrer"
          className="story-link-pill"
          style={
            lnk.xPercent != null && lnk.yPercent != null
              ? { left: `${lnk.xPercent}%`, top: `${lnk.yPercent}%` }
              : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} />
          <span>{lnk.title || lnk.stickerText || 'Visit Link'}</span>
        </a>
      ))}

      {/* Location Sticker(s) */}
      {(currentStory?.locations?.length
        ? currentStory.locations
        : currentStory?.location
        ? [currentStory.location]
        : []
      ).map((loc, idx) => (
        <div
          key={loc.id || idx}
          className="story-location-badge"
          style={
            loc.xPercent != null && loc.yPercent != null
              ? { left: `${loc.xPercent}%`, top: `${loc.yPercent}%` }
              : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin size={13} color="#ff4d4f" />
          <span>{loc.locationName || loc.name}</span>
        </div>
      ))}

      {/* Hashtag Sticker(s) */}
      {(currentStory?.hashtags?.length
        ? currentStory.hashtags
        : currentStory?.hashtag
        ? [currentStory.hashtag]
        : []
      ).map((tag, idx) => (
        <div
          key={tag.id || idx}
          className="story-hashtag-badge"
          style={
            tag.xPercent != null && tag.yPercent != null
              ? { left: `${tag.xPercent}%`, top: `${tag.yPercent}%` }
              : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          <Hash size={13} />
          <span>#{String(tag.hashtag || tag.tag).replace(/^#/, '')}</span>
        </div>
      ))}

      {/* Mention Stickers Overlay */}
      {currentStory?.mentions && currentStory.mentions.length > 0 && (
        <div className="story-mentions-container" onClick={(e) => e.stopPropagation()}>
          {currentStory.mentions.map((m, idx) => {
            const hasPos = m.xPercent != null && m.yPercent != null;
            return (
              <div
                key={m.userId || m.username || idx}
                className="story-mention-badge"
                style={
                  hasPos
                    ? {
                        position: 'absolute',
                        left: `${m.xPercent}%`,
                        top: `${m.yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                      }
                    : {}
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (m.userId || m.username) {
                    onClose?.();
                    navigate?.(`/profile/${m.userId || m.username}`);
                  }
                }}
                title={`View @${m.username || 'user'}`}
              >
                <span>@{m.username}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Yours Sticker */}
      {currentStory?.addYours && (
        <div className="story-add-yours-sticker" onClick={(e) => e.stopPropagation()}>
          <div className="story-add-yours-header">
            <Camera size={12} />
            <span>Add Yours</span>
          </div>
          <p
            style={{
              margin: '4px 0 6px',
              fontWeight: 700,
              color: '#1a1a1a',
              fontSize: '13px',
            }}
          >
            {currentStory.addYours.prompt}
          </p>
          <span style={{ fontSize: '11px', color: '#8e8e8e' }}>
            {currentStory.addYours.totalEntries || 0} responses
          </span>
        </div>
      )}
    </>
  );
};

export default StoryInteractiveWidgets;
