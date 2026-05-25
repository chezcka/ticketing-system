import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import { formatDateTime, getStatusColor } from '../utils/formatters';
import TicketThread from '../components/Common/TicketThread';
import * as ticketService from '../services/ticketService';
import * as commentService from '../services/commentService';
import Pagination from '../components/Common/Pagination';
import './TicketListPage.css';

// ── SVG Icons ────────────────────────────────────────────────
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconMessageCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TicketIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2M13 17v2M13 11v2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ── Priority badge ────────────────────────────────────────────
const PRIORITY_STYLES = {
  low:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  medium:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  high:     { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  critical: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

function PriorityBadge({ priority }) {
  const key = priority?.toLowerCase() || 'low';
  const s = PRIORITY_STYLES[key] || PRIORITY_STYLES.low;
  return (
    <span className="priority-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {priority}
    </span>
  );
}

// ── Create Ticket Modal ───────────────────────────────────────
function CreateTicketModal({ onClose, onTicketCreated }) {
  const { error: errorToast, success: successToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      if (!formData.title.trim()) {
        setErrorMessage('Title is required');
        setSubmitting(false);
        return;
      }
      if (!formData.description.trim()) {
        setErrorMessage('Description is required');
        setSubmitting(false);
        return;
      }

      const newTicket = await ticketService.createTicket({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      });

      setSuccessMessage(`Ticket #${newTicket.id} created successfully!`);
      successToast(`Ticket #${newTicket.id} created!`);

      setTimeout(() => {
        onTicketCreated();
        onClose();
      }, 1500);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create ticket';
      setErrorMessage(message);
      errorToast(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="tlp__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tlp__modal tlp__modal--create" onClick={e => e.stopPropagation()}>

        <div className="tlp__modal-head">
          <div>
            <h2>Create New Ticket</h2>
            <p className="tlp__modal-subtitle">Fill in the details to open a support ticket</p>
          </div>
          <button className="tlp__modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {successMessage && (
          <div className="tlp__alert tlp__alert--success">
            <IconCheckCircle /> <p>{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="tlp__alert tlp__alert--error">
            <IconAlertCircle /> <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="tlp__form">
          <div className="tlp__field">
            <label>Title <span className="tlp__required">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Briefly describe the issue"
              disabled={submitting}
              maxLength="200"
              required
            />
            <small className="tlp__char-count">{formData.title.length}/200</small>
          </div>

          <div className="tlp__field">
            <label>Description <span className="tlp__required">*</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide full details about the issue…"
              rows="5"
              disabled={submitting}
              maxLength="1000"
              required
            />
            <small className="tlp__char-count">{formData.description.length}/1000</small>
          </div>

          <div className="tlp__form-row">
            <div className="tlp__field">
              <label>Category</label>
              <div className="tlp__select-wrap">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={submitting}
                >
                  <option>General</option>
                  <option>Technical</option>
                  <option>Billing</option>
                  <option>Account</option>
                  <option>Other</option>
                </select>
                <IconChevron />
              </div>
            </div>
            <div className="tlp__field">
              <label>Priority</label>
              <div className="tlp__select-wrap">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  disabled={submitting}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <IconChevron />
              </div>
            </div>
          </div>

          <div className="tlp__form-actions">
            <button type="button" className="tlp__btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="tlp__btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Details Modal ─────────────────────────────────────────────
function DetailsModal({ ticket, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!ticket) return null;

  return (
    <div className="tlp__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tlp__modal" onClick={e => e.stopPropagation()}>

        <div className="tlp__modal-head">
          <div>
            <span className="tlp__modal-id">#{ticket.id}</span>
            <h2>{ticket.title}</h2>
            <div className="tlp__modal-badges">
              <PriorityBadge priority={ticket.priority} />
              <span className="status-badge" style={{ background: getStatusColor(ticket.status) }}>
                {ticket.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button className="tlp__modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="tlp__detail">
          <div className="tlp__detail-grid">
            <div className="tlp__detail-cell">
              <label>Status</label>
              <span className="status-badge" style={{ background: getStatusColor(ticket.status) }}>
                {ticket.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="tlp__detail-cell">
              <label>Priority</label>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="tlp__detail-cell">
              <label>Created</label>
              <span className="tlp__detail-val">{formatDateTime(ticket.createdAt)}</span>
            </div>
            {ticket.assignedToName && (
              <div className="tlp__detail-cell">
                <label>Assigned To</label>
                <span className="tlp__detail-val">{ticket.assignedToName}</span>
              </div>
            )}
          </div>

          <div className="tlp__detail-desc">
            <label>Description</label>
            <p>{ticket.description || <em>No description provided.</em>}</p>
          </div>

          <div className="tlp__form-actions">
            <button className="tlp__btn-secondary" onClick={onClose}>Close</button>
            <Link to={`/tickets/${ticket.id}`} className="tlp__btn-primary">
              <LinkIcon /> Open Full Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chat Modal ────────────────────────────────────────────────
function ChatModal({ ticket, user, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const { success, error: errorToast } = useToast();

  useEffect(() => {
    loadComments();
    document.body.style.overflow = 'hidden';

    const interval = setInterval(() => {
      loadComments();
    }, 2000);

    return () => {
      document.body.style.overflow = '';
      clearInterval(interval);
    };
  }, [ticket?.id]);

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      setError(null);
      const data = await commentService.getCommentsByTicket(ticket.id);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSend = async (commentText, isInternal) => {
    setSending(true);
    try {
      const newComment = await commentService.addComment(ticket.id, commentText, isInternal);
      setComments(prev => [...prev, newComment]);
      success('Comment added!');
      return true;
    } catch (err) {
      console.error('Failed to add comment:', err);
      errorToast('Failed to add comment');
      return false;
    } finally {
      setSending(false);
    }
  };

  if (!ticket) return null;

  return (
    <div className="tlp__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tlp__modal tlp__modal--comms" onClick={e => e.stopPropagation()}>

        <div className="tlp__modal-head">
          <div>
            <span className="tlp__modal-id">#{ticket.id}</span>
            <h2>{ticket.title}</h2>
            <div className="tlp__modal-badges">
              <PriorityBadge priority={ticket.priority} />
              <span className="status-badge" style={{ background: getStatusColor(ticket.status) }}>
                {ticket.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button className="tlp__modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="tlp__thread-wrap">
          <TicketThread
            comments={comments}
            loading={commentsLoading}
            sending={sending}
            error={error}
            currentUserId={user?.id}
            isAgent={false}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function TicketListPage() {
  const { user } = useAuth();
  const { error: errorToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [allTickets, setAllTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    let filtered = [...allTickets];
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }
    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [allTickets, filters]);

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError('');
      let response;

      if (user.role === 'CLIENT') {
        response = await ticketService.getUserTickets();
      } else if (user.role === 'SUPPORT_AGENT') {
        response = await ticketService.getAssignedTickets();
      } else {
        response = await ticketService.getAllTickets();
      }

      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data?.content && Array.isArray(response.data.content)) {
        data = response.data.content;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response?.content && Array.isArray(response.content)) {
        data = response.content;
      }

      setAllTickets(data);
    } catch (err) {
      console.error('Error loading tickets:', err);
      const message = 'Failed to load tickets';
      setError(message);
      errorToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const handleOpenChat = (ticket) => {
    setSelectedTicket(ticket);
    setShowChatModal(true);
  };

  const handleClearFilters = () => {
    setFilters({ status: '', priority: '' });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (isLoading) return <MainLayout><LoadingSpinner message="Loading tickets..." /></MainLayout>;

  return (
    <MainLayout>
      <div className="tickets-list-page">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">All Tickets</h1>
            <span className="ticket-count-badge">{filteredTickets.length}</span>
          </div>
          {user?.role === 'CLIENT' && (
            <button className="btn-create" onClick={() => setShowCreateModal(true)}>
              <PlusIcon />
              New Ticket
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} />}

        <div className="filters-bar">
          <div className="filters-left">
            <span className="filters-label"><FilterIcon /> Filter</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="filter-select"
            >
              <option value="">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          {(filters.status || filters.priority) && (
            <button className="btn-clear-filters" onClick={handleClearFilters}>
              <XIcon /> Clear Filters
            </button>
          )}
        </div>

        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap"><TicketIcon /></div>
            <p className="empty-title">No tickets found</p>
            <p className="empty-subtitle">
              {filters.status || filters.priority
                ? 'Try adjusting your filters.'
                : user?.role === 'CLIENT'
                  ? 'Create your first support ticket to get started.'
                  : 'No tickets have been submitted yet.'}
            </p>
            {user?.role === 'CLIENT' && !filters.status && !filters.priority && (
              <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                <PlusIcon /> New Ticket
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTickets.map(ticket => (
                    <tr key={ticket.id} className="ticket-row">
                      <td><span className="ticket-id">#{ticket.id}</span></td>
                      <td><span className="ticket-title">{ticket.title}</span></td>
                      <td><PriorityBadge priority={ticket.priority} /></td>
                      <td>
                        <span className="status-badge" style={{ background: getStatusColor(ticket.status) }}>
                          {ticket.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td><span className="ticket-date">{formatDateTime(ticket.createdAt)}</span></td>
                      <td className="tlp__cell-actions">
                        <button
                          className="tlp__btn-action tlp__btn-chat"
                          onClick={() => handleOpenChat(ticket)}
                          title="Message"
                        >
                          <IconMessageCircle />
                        </button>
                        <button
                          className="tlp__btn-action tlp__btn-details"
                          onClick={() => handleOpenDetails(ticket)}
                          title="Details"
                        >
                          <IconFileText />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </div>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onTicketCreated={loadTickets}
        />
      )}

      {showDetailsModal && selectedTicket && (
        <DetailsModal ticket={selectedTicket} onClose={() => setShowDetailsModal(false)} />
      )}

      {showChatModal && selectedTicket && (
        <ChatModal ticket={selectedTicket} user={user} onClose={() => setShowChatModal(false)} />
      )}
    </MainLayout>
  );
}