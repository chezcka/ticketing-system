import React, { useEffect, useState } from 'react';
import { getAllTickets, updateTicket } from '../../services/ticketService';
import { useTicketComments } from '../../hooks/useTicketComments';
import TicketThread from '../Common/TicketThread';
import Pagination from '../Common/Pagination';
import './AgentDashboard.css';

// ─── SVG Icons ──────────────────────────────────────────────────────────────

const IconTickets = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2M13 17v2M13 11v2"/>
  </svg>
);
const IconAssigned = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const IconInProgress = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);
const IconResolved = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
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
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
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

// ─── Component ──────────────────────────────────────────────────────────────

const AgentDashboard = ({ user }) => {
  const [allTickets, setAllTickets]           = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal]     = useState(false);
  const [selectedTicket, setSelectedTicket]   = useState(null);
  const [statusFilter, setStatusFilter]       = useState('all');
  const [priorityFilter, setPriorityFilter]   = useState('all');
  const [updateForm, setUpdateForm]           = useState({ status: '', priority: '' });
  const [saving, setSaving]                   = useState(false);
  const [saveSuccess, setSaveSuccess]         = useState(false);

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(10);

  const {
    comments, loading: commentsLoading, sending, error: commentsError, send, reset,
  } = useTicketComments(
    showChatModal && selectedTicket?.id ? selectedTicket.id : null,
    user?.id,
    true,
    true
  );

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    const agentId = user?.id ? Number(user.id) : null;
    const getAssignedToId = (assignedTo) => {
      if (!assignedTo) return null;
      return typeof assignedTo === 'object' ? assignedTo.id : assignedTo;
    };

    let filtered = allTickets.filter(t => {
      const assignedId = getAssignedToId(t.assignedTo);
      return assignedId && Number(assignedId) === agentId;
    });

    if (statusFilter !== 'all')   filtered = filtered.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);
    setFilteredTickets(filtered);
    setCurrentPage(1); // reset page on filter change
  }, [allTickets, statusFilter, priorityFilter, user?.id]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await getAllTickets();
      let arr = [];
      if (response?.data && Array.isArray(response.data.content)) arr = response.data.content;
      else if (response?.data && Array.isArray(response.data))    arr = response.data;
      else if (Array.isArray(response))                           arr = response;
      setAllTickets(arr);
    } catch {
      setAllTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateForm({ status: ticket.status, priority: ticket.priority });
    setShowDetailsModal(true);
    setSaveSuccess(false);
  };

  const openChatModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowChatModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTicket(null);
    setSaveSuccess(false);
  };

  const closeChatModal = () => {
    reset();
    setShowChatModal(false);
    setSelectedTicket(null);
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    try {
      setSaving(true);
      await updateTicket(selectedTicket.id, {
        status:   updateForm.status   || selectedTicket.status,
        priority: updateForm.priority || selectedTicket.priority,
      });
      await fetchTickets();
      setSaveSuccess(true);
      setTimeout(() => { closeDetailsModal(); }, 800);
    } catch (error) {
      console.error('Error updating ticket:', error);
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const getStatusMeta = (status) => {
    switch (status) {
      case 'OPEN':        return { cls: 'status--open',        label: 'Open' };
      case 'IN_PROGRESS': return { cls: 'status--in-progress', label: 'In Progress' };
      case 'RESOLVED':    return { cls: 'status--resolved',    label: 'Resolved' };
      default:            return { cls: 'status--default',     label: status?.replace(/_/g, ' ') ?? status };
    }
  };

  const getPriorityMeta = (priority) => {
    switch (priority) {
      case 'HIGH':   return { cls: 'priority--high',    label: 'High' };
      case 'MEDIUM': return { cls: 'priority--medium',  label: 'Medium' };
      case 'LOW':    return { cls: 'priority--low',     label: 'Low' };
      default:       return { cls: 'priority--default', label: priority?.replace(/_/g, ' ') ?? priority };
    }
  };

  const getAssignedToId = (assignedTo) => {
    if (!assignedTo) return null;
    return typeof assignedTo === 'object' ? assignedTo.id : assignedTo;
  };

  const agentId = user?.id ? Number(user.id) : null;
  const assignedCount   = allTickets.filter(t => { const id = getAssignedToId(t.assignedTo); return id && Number(id) === agentId; }).length;
  const inProgressCount = allTickets.filter(t => { const id = getAssignedToId(t.assignedTo); return id && Number(id) === agentId && t.status === 'IN_PROGRESS'; }).length;
  const resolvedCount   = allTickets.filter(t => { const id = getAssignedToId(t.assignedTo); return id && Number(id) === agentId && t.status === 'RESOLVED'; }).length;

  const stats = [
    { key: 'assigned',  label: 'Assigned to You', value: assignedCount,   icon: <IconAssigned />,   mod: 'stat--assigned' },
    { key: 'progress',  label: 'In Progress',      value: inProgressCount, icon: <IconInProgress />, mod: 'stat--progress' },
    { key: 'resolved',  label: 'Resolved',         value: resolvedCount,   icon: <IconResolved />,   mod: 'stat--resolved' },
  ];

  // ── Paginated slice ──
  const totalItems  = filteredTickets.length;
  const pagedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="agd">

      {/* ── Page Header ── */}
      <header className="agd__header">
        <div className="agd__header-left">
          <h1 className="agd__title">Agent Dashboard</h1>
          <p className="agd__subtitle">Your assigned support tickets</p>
        </div>
      </header>

      {/* ── Stats Row ── */}
      <section className="agd__stats">
        {stats.map(s => (
          <div key={s.key} className={`agd__stat ${s.mod}`}>
            <div className="agd__stat-icon">{s.icon}</div>
            <div className="agd__stat-body">
              <span className="agd__stat-value">{s.value}</span>
              <span className="agd__stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Ticket Table ── */}
      <section className="agd__panel">
        <div className="agd__panel-head">
          <h2 className="agd__panel-title">
            Your Tickets <span className="agd__count">{filteredTickets.length}</span>
          </h2>
          <div className="agd__filters">
            <div className="agd__filter">
              <IconFilter />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <IconChevron />
            </div>
            <div className="agd__filter">
              <IconFilter />
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <IconChevron />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="agd__loading"><span className="agd__spinner" /><p>Loading tickets…</p></div>
        ) : filteredTickets.length === 0 ? (
          <div className="agd__empty"><IconTickets /><p>No tickets assigned to you yet.</p></div>
        ) : (
          <>
            <div className="agd__table-wrap">
              <table className="agd__table">
                <thead>
                  <tr>
                    <th>Title</th><th>Status</th><th>Priority</th>
                    <th>Category</th><th>Created By</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTickets.map(ticket => {
                    const sm = getStatusMeta(ticket.status);
                    const pm = getPriorityMeta(ticket.priority);
                    return (
                      <tr key={ticket.id} className="agd__row">
                        <td className="agd__cell-title">{ticket.title}</td>
                        <td><span className={`agd__badge agd__badge--status ${sm.cls}`}>{sm.label}</span></td>
                        <td><span className={`agd__badge agd__badge--priority ${pm.cls}`}>{pm.label}</span></td>
                        <td className="agd__cell-cat">{ticket.category}</td>
                        <td className="agd__cell-creator">{ticket.createdByName}</td>
                        <td className="agd__cell-actions">
                          <button className="agd__btn-action agd__btn-chat" onClick={() => openChatModal(ticket)} title="Chat">
                            <IconMessageCircle />
                          </button>
                          <button className="agd__btn-action agd__btn-details" onClick={() => openDetailsModal(ticket)} title="Details">
                            <IconFileText />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </>
        )}
      </section>

      {/* ── Details Modal ── */}
      {showDetailsModal && selectedTicket && (
        <div className="agd__overlay" onClick={closeDetailsModal}>
          <div className="agd__modal" onClick={e => e.stopPropagation()}>
            <div className="agd__modal-head">
              <div className="agd__modal-head-left">
                <span className="agd__modal-id">#{selectedTicket.id}</span>
                <h2 className="agd__modal-title">{selectedTicket.title}</h2>
                <div className="agd__modal-meta">
                  <span className={`agd__badge agd__badge--priority ${getPriorityMeta(updateForm.priority || selectedTicket.priority).cls}`}>
                    {getPriorityMeta(updateForm.priority || selectedTicket.priority).label}
                  </span>
                  <span className={`agd__badge agd__badge--status ${getStatusMeta(updateForm.status || selectedTicket.status).cls}`}>
                    {getStatusMeta(updateForm.status || selectedTicket.status).label}
                  </span>
                </div>
              </div>
              <button className="agd__modal-close" onClick={closeDetailsModal} disabled={saving}><IconClose /></button>
            </div>

            <div className="agd__detail">
              <div className="agd__detail-grid">
                <div className="agd__detail-cell">
                  <label>Status</label>
                  <div className="agd__select-wrap">
                    <select value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })} disabled={saving}>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                    <IconChevron />
                  </div>
                </div>
                <div className="agd__detail-cell">
                  <label>Priority</label>
                  <div className="agd__select-wrap">
                    <select value={updateForm.priority} onChange={e => setUpdateForm({ ...updateForm, priority: e.target.value })} disabled={saving}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                    <IconChevron />
                  </div>
                </div>
                <div className="agd__detail-cell">
                  <label>Category</label>
                  <span className="agd__detail-val">{selectedTicket.category || '—'}</span>
                </div>
                <div className="agd__detail-cell">
                  <label>Created</label>
                  <span className="agd__detail-val">
                    {new Date(selectedTicket.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <div className="agd__detail-cell">
                  <label>Submitted by</label>
                  <span className="agd__detail-val">{selectedTicket.createdByName || '—'}</span>
                </div>
              </div>

              {selectedTicket.description && (
                <div className="agd__detail-desc">
                  <label>Description</label>
                  <p>{selectedTicket.description}</p>
                </div>
              )}

              <div className="agd__form-actions">
                <button className="agd__btn-secondary" onClick={closeDetailsModal} disabled={saving}>Close</button>
                <button className="agd__btn-primary" onClick={handleUpdateTicket} disabled={saving || saveSuccess}>
                  {saveSuccess ? '✓ Saved!' : saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Modal ── */}
      {showChatModal && selectedTicket && (
        <div className="agd__overlay" onClick={closeChatModal}>
          <div className="agd__modal agd__modal--comms" onClick={e => e.stopPropagation()}>
            <div className="agd__modal-head">
              <div className="agd__modal-head-left">
                <span className="agd__modal-id">#{selectedTicket.id}</span>
                <h2 className="agd__modal-title">{selectedTicket.title}</h2>
                <div className="agd__modal-meta">
                  <span className={`agd__badge agd__badge--priority ${getPriorityMeta(selectedTicket.priority).cls}`}>
                    {getPriorityMeta(selectedTicket.priority).label}
                  </span>
                  <span className={`agd__badge agd__badge--status ${getStatusMeta(selectedTicket.status).cls}`}>
                    {getStatusMeta(selectedTicket.status).label}
                  </span>
                </div>
              </div>
              <button className="agd__modal-close" onClick={closeChatModal}><IconClose /></button>
            </div>

            <div className="agd__thread-wrap">
              <TicketThread
                comments={comments}
                loading={commentsLoading}
                sending={sending}
                error={commentsError}
                currentUserId={user?.id}
                isAgent={true}
                onSend={send}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;