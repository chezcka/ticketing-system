import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import { formatDateTime, getStatusColor } from '../utils/formatters';
import * as ticketService from '../services/ticketService';
import './TicketListPage.css';

// ── SVG Icons ────────────────────────────────────────────────
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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

// ── Ticket Detail Modal ───────────────────────────────────────
function TicketModal({ ticket, onClose }) {
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
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-ticket-id">#{ticket.id}</span>
            <h2 className="modal-title">{ticket.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Badges row */}
        <div className="modal-badges">
          <PriorityBadge priority={ticket.priority} />
          <span
            className="status-badge"
            style={{ background: getStatusColor(ticket.status) }}
          >
            {ticket.status?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Meta row */}
        <div className="modal-meta">
          <span className="modal-meta-item">
            <CalendarIcon />
            Created {formatDateTime(ticket.createdAt)}
          </span>
          {ticket.assignedToName && (
            <span className="modal-meta-item">
              <UserIcon />
              Assigned to {ticket.assignedToName}
            </span>
          )}
          {ticket.createdByName && (
            <span className="modal-meta-item">
              <UserIcon />
              By {ticket.createdByName}
            </span>
          )}
        </div>

        <div className="modal-divider" />

        {/* Description */}
        <div className="modal-section">
          <p className="modal-section-label">Description</p>
          <p className="modal-description">
            {ticket.description || <span className="modal-empty">No description provided.</span>}
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Close</button>
          <Link to={`/tickets/${ticket.id}`} className="modal-open-btn">
            <LinkIcon /> Open full page
          </Link>
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
  const [filters, setFilters] = useState({ status: '', priority: '' });

  useEffect(() => {
    loadTickets();
  }, []);

  // Apply filters whenever allTickets or filters change
  useEffect(() => {
    let filtered = [...allTickets];

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    setFilteredTickets(filtered);
  }, [allTickets, filters]);

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

      // Extract array from various response formats
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

  const handleView = useCallback((ticket) => setSelectedTicket(ticket), []);
  const handleCloseModal = useCallback(() => setSelectedTicket(null), []);

  const handleClearFilters = () => {
    setFilters({ status: '', priority: '' });
  };

  if (isLoading) return <MainLayout><LoadingSpinner message="Loading tickets..." /></MainLayout>;

  return (
    <MainLayout>
      <div className="tickets-list-page">

        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">All Tickets</h1>
            <span className="ticket-count-badge">{filteredTickets.length}</span>
          </div>
          {user?.role === 'CLIENT' && (
            <Link to="/tickets/create" className="btn-create">
              <PlusIcon />
              New Ticket
            </Link>
          )}
        </div>

        {error && <Alert type="error" message={error} />}

        {/* Filters */}
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

        {/* Table / Empty */}
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
              <Link to="/tickets/create" className="btn-create">
                <PlusIcon /> New Ticket
              </Link>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
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
                    <td>
                      <button className="btn-view" onClick={() => handleView(ticket)}>
                        <EyeIcon /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={handleCloseModal} />
      )}
    </MainLayout>
  );
}