import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { getUserTickets, createTicket } from '../../services/ticketService';
import { useTicketComments } from '../../hooks/useTicketComments';
import TicketThread from '../Common/TicketThread';
import './ClientDashboard.css';

// ─── SVG Icons (unchanged) ────────────────────────────────────────────────

const IconTotal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2M13 17v2M13 11v2"/>
  </svg>
);
const IconOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconInProgress = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);
const IconResolved = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IconTicketEmpty = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2M13 17v2M13 11v2"/>
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

// ─── Component ────────────────────────────────────────────────────────────

const ClientDashboard = ({ user }) => {
  const [tickets, setTickets]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal]   = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage]     = useState('');
  const [formData, setFormData]             = useState({
    title: '', description: '', category: 'General', priority: 'MEDIUM',
  });

  // ✅ TicketThread hook
  const {
    comments, loading: commentsLoading, sending, error: commentsError, send, reset,
  } = useTicketComments(
    showChatModal && selectedTicket?.id ? selectedTicket.id : null,
    user?.id,
    false,
    true
  );

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getUserTickets(0, 100);
      let arr = [];
      if (data?.data && Array.isArray(data.data.content)) arr = data.data.content;
      else if (data?.data && Array.isArray(data.data))    arr = data.data;
      else if (Array.isArray(data))                       arr = data;
      setTickets(arr);
    } catch {
      setErrorMessage('Failed to load tickets. Please try again.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      if (!formData.title.trim())       { setErrorMessage('Title is required');       setSubmitting(false); return; }
      if (!formData.description.trim()) { setErrorMessage('Description is required'); setSubmitting(false); return; }
      const newTicket = await createTicket({
        title: formData.title, description: formData.description,
        category: formData.category, priority: formData.priority,
      });
      setSuccessMessage(`Ticket #${newTicket.id} created successfully! Auto-assigned to an agent.`);
      setFormData({ title: '', description: '', category: 'General', priority: 'MEDIUM' });
      setTimeout(() => { setShowCreateModal(false); setSuccessMessage(''); fetchTickets(); }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const openDetailsModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const openChatModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowChatModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTicket(null);
  };

  const closeChatModal = () => {
    reset();
    setShowChatModal(false);
    setSelectedTicket(null);
  };

  const getStatusMeta = (status) => {
    switch (status) {
      case 'OPEN':        return { cls: 'status--open',        label: 'Open' };
      case 'IN_PROGRESS': return { cls: 'status--in-progress', label: 'In Progress' };
      case 'RESOLVED':    return { cls: 'status--resolved',    label: 'Resolved' };
      case 'CLOSED':      return { cls: 'status--closed',      label: 'Closed' };
      default:            return { cls: 'status--default',     label: status?.replace(/_/g, ' ') };
    }
  };

  const getPriorityMeta = (priority) => {
    switch (priority) {
      case 'HIGH':     return { cls: 'priority--high',     label: 'High' };
      case 'MEDIUM':   return { cls: 'priority--medium',   label: 'Medium' };
      case 'LOW':      return { cls: 'priority--low',      label: 'Low' };
      case 'CRITICAL': return { cls: 'priority--critical', label: 'Critical' };
      default:         return { cls: 'priority--default',  label: priority?.replace(/_/g, ' ') };
    }
  };

  const stats = [
    { key: 'total',      label: 'Total Tickets', value: tickets.length,                                         icon: <IconTotal />,      mod: 'cstat--total' },
    { key: 'open',       label: 'Open',          value: tickets.filter(t => t.status === 'OPEN').length,        icon: <IconOpen />,       mod: 'cstat--open' },
    { key: 'inProgress', label: 'In Progress',   value: tickets.filter(t => t.status === 'IN_PROGRESS').length, icon: <IconInProgress />, mod: 'cstat--progress' },
    { key: 'resolved',   label: 'Resolved',      value: tickets.filter(t => t.status === 'RESOLVED').length,    icon: <IconResolved />,   mod: 'cstat--resolved' },
  ];

  return (
    <div className="cd">

      {/* ── Page Header ── */}
      <header className="cd__header">
        <div>
          <h1 className="cd__title">Welcome back, <span>{user.fullName}</span></h1>
          <p className="cd__subtitle">Manage and track your support tickets</p>
        </div>
        <button className="cd__btn-create" onClick={() => setShowCreateModal(true)}>
          <IconPlus /> New Ticket
        </button>
      </header>

      {/* ── Stats Row ── */}
      <section className="cd__stats">
        {stats.map(s => (
          <div key={s.key} className={`cd__stat ${s.mod}`}>
            <div className="cd__stat-icon">{s.icon}</div>
            <div className="cd__stat-body">
              <span className="cd__stat-value">{s.value}</span>
              <span className="cd__stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Global Error ── */}
      {errorMessage && !showCreateModal && (
        <div className="cd__alert cd__alert--error">
          <IconAlertCircle />
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage('')}><IconClose /></button>
        </div>
      )}

      {/* ── Tickets Panel ── */}
      <section className="cd__panel">
        <div className="cd__panel-head">
          <h2 className="cd__panel-title">Your Tickets</h2>
          <span className="cd__panel-count">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="cd__loading"><span className="cd__spinner" /><p>Loading tickets…</p></div>
        ) : tickets.length === 0 ? (
          <div className="cd__empty">
            <IconTicketEmpty />
            <p>No tickets yet. Create one to get started!</p>
            <button className="cd__empty-btn" onClick={() => setShowCreateModal(true)}>
              <IconPlus /> New Ticket
            </button>
          </div>
        ) : (
          <div className="cd__table-wrap">
            <table className="cd__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const sm = getStatusMeta(ticket.status);
                  const pm = getPriorityMeta(ticket.priority);
                  return (
                    <tr key={ticket.id} className="cd__row">
                      <td className="cd__cell-title">{ticket.title}</td>
                      <td><span className={`cd__badge cd__badge--status ${sm.cls}`}>{sm.label}</span></td>
                      <td><span className={`cd__badge cd__badge--priority ${pm.cls}`}>{pm.label}</span></td>
                      <td className="cd__cell-cat">{ticket.category}</td>
                      <td className="cd__cell-agent">
                        {ticket.assignedToName ? (
                          <span className="cd__agent-wrap">
                            <span className="cd__agent-avatar">{ticket.assignedToName[0]}</span>
                            {ticket.assignedToName}
                          </span>
                        ) : (
                          <span className="cd__unassigned">—</span>
                        )}
                      </td>
                      <td className="cd__cell-date">
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="cd__cell-actions">
                        <button className="cd__btn-action cd__btn-chat" onClick={() => openChatModal(ticket)} title="Message">
                          <IconMessageCircle />
                        </button>
                        <button className="cd__btn-action cd__btn-details" onClick={() => openDetailsModal(ticket)} title="Details">
                          <IconFileText />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="cd__overlay" onClick={() => setShowCreateModal(false)}>
          <div className="cd__modal" onClick={e => e.stopPropagation()}>
            <div className="cd__modal-head">
              <div>
                <h2>Create New Ticket</h2>
                <p className="cd__modal-sub">Fill in the details to open a support ticket</p>
              </div>
              <button className="cd__modal-close" onClick={() => setShowCreateModal(false)}><IconClose /></button>
            </div>

            {successMessage && (
              <div className="cd__modal-msg cd__modal-msg--success">
                <IconCheckCircle /><p>{successMessage}</p>
              </div>
            )}
            {errorMessage && (
              <div className="cd__modal-msg cd__modal-msg--error">
                <IconAlertCircle /><p>{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="cd__form">
              <div className="cd__field">
                <label>Title <span className="cd__req">*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                  placeholder="Briefly describe the issue" disabled={submitting} maxLength="200" required />
                <small className="cd__char-count">{formData.title.length}/200</small>
              </div>
              <div className="cd__field">
                <label>Description <span className="cd__req">*</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                  placeholder="Provide full details about the issue…" rows="5"
                  disabled={submitting} maxLength="1000" required />
                <small className="cd__char-count">{formData.description.length}/1000</small>
              </div>
              <div className="cd__form-row">
                <div className="cd__field">
                  <label>Category</label>
                  <div className="cd__select-wrap">
                    <select name="category" value={formData.category} onChange={handleInputChange} disabled={submitting}>
                      <option>General</option><option>Technical</option>
                      <option>Billing</option><option>Account</option><option>Other</option>
                    </select>
                    <IconChevron />
                  </div>
                </div>
                <div className="cd__field">
                  <label>Priority</label>
                  <div className="cd__select-wrap">
                    <select name="priority" value={formData.priority} onChange={handleInputChange} disabled={submitting}>
                      <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                    </select>
                    <IconChevron />
                  </div>
                </div>
              </div>
              <div className="cd__form-actions">
                <button type="button" className="cd__btn-secondary" onClick={() => setShowCreateModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="cd__btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Details Modal ── */}
      {showDetailsModal && selectedTicket && (
        <div className="cd__overlay" onClick={closeDetailsModal}>
          <div className="cd__modal" onClick={e => e.stopPropagation()}>
            <div className="cd__modal-head">
              <div>
                <span className="cd__modal-id">#{selectedTicket.id}</span>
                <h2>{selectedTicket.title}</h2>
                <div className="cd__modal-badges">
                  <span className={`cd__badge cd__badge--priority ${getPriorityMeta(selectedTicket.priority).cls}`}>
                    {getPriorityMeta(selectedTicket.priority).label}
                  </span>
                  <span className={`cd__badge cd__badge--status ${getStatusMeta(selectedTicket.status).cls}`}>
                    {getStatusMeta(selectedTicket.status).label}
                  </span>
                </div>
              </div>
              <button className="cd__modal-close" onClick={closeDetailsModal}><IconClose /></button>
            </div>

            <div className="cd__detail">
              <div className="cd__detail-grid">
                <div className="cd__detail-cell">
                  <label>Status</label>
                  <span className={`cd__badge cd__badge--status ${getStatusMeta(selectedTicket.status).cls}`}>
                    {getStatusMeta(selectedTicket.status).label}
                  </span>
                </div>
                <div className="cd__detail-cell">
                  <label>Priority</label>
                  <span className={`cd__badge cd__badge--priority ${getPriorityMeta(selectedTicket.priority).cls}`}>
                    {getPriorityMeta(selectedTicket.priority).label}
                  </span>
                </div>
                <div className="cd__detail-cell">
                  <label>Category</label>
                  <span className="cd__detail-val">{selectedTicket.category}</span>
                </div>
                <div className="cd__detail-cell">
                  <label>Created</label>
                  <span className="cd__detail-val cd__detail-val--mono">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedTicket.assignedToName && (
                  <div className="cd__detail-cell cd__detail-cell--full">
                    <label>Assigned To</label>
                    <span className="cd__detail-val">
                      <span className="cd__agent-wrap">
                        <span className="cd__agent-avatar">{selectedTicket.assignedToName[0]}</span>
                        {selectedTicket.assignedToName}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              <div className="cd__detail-desc">
                <label>Description</label>
                <p>{selectedTicket.description}</p>
              </div>
              <div className="cd__form-actions">
                <button className="cd__btn-secondary cd__btn-full" onClick={closeDetailsModal}>Close</button>
                <button className="cd__btn-primary cd__btn-full" onClick={() => { closeDetailsModal(); openChatModal(selectedTicket); }}>
                  <IconMessageCircle /> Message Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Chat Modal ── */}
      {showChatModal && selectedTicket && (
        <div className="cd__overlay" onClick={closeChatModal}>
          <div className="cd__modal cd__modal--comms" onClick={e => e.stopPropagation()}>
            <div className="cd__modal-head">
              <div>
                <span className="cd__modal-id">#{selectedTicket.id}</span>
                <h2>{selectedTicket.title}</h2>
                <div className="cd__modal-badges">
                  <span className={`cd__badge cd__badge--priority ${getPriorityMeta(selectedTicket.priority).cls}`}>
                    {getPriorityMeta(selectedTicket.priority).label}
                  </span>
                  <span className={`cd__badge cd__badge--status ${getStatusMeta(selectedTicket.status).cls}`}>
                    {getStatusMeta(selectedTicket.status).label}
                  </span>
                </div>
              </div>
              <button className="cd__modal-close" onClick={closeChatModal}><IconClose /></button>
            </div>

            <div className="cd__thread-wrap">
            <TicketThread
              comments={comments}
              loading={commentsLoading}
              sending={sending}
              error={commentsError}
              currentUserId={user?.id}
              isAgent={false}
              onSend={send}
            />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;