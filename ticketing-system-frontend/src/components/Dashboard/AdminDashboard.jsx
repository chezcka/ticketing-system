import React, { useEffect, useState } from 'react';
import { getAllTickets, createTicket, updateTicket } from '../../services/ticketService';
import {
  calculateAvgResolutionTime,
  calculateAvgFirstResponseTime,
  calculateSatisfactionScore,
  calculateAgentUtilization,
  calculateResolutionRate,
  calculateOpenPercentage,
} from '../../utils/analyticsUtils';
import Pagination from '../Common/Pagination';
import './AdminDashboard.css';

// ─── Service functions ─────────────────────────────────────────────────────

const assignTicketToAgent = async (ticketId, agentId) => {
  const api = (await import('../../services/api')).default;
  const response = await api.patch(`/tickets/${ticketId}/assign`, { agentId });
  return response.data.data;
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconTickets = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2M13 17v2M13 11v2"/>
  </svg>
);

const IconOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4M12 16h.01"/>
  </svg>
);

const IconAssigned = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconResolved = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="m9 11 3 3L22 4"/>
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

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    <path d="m15 5 4 4"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconTrendingUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="9"/>
  </svg>
);

// ─── Resolve agent name — handles object, plain ID, or name string ─────────

const resolveAgentName = (ticket, agents = []) => {
  const assignedTo = ticket.assignedTo;

  // 1. Prefer dedicated name field if backend sends it as a flat string
  if (ticket.assignedToName && typeof ticket.assignedToName === 'string' && ticket.assignedToName.trim()) {
    return ticket.assignedToName.trim();
  }

  // 2. assignedTo is a user object (same shape ClientDashboard receives)
  if (assignedTo && typeof assignedTo === 'object') {
    if (assignedTo.fullName && assignedTo.fullName.trim()) return assignedTo.fullName.trim();
    const parts = [assignedTo.firstName, assignedTo.lastName].filter(Boolean);
    if (parts.length) return parts.join(' ');
    // object exists but has no readable name — fall through to agents list
    const objectId = assignedTo.id ?? assignedTo.agentId;
    if (objectId) {
      const found = agents.find(a => String(a.agentId) === String(objectId));
      if (found) return found.agentName;
    }
    return null;
  }

  // 3. assignedTo is a plain primitive ID — look up in agents workload list
  if (assignedTo) {
    const found = agents.find(a => String(a.agentId) === String(assignedTo));
    if (found) return found.agentName;
    return null; // avoid rendering "[object Object]" or raw UUIDs
  }

  return null;
};

// ─── Check whether a ticket is truly unassigned ───────────────────────────

const isTicketUnassigned = (ticket) => {
  const a = ticket.assignedTo;
  if (!a) return true;
  if (typeof a === 'object') return !a.id && !a.agentId;
  return false;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ADMIN_PAGE_SIZE = 10;

const AdminDashboard = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [agents, setAgents] = useState([]);
  const [analytics, setAnalytics] = useState({
    avgResolutionTime: 0,
    satisfactionScore: 0,
    agentUtilization: 0,
    avgFirstResponseTime: 0,
  });
  const [updateForm, setUpdateForm] = useState({
    status: '',
    priority: '',
    assignedTo: '',
  });

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ADMIN_PAGE_SIZE);

  useEffect(() => {
    fetchTickets();
    fetchAgents();
  }, []);

  useEffect(() => {
    let filtered = tickets;
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);
    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await getAllTickets();
      let ticketArray = [];
      if (response && response.data && Array.isArray(response.data.content)) {
        ticketArray = response.data.content;
      } else if (response && Array.isArray(response.data)) {
        ticketArray = response.data;
      } else if (Array.isArray(response)) {
        ticketArray = response;
      }
      setTickets(ticketArray);
      setAnalytics({
        avgResolutionTime: calculateAvgResolutionTime(ticketArray),
        satisfactionScore: calculateSatisfactionScore(ticketArray),
        agentUtilization: calculateAgentUtilization(ticketArray),
        avgFirstResponseTime: calculateAvgFirstResponseTime(ticketArray),
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const api = (await import('../../services/api')).default;
      const response = await api.get('/tickets/agents/workload');
      setAgents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    try {
      if (updateForm.assignedTo && updateForm.assignedTo !== selectedTicket.assignedTo) {
        await assignTicketToAgent(selectedTicket.id, updateForm.assignedTo);
      }
      setShowDetailModal(false);
      setUpdateForm({ status: '', priority: '', assignedTo: '' });
      await fetchTickets();
      await fetchAgents();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const openTicketDetail = (ticket) => {
    setSelectedTicket(ticket);
    // Resolve the current assignedTo ID to pre-select in the dropdown
    const a = ticket.assignedTo;
    let currentAgentId = '';
    if (a && typeof a === 'object') {
      currentAgentId = String(a.id ?? a.agentId ?? '');
    } else if (a) {
      currentAgentId = String(a);
    }
    setUpdateForm({ status: '', priority: '', assignedTo: currentAgentId });
    setShowDetailModal(true);
  };

  const getStatusMeta = (status) => {
    switch (status) {
      case 'OPEN':        return { cls: 'status--open',        label: 'Open' };
      case 'IN_PROGRESS': return { cls: 'status--in-progress', label: 'In Progress' };
      case 'RESOLVED':    return { cls: 'status--resolved',    label: 'Resolved' };
      default:            return { cls: 'status--default',     label: status };
    }
  };

  const getPriorityMeta = (priority) => {
    switch (priority) {
      case 'HIGH':     return { cls: 'priority--high',    label: 'High' };
      case 'MEDIUM':   return { cls: 'priority--medium',  label: 'Medium' };
      case 'LOW':      return { cls: 'priority--low',     label: 'Low' };
      case 'CRITICAL': return { cls: 'priority--high',    label: 'Critical' };
      default:         return { cls: 'priority--default', label: priority };
    }
  };

  const unassignedCount = tickets.filter(t => isTicketUnassigned(t)).length;

  const stats = [
    { key: 'total',    label: 'Total Tickets', value: tickets.length,                                      icon: <IconTickets />, mod: 'stat--total' },
    { key: 'open',     label: 'Open',          value: tickets.filter(t => t.status === 'OPEN').length,     icon: <IconOpen />,    mod: 'stat--open' },
    { key: 'assigned', label: 'Assigned',      value: tickets.filter(t => !isTicketUnassigned(t)).length,  icon: <IconAssigned />,mod: 'stat--assigned' },
    { key: 'resolved', label: 'Resolved',      value: tickets.filter(t => t.status === 'RESOLVED').length, icon: <IconResolved />,mod: 'stat--resolved' },
  ];

  // ── Paginated slice (newest first) ──
  const reversedFiltered = [...filteredTickets].reverse();
  const totalItems = reversedFiltered.length;
  const pagedTickets = reversedFiltered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="ad">

      {/* ── Page Header ── */}
      <header className="ad__header">
        <div className="ad__header-left">
          <h1 className="ad__title">Admin Dashboard</h1>
          <p className="ad__subtitle">Full system control &amp; monitoring</p>
        </div>
      </header>

      {/* ── Unassigned Alert ── */}
      {unassignedCount > 0 && (
        <div className="ad__alert">
          <IconAlertCircle />
          <span>
            <strong>{unassignedCount} unassigned ticket{unassignedCount !== 1 ? 's' : ''}</strong>
            {' '}— click the edit button to assign to an agent.
          </span>
        </div>
      )}

      {/* ── Analytics Section ── */}
      <section className="ad__panel ad__panel--analytics">
        <div className="ad__panel-head">
          <h2 className="ad__panel-title">System Analytics</h2>
        </div>
        <div className="ad__analytics-grid">
          <div className="ad__analytics-card">
            <div className="ad__analytics-icon ad__analytics-icon--time"><IconClock /></div>
            <div className="ad__analytics-body">
              <span className="ad__analytics-label">Avg. Resolution Time</span>
              <span className="ad__analytics-value">
                {analytics.avgResolutionTime === 0 ? '—' : `${analytics.avgResolutionTime} hrs`}
              </span>
              <span className="ad__analytics-trend ad__analytics-trend--up">
                <IconTrendingUp /> {tickets.filter(t => t.status === 'RESOLVED').length} resolved
              </span>
            </div>
          </div>
          <div className="ad__analytics-card">
            <div className="ad__analytics-icon ad__analytics-icon--satisfaction"><IconTarget /></div>
            <div className="ad__analytics-body">
              <span className="ad__analytics-label">Customer Satisfaction</span>
              <span className="ad__analytics-value">{analytics.satisfactionScore}%</span>
              <span className="ad__analytics-trend ad__analytics-trend--up">
                <IconTrendingUp /> Resolution-based
              </span>
            </div>
          </div>
          <div className="ad__analytics-card">
            <div className="ad__analytics-icon ad__analytics-icon--agents"><IconUsers /></div>
            <div className="ad__analytics-body">
              <span className="ad__analytics-label">Agent Utilization</span>
              <span className="ad__analytics-value">{analytics.agentUtilization}%</span>
              <span className="ad__analytics-trend ad__analytics-trend--neutral">
                <span className="ad__trend-dot"></span> {agents.length} agents active
              </span>
            </div>
          </div>
          <div className="ad__analytics-card">
            <div className="ad__analytics-icon ad__analytics-icon--response"><IconClock /></div>
            <div className="ad__analytics-body">
              <span className="ad__analytics-label">Avg. First Response</span>
              <span className="ad__analytics-value">
                {analytics.avgFirstResponseTime === 0 ? '—' : `${analytics.avgFirstResponseTime} min`}
              </span>
              <span className="ad__analytics-trend ad__analytics-trend--up">
                <IconTrendingUp /> {tickets.filter(t => !isTicketUnassigned(t)).length} assigned
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="ad__stats">
        {stats.map(s => (
          <div key={s.key} className={`ad__stat ${s.mod}`}>
            <div className="ad__stat-icon">{s.icon}</div>
            <div className="ad__stat-body">
              <span className="ad__stat-value">{s.value}</span>
              <span className="ad__stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Ticket Table ── */}
      <section className="ad__panel">
        <div className="ad__panel-head">
          <h2 className="ad__panel-title">
            All Tickets
            <span className="ad__count">{filteredTickets.length}</span>
          </h2>
          <div className="ad__filters">
            <div className="ad__filter">
              <IconFilter />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <IconChevron />
            </div>
            <div className="ad__filter">
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
          <div className="ad__loading">
            <span className="ad__spinner" />
            <p>Loading tickets…</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="ad__empty">
            <IconTickets />
            <p>No tickets match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="ad__table-wrap">
              <table className="ad__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTickets.map(ticket => {
                    const sm         = getStatusMeta(ticket.status);
                    const pm         = getPriorityMeta(ticket.priority);
                    const unassigned = isTicketUnassigned(ticket);
                    const agentName  = resolveAgentName(ticket, agents);
                    return (
                      <tr key={ticket.id} className={`ad__row ${unassigned ? 'ad__row--unassigned' : ''}`}>
                        <td className="ad__cell-id">#{ticket.id}</td>
                        <td className="ad__cell-title">{ticket.title}</td>
                        <td><span className={`ad__badge ad__badge--status ${sm.cls}`}>{sm.label}</span></td>
                        <td><span className={`ad__badge ad__badge--priority ${pm.cls}`}>{pm.label}</span></td>
                        <td className="ad__cell-agent">
                          {unassigned || !agentName ? (
                            <span className="ad__badge ad__badge--unassigned">Unassigned</span>
                          ) : (
                            <span className="ad__agent-cell">
                              <span className="ad__agent-avatar">
                                {agentName[0].toUpperCase()}
                              </span>
                              <span className="ad__agent-name">{agentName}</span>
                            </span>
                          )}
                        </td>
                        <td className="ad__cell-date">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="ad__cell-action">
                          <button
                            className="ad__btn-icon"
                            onClick={() => openTicketDetail(ticket)}
                            title="Manage ticket"
                          >
                            <IconEdit />
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

      {/* ── Detail Modal ── */}
      {showDetailModal && selectedTicket && (
        <div className="ad__overlay" onClick={() => setShowDetailModal(false)}>
          <div className="ad__modal ad__modal--lg" onClick={e => e.stopPropagation()}>
            <div className="ad__modal-head">
              <div>
                <span className="ad__modal-id">#{selectedTicket.id}</span>
                <h2>{selectedTicket.title}</h2>
                <p className="ad__modal-sub">{selectedTicket.category}</p>
              </div>
              <button className="ad__modal-close" onClick={() => setShowDetailModal(false)}><IconClose /></button>
            </div>

            <div className="ad__detail">
              <div className="ad__detail-grid">
                <div className="ad__detail-cell">
                  <label>Status</label>
                  <span className={`ad__badge ad__badge--status ${getStatusMeta(selectedTicket.status).cls}`}>
                    {getStatusMeta(selectedTicket.status).label}
                  </span>
                </div>
                <div className="ad__detail-cell">
                  <label>Priority</label>
                  <span className={`ad__badge ad__badge--priority ${getPriorityMeta(selectedTicket.priority).cls}`}>
                    {getPriorityMeta(selectedTicket.priority).label}
                  </span>
                </div>
                <div className="ad__detail-cell ad__detail-cell--full">
                  <label>Assign To Support Agent</label>
                  <div className="ad__select-wrap">
                    <select
                      value={updateForm.assignedTo}
                      onChange={e => setUpdateForm({ ...updateForm, assignedTo: e.target.value })}
                    >
                      <option value="">— Unassigned —</option>
                      {agents.map(agent => (
                        <option key={agent.agentId} value={agent.agentId}>
                          {agent.agentName} ({agent.totalWorkload} pts · {agent.openTicketsCount} open)
                        </option>
                      ))}
                    </select>
                    <IconChevron />
                  </div>
                </div>
              </div>

              {selectedTicket.description && (
                <div className="ad__detail-desc">
                  <label>Description</label>
                  <p>{selectedTicket.description}</p>
                </div>
              )}

              <div className="ad__form-actions">
                <button className="ad__btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                <button className="ad__btn-primary" onClick={handleUpdateTicket}>Save Assignment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;