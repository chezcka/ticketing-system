import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import TicketThread from '../components/Common/TicketThread';
import * as ticketService from '../services/ticketService';
import * as commentService from '../services/commentService';
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDateTime } from '../utils/formatters';
import './TicketDetailPage.css';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="m9 11 3 3L22 4"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconFlag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

// ─── Helper Functions ────────────────────────────────────────────────────────────

const getDisplayName = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'number') {
    console.warn('⚠️ Backend returned only user ID, not full object.');
    return null;
  }
  if (obj.fullName && typeof obj.fullName === 'string' && obj.fullName.trim()) {
    return obj.fullName;
  }
  if (obj.name && typeof obj.name === 'string' && obj.name.trim()) {
    return obj.name;
  }
  if ((obj.firstName || obj.lastName)) {
    const firstName = obj.firstName && typeof obj.firstName === 'string' ? obj.firstName.trim() : '';
    const lastName = obj.lastName && typeof obj.lastName === 'string' ? obj.lastName.trim() : '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
  }
  if (obj.email && typeof obj.email === 'string' && obj.email.trim()) {
    return obj.email;
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: errorToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ✅ LOAD BOTH IN PARALLEL - ONCE ON MOUNT
  useEffect(() => {
    console.log('🚀 TicketDetailPage mounted for ticket:', id);
    loadTicket();
    loadComments();
  }, [id]);

  const loadTicket = async () => {
    try {
      setTicketLoading(true);
      setError('');
      
      const data = await ticketService.getTicketById(id);
      console.log('✅ Ticket loaded:', data);
      setTicket(data);
    } catch (err) {
      console.error('❌ Error loading ticket:', err);
      const msg = err.message || 'Failed to load ticket';
      setError(msg);
      errorToast(msg);
    } finally {
      setTicketLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      console.log('📥 Loading comments for ticket:', id);
      const data = await commentService.getCommentsByTicket(id);
      console.log('✅ Comments loaded:', data);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      const updated = await ticketService.updateTicketStatus(id, newStatus);
      setTicket(updated);
      success('Ticket status updated!');
      showMessage('success', 'Ticket status updated!');
    } catch (err) {
      console.error('❌ Error updating status:', err);
      errorToast('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  // ✅ FIX: After adding comment, reload comments from database
  const handleAddComment = async (commentText, isInternal) => {
    setCommentLoading(true);
    try {
      console.log('📤 Adding comment...');
      const newComment = await commentService.addComment(id, commentText, isInternal);
      console.log('✅ Comment added:', newComment);
      
      // ✅ CRITICAL: Reload all comments from database
      console.log('🔄 Reloading all comments...');
      const updatedComments = await commentService.getCommentsByTicket(id);
      console.log('✅ Comments reloaded:', updatedComments);
      setComments(Array.isArray(updatedComments) ? updatedComments : []);
      
      success('Comment added!');
      showMessage('success', 'Comment added successfully!');
      return true;
    } catch (err) {
      console.error('❌ Failed to add comment:', err);
      errorToast('Failed to add comment');
      return false;
    } finally {
      setCommentLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Show error state only if BOTH failed
  if (error && ticketLoading && commentsLoading) {
    return (
      <MainLayout>
        <div className="tdp__error">
          <IconAlertCircle />
          <p>{error || 'Failed to load ticket'}</p>
        </div>
      </MainLayout>
    );
  }

  // Wait for ticket to load (comments can load independently)
  if (ticketLoading) {
    return (
      <MainLayout>
        <div className="tdp__loading">
          <span className="tdp__spinner" />
          <p>Loading ticket details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!ticket) {
    return (
      <MainLayout>
        <div className="tdp__error">
          <IconAlertCircle />
          <p>Ticket not found</p>
        </div>
      </MainLayout>
    );
  }

  // ✅ Get assigned agent name
  const assignedAgentName = ticket.assignedTo ? getDisplayName(ticket.assignedTo) : null;

  // ✅ Get formatted labels and colors
  const statusLabel = getStatusLabel(ticket.status);
  const statusColor = getStatusColor(ticket.status);
  const priorityLabel = getPriorityLabel(ticket.priority);
  const priorityColor = getPriorityColor(ticket.priority);

  return (
    <MainLayout>
      <div className="tdp">
        {/* ── Toast ── */}
        {message.text && (
          <div className={`tdp__toast tdp__toast--${message.type}`}>
            {message.type === 'success' ? <IconCheckCircle /> : <IconAlertCircle />}
            {message.text}
          </div>
        )}

        {/* ── Header ── */}
        <div className="tdp__header">
          <button
            className="tdp__back-btn"
            onClick={() => navigate('/tickets')}
            title="Back to tickets"
            aria-label="Back to tickets"
          >
            <IconBack />
          </button>
          <div className="tdp__header-title">
            <h1 className="tdp__title">{ticket.title}</h1>
            <p className="tdp__ticket-id">Ticket #{ticket.id}</p>
          </div>
        </div>

        {/* ── Container ── */}
        <div className="tdp__container">
          {/* ── Main Content ── */}
          <div className="tdp__main">
            {/* Info Grid */}
            <div className="tdp__info-grid">
              <div className="tdp__info-item">
                <label><IconFlag width={14} height={14} /> Status</label>
                <div
                  className="tdp__status-badge"
                  style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                  title={`Status: ${statusLabel}`}
                >
                  {statusLabel}
                </div>
              </div>
              <div className="tdp__info-item">
                <label><IconFlag width={14} height={14} /> Priority</label>
                <div
                  className="tdp__priority-badge"
                  style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}
                  title={`Priority: ${priorityLabel}`}
                >
                  {priorityLabel}
                </div>
              </div>
              <div className="tdp__info-item">
                <label><IconClock width={14} height={14} /> Created</label>
                <p>{formatDateTime(ticket.createdAt)}</p>
              </div>
              <div className="tdp__info-item">
                <label><IconClock width={14} height={14} /> Updated</label>
                <p>{formatDateTime(ticket.updatedAt)}</p>
              </div>
              {ticket.dueDate && (
                <div className="tdp__info-item">
                  <label><IconClock width={14} height={14} /> Due Date</label>
                  <p>{formatDateTime(ticket.dueDate)}</p>
                </div>
              )}
              {ticket.category && (
                <div className="tdp__info-item">
                  <label><IconInfo width={14} height={14} /> Category</label>
                  <p>{ticket.category}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="tdp__section">
              <h2 className="tdp__section-title">Description</h2>
              <div className="tdp__description">{ticket.description}</div>
            </div>

            {/* Resolution */}
            {ticket.resolution && (
              <div className="tdp__section">
                <h2 className="tdp__section-title">Resolution</h2>
                <div className="tdp__resolution">{ticket.resolution}</div>
              </div>
            )}

            {/* Chat Thread - SCROLLABLE SECTION */}
            <div className="tdp__section tdp__section--chat">
              <h2 className="tdp__section-title">Comments & Messages ({comments.length})</h2>
              <TicketThread
                comments={comments}
                loading={commentsLoading}
                sending={commentLoading}
                currentUserId={user?.id}
                isAgent={user?.role === 'SUPPORT_AGENT'}
                onSend={handleAddComment}
              />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="tdp__sidebar">
            {/* Status Control */}
            <div className="tdp__card">
              <h3 className="tdp__card-title">Update Status</h3>
              <select
                value={ticket.status || 'OPEN'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusLoading}
                className="tdp__status-select"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Assigned To */}
            <div className="tdp__card">
              <h3 className="tdp__card-title">Assigned To</h3>
              <div className="tdp__assigned-user">
                <IconUser width={16} height={16} />
                <span title={assignedAgentName ? `Assigned to: ${assignedAgentName}` : 'Not assigned'}>
                  {assignedAgentName || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="tdp__card">
              <h3 className="tdp__card-title">Ticket Stats</h3>
              <div className="tdp__stats">
                <div className="tdp__stat">
                  <span className="tdp__stat-label">Total Messages</span>
                  <span className="tdp__stat-value">{comments.length}</span>
                </div>
                <div className="tdp__stat">
                  <span className="tdp__stat-label">Status</span>
                  <span className="tdp__stat-value">{statusLabel}</span>
                </div>
                <div className="tdp__stat">
                  <span className="tdp__stat-label">Priority</span>
                  <span className="tdp__stat-value">{priorityLabel}</span>
                </div>
              </div>
            </div>

            {/* More Info */}
            <div className="tdp__card">
              <h3 className="tdp__card-title">More Info</h3>
              <div className="tdp__info-list">
                <div className="tdp__info-row">
                  <span className="tdp__info-label">Ticket ID</span>
                  <span className="tdp__info-value">{ticket.id}</span>
                </div>
                {ticket.category && (
                  <div className="tdp__info-row">
                    <span className="tdp__info-label">Category</span>
                    <span className="tdp__info-value">{ticket.category}</span>
                  </div>
                )}
                <div className="tdp__info-row">
                  <span className="tdp__info-label">Created</span>
                  <span className="tdp__info-value">
                    {formatDateTime(ticket.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}