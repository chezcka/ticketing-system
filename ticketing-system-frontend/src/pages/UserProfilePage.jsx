import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useToast } from '../context/ToastContext';
import * as ticketService from '../services/ticketService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import Badge from '../components/Common/Badge';
import { formatDateTime, getStatusColor, getPriorityColor } from '../utils/formatters';
import './DashboardPage.css';
 
export default function DashboardPage() {
  const { user } = useAuth();
  const { error: errorToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
 
  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);
 
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
 
      if (user?.role === 'CLIENT') {
        const response = await ticketService.getUserTickets();
        setTickets(response.data || response.content || []);
      } else if (user?.role === 'SUPPORT_AGENT') {
        const response = await ticketService.getAssignedTickets();
        setTickets(response.data || response.content || []);
      } else if (user?.role === 'ADMIN') {
        const response = await ticketService.getAllTickets();
        setTickets(response.data || response.content || []);
        const statsData = await ticketService.getTicketStats();
        setStats(statsData);
      }
    } catch (err) {
      const message = 'Failed to load dashboard data';
      setError(message);
      errorToast(message);
    } finally {
      setIsLoading(false);
    }
  };
 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
 
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading dashboard..." />
      </MainLayout>
    );
  }
 
  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user.fullName}!</p>
        </div>
 
        {error && (
          <Alert 
            type="error" 
            message={error}
            onClose={() => setError('')}
          />
        )}
 
        {/* Admin Stats */}
        {user.role === 'ADMIN' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Tickets</h3>
              <p className="stat-value">{stats.totalTickets || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Open</h3>
              <p className="stat-value">{stats.openTickets || 0}</p>
            </div>
            <div className="stat-card">
              <h3>In Progress</h3>
              <p className="stat-value">{stats.inProgressTickets || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Resolved</h3>
              <p className="stat-value">{stats.resolvedTickets || 0}</p>
            </div>
          </div>
        )}
 
        {/* Recent Tickets */}
        <div className="tickets-section">
          <h2>Recent Tickets</h2>
          {tickets.length === 0 ? (
            <div className="empty-state">
              <p>No tickets found</p>
              {user.role === 'CLIENT' && (
                <a href="/tickets/create" className="btn-primary">Create New Ticket</a>
              )}
            </div>
          ) : (
            <div className="tickets-table-wrapper">
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
                  {tickets.slice(0, 10).map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <strong>#{ticket.id}</strong>
                      </td>
                      <td>{ticket.title}</td>
                      <td>
                        <Badge type={ticket.priority.toLowerCase()}>
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td>
                        <span 
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: getStatusColor(ticket.status),
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td>{formatDateTime(ticket.createdAt)}</td>
                      <td>
                        <a href={`/tickets/${ticket.id}`} className="link-action">
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}