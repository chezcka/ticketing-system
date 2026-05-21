import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { Navigate } from 'react-router-dom';
import { getAllTickets } from '../services/ticketService';
import {
  calculateAvgResolutionTime,
  calculateAvgFirstResponseTime,
  calculateSatisfactionScore,
  calculateAgentUtilization,
  calculateResolutionRate,
  calculateOpenPercentage,
  calculateAllAnalytics,
} from '../utils/analyticsUtils';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min';
import MainLayout from './MainLayout';
import './AnalyticsPage.css';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconTrendingUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconTrendingDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const IconTickets = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2M13 17v2M13 11v2"/>
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

const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const IconBarChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

// ─── Pie Chart Component ───────────────────────────────────────────────────────

const PieChart = ({ data, label }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;
  
  const segments = data.map((item, idx) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = sliceAngle > 180 ? 1 : 0;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <path key={idx} d={path} fill={item.color} stroke="white" strokeWidth="2" />
    );
  });

  return (
    <div className="pie-chart-container">
      <svg viewBox="0 0 100 100" className="pie-chart">
        {segments}
      </svg>
      <div className="pie-chart-legend">
        {data.map((item, idx) => (
          <div key={idx} className="legend-item">
            <span className="legend-color" style={{ background: item.color }} />
            <span className="legend-label">{item.label}</span>
            <span className="legend-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const AnalyticsPage = () => {
  const { user, isLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="analytics-loading">
          <span className="analytics-spinner" />
          <p>Loading analytics…</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return (
      <MainLayout>
        <div className="analytics-error">
          <p>Access denied. Only administrators can view analytics.</p>
        </div>
      </MainLayout>
    );
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
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
      // ✅ USE REAL CALCULATIONS FROM UTILS
      calculateStats(ticketArray);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setTickets([]);
      setStats(getEmptyStats());
    } finally {
      setLoading(false);
    }
  };

  const getEmptyStats = () => ({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    unassigned: 0,
    avgResolutionTime: 0,
    satisfaction: 0,
    agentUtilization: 0,
    firstResponseTime: 0,
    openPercentage: 0,
    resolutionRate: 0,
  });

  const calculateStats = (ticketData) => {
    const total = ticketData.length;
    const open = ticketData.filter(t => t.status === 'OPEN').length;
    const inProgress = ticketData.filter(t => t.status === 'IN_PROGRESS').length;
    const resolved = ticketData.filter(t => t.status === 'RESOLVED').length;
    const unassigned = ticketData.filter(t => !t.assignedTo).length;
    const assigned = ticketData.filter(t => t.assignedTo).length;

    // ✅ ALL REAL CALCULATIONS - NO DUMMY DATA
    const stats = {
      total,
      open,
      inProgress,
      resolved,
      unassigned,
      avgResolutionTime: calculateAvgResolutionTime(ticketData),
      satisfaction: calculateSatisfactionScore(ticketData),
      agentUtilization: calculateAgentUtilization(ticketData),
      firstResponseTime: calculateAvgFirstResponseTime(ticketData),
      openPercentage: calculateOpenPercentage(ticketData),
      resolutionRate: calculateResolutionRate(ticketData),
    };

    setStats(stats);
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setExporting(true);
      const element = reportRef.current;
      
      const options = {
        margin: [10, 10, 10, 10],
        filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="analytics-loading">
          <span className="analytics-spinner" />
          <p>Loading analytics…</p>
        </div>
      </MainLayout>
    );
  }

  if (!stats) {
    return (
      <MainLayout>
        <div className="analytics-error">
          <p>Unable to load analytics data.</p>
        </div>
      </MainLayout>
    );
  }

  const pieChartData = [
    { label: 'Open', value: stats.open, color: '#f59e0b' },
    { label: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
    { label: 'Resolved', value: stats.resolved, color: '#10b981' },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <header className="analytics-header">
        <div className="analytics-header-content">
          <h1 className="analytics-title">System Analytics</h1>
          <p className="analytics-subtitle">Real-time ticketing system insights & performance metrics</p>
        </div>
        <div className="analytics-actions">
          <button 
            className="analytics-btn-refresh" 
            onClick={fetchAnalytics} 
            title="Refresh data"
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <button 
            className="analytics-btn-export" 
            onClick={exportToPDF}
            disabled={exporting || loading}
            title="Export as PDF"
          >
            <IconDownload /> {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </header>

      {/* Report Content */}
      <div ref={reportRef} className="analytics-report">
        {/* Key Metrics */}
        <section className="analytics-metrics">
          <h2 className="analytics-section-title">
            <IconBarChart /> Key Performance Indicators
          </h2>

          <div className="metrics-grid">
            {/* Total Tickets */}
            <div className="metric-card">
              <div className="metric-header">
                <IconTickets className="metric-icon" />
                <span className="metric-label">Total Tickets</span>
              </div>
              <div className="metric-value">{stats.total}</div>
              <div className="metric-detail">All time</div>
            </div>

            {/* Resolution Rate */}
            <div className="metric-card">
              <div className="metric-header">
                <IconCheckCircle className="metric-icon" />
                <span className="metric-label">Resolution Rate</span>
              </div>
              <div className="metric-value">{stats.resolutionRate}%</div>
              <div className="metric-detail">
                {stats.resolutionRate >= 70 ? (
                  <span className="trend-up"><IconTrendingUp /> Good</span>
                ) : stats.resolutionRate >= 50 ? (
                  <span className="trend-neutral">Fair</span>
                ) : (
                  <span className="trend-down"><IconTrendingDown /> Needs improvement</span>
                )}
              </div>
            </div>

            {/* Avg Response Time */}
            <div className="metric-card">
              <div className="metric-header">
                <IconClock className="metric-icon" />
                <span className="metric-label">Avg Response Time</span>
              </div>
              <div className="metric-value">{stats.firstResponseTime === 0 ? '—' : `${stats.firstResponseTime} min`}</div>
              <div className="metric-detail">First response</div>
            </div>

            {/* Satisfaction Score */}
            <div className="metric-card">
              <div className="metric-header">
                <IconTarget className="metric-icon" />
                <span className="metric-label">Satisfaction</span>
              </div>
              <div className="metric-value">{stats.satisfaction}%</div>
              <div className="metric-detail">
                {stats.satisfaction >= 90 ? (
                  <span className="trend-up"><IconTrendingUp /> Excellent</span>
                ) : stats.satisfaction >= 80 ? (
                  <span className="trend-up"><IconTrendingUp /> Good</span>
                ) : (
                  <span className="trend-neutral">Fair</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="analytics-charts">
          <h2 className="analytics-section-title">
            <IconBarChart /> Visual Analytics
          </h2>

          <div className="charts-grid">
            {/* Status Distribution Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Ticket Status Distribution</h3>
              <PieChart data={pieChartData} label="Ticket Status" />
            </div>

            {/* Quick Stats */}
            <div className="chart-card">
              <h3 className="chart-title">Quick Overview</h3>
              <div className="quick-stats">
                <div className="stat-row">
                  <span className="stat-name">Open Tickets</span>
                  <span className="stat-count">{stats.open}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">In Progress</span>
                  <span className="stat-count">{stats.inProgress}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">Resolved</span>
                  <span className="stat-count">{stats.resolved}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">Unassigned</span>
                  <span className="stat-count">{stats.unassigned}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ticket Status Breakdown */}
        <section className="analytics-status">
          <h2 className="analytics-section-title">
            <IconTickets /> Ticket Status Breakdown
          </h2>

          <div className="status-grid">
            {/* Open */}
            <div className="status-card status-open">
              <div className="status-label">Open</div>
              <div className="status-value">{stats.open}</div>
              <div className="status-percentage">{stats.openPercentage}% of total</div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: `${stats.openPercentage}%` }} />
              </div>
            </div>

            {/* In Progress */}
            <div className="status-card status-in-progress">
              <div className="status-label">In Progress</div>
              <div className="status-value">{stats.inProgress}</div>
              <div className="status-percentage">
                {stats.total > 0 ? Math.floor((stats.inProgress / stats.total) * 100) : 0}% of total
              </div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: `${stats.total > 0 ? Math.floor((stats.inProgress / stats.total) * 100) : 0}%` }} />
              </div>
            </div>

            {/* Resolved */}
            <div className="status-card status-resolved">
              <div className="status-label">Resolved</div>
              <div className="status-value">{stats.resolved}</div>
              <div className="status-percentage">{stats.resolutionRate}% of total</div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: `${stats.resolutionRate}%` }} />
              </div>
            </div>

            {/* Unassigned */}
            <div className="status-card status-unassigned">
              <div className="status-label">Unassigned</div>
              <div className="status-value">{stats.unassigned}</div>
              <div className="status-percentage">
                {stats.total > 0 ? Math.floor((stats.unassigned / stats.total) * 100) : 0}% of total
              </div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: `${stats.total > 0 ? Math.floor((stats.unassigned / stats.total) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Team Performance */}
        <section className="analytics-team">
          <h2 className="analytics-section-title">
            <IconUsers /> Team Performance
          </h2>

          <div className="team-grid">
            <div className="team-card">
              <div className="team-label">Agent Utilization</div>
              <div className="team-value">{stats.agentUtilization}%</div>
              <div className="team-bar">
                <div className="team-fill" style={{ width: `${stats.agentUtilization}%` }} />
              </div>
              <div className="team-detail">
                {stats.agentUtilization >= 80 ? 'High workload' : stats.agentUtilization >= 50 ? 'Moderate workload' : 'Low workload'}
              </div>
            </div>

            <div className="team-card">
              <div className="team-label">Avg Resolution Time</div>
              <div className="team-value">{stats.avgResolutionTime === 0 ? '—' : `${stats.avgResolutionTime} hrs`}</div>
              <div className="team-detail">
                {stats.avgResolutionTime <= 24 ? (
                  <span className="trend-up"><IconTrendingUp /> Fast</span>
                ) : stats.avgResolutionTime <= 48 ? (
                  <span className="trend-neutral">Moderate</span>
                ) : (
                  <span className="trend-down"><IconTrendingDown /> Slow</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="analytics-insights">
          <h2 className="analytics-section-title">
            <IconAlertCircle /> System Insights
          </h2>

          <div className="insights-list">
            {stats.unassigned > 0 && (
              <div className="insight-item insight-warning">
                <IconAlertCircle />
                <span>
                  <strong>{stats.unassigned} tickets</strong> are currently unassigned and need attention.
                </span>
              </div>
            )}

            {stats.openPercentage > 40 && (
              <div className="insight-item insight-warning">
                <IconAlertCircle />
                <span>
                  <strong>{stats.openPercentage}% of tickets</strong> are still open. Consider increasing team capacity.
                </span>
              </div>
            )}

            {stats.satisfaction >= 90 && (
              <div className="insight-item insight-success">
                <IconCheckCircle />
                <span>
                  Excellent customer satisfaction at <strong>{stats.satisfaction}%</strong>. Keep up the great work!
                </span>
              </div>
            )}

            {stats.resolutionRate >= 70 && (
              <div className="insight-item insight-success">
                <IconCheckCircle />
                <span>
                  Strong resolution rate at <strong>{stats.resolutionRate}%</strong>. System is performing well.
                </span>
              </div>
            )}

            {stats.agentUtilization >= 80 && (
              <div className="insight-item insight-warning">
                <IconAlertCircle />
                <span>
                  Team utilization is high at <strong>{stats.agentUtilization}%</strong>. Consider workload rebalancing.
                </span>
              </div>
            )}

            {stats.firstResponseTime > 0 && stats.firstResponseTime <= 15 && (
              <div className="insight-item insight-success">
                <IconCheckCircle />
                <span>
                  Quick first response time at <strong>{stats.firstResponseTime} min</strong>. Excellent service level!
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Report Footer */}
        <div className="analytics-report-footer">
          <p>Report generated on {new Date().toLocaleString()}</p>
          <p>Ticketing System Analytics Dashboard</p>
        </div>
      </div>

      {/* Empty State */}
      {stats.total === 0 && (
        <section className="analytics-empty">
          <IconTickets />
          <p>No tickets yet. Once tickets are created, analytics will appear here.</p>
        </section>
      )}
    </MainLayout>
  );
};

export default AnalyticsPage;