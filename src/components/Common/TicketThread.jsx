import React, { useRef, useEffect, useState } from 'react';
import './TicketThread.css';

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
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
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const initials = (name) =>
  (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const TicketThread = ({
  comments = [],
  loading = false,
  sending = false,
  error = null,
  currentUserId,
  isAgent = false,
  onSend,
}) => {
  const [message, setMessage]       = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const bottomRef                   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const draft = message;
    setMessage('');
    const ok = await onSend(draft, isInternal);
    if (!ok) setMessage(draft);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="tt">

      {/* ── Error banner ── */}
      {error && (
        <div className="tt__error">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="tt__thread">
        {loading ? (
          <div className="tt__state">
            <span className="tt__spinner" />
            <p>Loading messages…</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="tt__state tt__state--empty">
            <p>No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          comments.map((c, i) => {
            const isMe = c.userId != null && String(c.userId) === String(currentUserId);
            const name = c.userName || c.userFullName || c.authorName || 'Unknown';
            const showOnRight = isMe;

            return (
              <div
                key={c.id ?? i}
                className={[
                  'tt__msg',
                  showOnRight ? 'tt__msg--mine' : 'tt__msg--theirs',
                  c.isInternal ? 'tt__msg--internal' : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Left avatar — only for messages from others */}
                {!showOnRight && (
                  <div className="tt__avatar" title={name}>
                    {initials(name)}
                  </div>
                )}

                <div className="tt__bubble-wrap">
                  <div className="tt__bubble-meta">
                    {!showOnRight && (
                      <span className="tt__author">{name}</span>
                    )}
                    {c.isInternal && isAgent && (
                      <span className="tt__internal-badge">
                        <IconLock /> Internal
                      </span>
                    )}
                    <span className="tt__time">{formatTime(c.createdAt)}</span>
                  </div>
                  <div className="tt__bubble">{c.content}</div>
                </div>

                {/* Right avatar — only for the current user's messages */}
                {showOnRight && (
                  <div className="tt__avatar tt__avatar--me" title={name}>
                    {initials(name)}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Compose ── */}
      <div className="tt__compose">
        {/* Agent-only tab switcher: Reply to client / Internal note */}
        {isAgent && (
          <div className="tt__compose-tabs">
            <button
              className={`tt__compose-tab${!isInternal ? ' tt__compose-tab--active' : ''}`}
              onClick={() => setIsInternal(false)}
            >
              <IconGlobe /> Reply to client
            </button>
            <button
              className={`tt__compose-tab tt__compose-tab--internal${isInternal ? ' tt__compose-tab--active tt__compose-tab--active-internal' : ''}`}
              onClick={() => setIsInternal(true)}
            >
              <IconLock /> Internal note
            </button>
          </div>
        )}

        <div className={`tt__compose-box${isInternal ? ' tt__compose-box--internal' : ''}`}>
          <textarea
            className="tt__compose-input"
            rows={3}
            placeholder={
              isAgent
                ? (isInternal
                    ? 'Add an internal note (only agents can see this)…'
                    : 'Write a reply to the client…')
                : 'Write a message…'
            }
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKey}
            disabled={sending}
          />
          <div className="tt__compose-footer">
            <span className="tt__compose-hint">Enter to send · Shift+Enter for new line</span>
            <button
              className="tt__compose-send"
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? <span className="tt__spinner tt__spinner--sm" /> : <IconSend />}
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TicketThread;