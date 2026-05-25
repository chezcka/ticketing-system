import React, { useRef, useState, useCallback, useEffect } from 'react';
import './TicketThread.css';

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconLock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const initials = (name) =>
  (name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const TicketThread = ({
  comments = [],
  loading = true,
  sending = false,
  error = null,
  currentUserId,
  isAgent = false,
  onSend,
}) => {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const threadRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom whenever comments change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Instant scroll on initial load once loading finishes
  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [loading]);

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;
    const draft = message;
    setMessage('');
    const ok = await onSend(draft, isInternal);
    if (!ok) setMessage(draft);
  }, [message, isInternal, onSend]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const visibleComments = comments.filter(c => {
    if (isAgent) return true;
    return !c.isInternal;
  });

  return (
    <div className="tt">
      {/* Error Banner */}
      {error && (
        <div className="tt__error">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Thread */}
      <div className="tt__thread" ref={threadRef}>
        {loading && visibleComments.length === 0 ? (
          <div className="tt__state">
            <span className="tt__spinner" />
            <p>Loading messages…</p>
          </div>
        ) : visibleComments.length === 0 ? (
          <div className="tt__state tt__state--empty">
            <p>No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          <>
            {visibleComments.map((c, i) => {
              const isMe = c.userId != null && String(c.userId) === String(currentUserId);
              const name = c.userName || c.userFullName || c.authorName || 'Unknown';

              return (
                <div
                  key={c.id ?? i}
                  className={[
                    'tt__msg',
                    isMe ? 'tt__msg--mine' : 'tt__msg--theirs',
                    c.isInternal ? 'tt__msg--internal' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {/* Avatar */}
                  <div
                    className={[
                      'tt__avatar',
                      isMe ? 'tt__avatar--me' : '',
                    ].filter(Boolean).join(' ')}
                    title={name}
                  >
                    {initials(name)}
                  </div>

                  <div className="tt__bubble-wrap">
                    <div className="tt__bubble-meta">
                      <span className="tt__author">{name}</span>
                      <span className="tt__time">{formatTime(c.createdAt)}</span>
                    </div>
                    <div className="tt__bubble">{c.content}</div>
                  </div>
                </div>
              );
            })}
            {/* Invisible anchor for auto-scroll */}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Compose Area */}
      <div className="tt__compose">
        {isAgent && (
          <div className="tt__compose-tabs">
            <button
              className={`tt__compose-tab${!isInternal ? ' tt__compose-tab--active' : ''}`}
              onClick={() => setIsInternal(false)}
            >
              <IconGlobe /> Reply to client
            </button>
            <button
              className={`tt__compose-tab tt__compose-tab--internal${
                isInternal ? ' tt__compose-tab--active tt__compose-tab--active-internal' : ''
              }`}
              onClick={() => setIsInternal(true)}
            >
              <IconLock /> Internal note
            </button>
          </div>
        )}

        <div className={`tt__compose-box${isInternal ? ' tt__compose-box--internal' : ''}`}>
          <textarea
            className="tt__compose-input"
            rows={4}
            placeholder={
              isAgent
                ? isInternal
                  ? 'Add an internal note (only agents can see this)…'
                  : 'Write a reply to the client…'
                : 'Write a message…'
            }
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKey}
            disabled={sending}
          />
          <div className="tt__compose-footer">
            <span className="tt__compose-hint">
              Enter to send · Shift+Enter for new line
            </span>
            <button
              className="tt__compose-send"
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? (
                <>
                  <span className="tt__spinner tt__spinner--sm" />
                  Sending…
                </>
              ) : (
                <>
                  <IconSend />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketThread;