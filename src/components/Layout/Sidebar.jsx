import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { hasRole, ROLES } from '../../utils/permissions';
import './Sidebar.css';

const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Ticket: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  ClipboardList: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getMenuItems = () => {
    const commonItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <Icons.Dashboard />,
        path: '/dashboard',
        roles: [ROLES.CLIENT, ROLES.SUPPORT_AGENT, ROLES.ADMIN],
      },
    ];

    const clientItems = [
      {
        id: 'my-tickets',
        label: 'My Tickets',
        icon: <Icons.Ticket />,
        path: '/tickets',
        roles: [ROLES.CLIENT],
      },
      {
        id: 'create-ticket',
        label: 'New Ticket',
        icon: <Icons.Plus />,
        path: '/tickets/create',
        roles: [ROLES.CLIENT],
      },
    ];

    const agentItems = [
      {
        id: 'assigned-tickets',
        label: 'Assigned',
        icon: <Icons.ClipboardList />,
        path: '/tickets/assigned',
        roles: [ROLES.SUPPORT_AGENT],
      },
      {
        id: 'all-tickets',
        label: 'All Tickets',
        icon: <Icons.Ticket />,
        path: '/tickets',
        roles: [ROLES.SUPPORT_AGENT, ROLES.ADMIN],
      },
    ];

    const adminItems = [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <Icons.BarChart />,
        path: '/analytics',
        roles: [ROLES.ADMIN],
      },
      {
        id: 'users',
        label: 'Users',
        icon: <Icons.Users />,
        path: '/users',
        roles: [ROLES.ADMIN],
      },
    ];

    const profileItems = [
      {
        id: 'profile',
        label: 'Profile',
        icon: <Icons.User />,
        path: '/profile',
        roles: [ROLES.CLIENT, ROLES.SUPPORT_AGENT, ROLES.ADMIN],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: <Icons.Settings />,
        path: '/settings',
        roles: [ROLES.CLIENT, ROLES.SUPPORT_AGENT, ROLES.ADMIN],
      },
    ];

    let items = [...commonItems];

    if (hasRole(user.role, ROLES.CLIENT)) {
      items = [...items, ...clientItems];
    }

    if (hasRole(user.role, [ROLES.SUPPORT_AGENT, ROLES.ADMIN])) {
      items = [...items, ...agentItems];
    }

    if (hasRole(user.role, ROLES.ADMIN)) {
      items = [...items, ...adminItems];
    }

    items = [...items, ...profileItems];

    return items.filter(item => item.roles.includes(user.role));
  };

  const menuItems = getMenuItems();
  
  const isActive = (path) => {
    // Handle analytics and reports paths
    if ((path === '/analytics' || path === '/reports')) {
      return location.pathname === '/analytics' || location.pathname === '/reports';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-brand">
          <span className="sidebar-brand-icon">
            <Icons.Ticket />
          </span>
          <span className="sidebar-brand-text">Ticketing</span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map(item => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon"><Icons.LogOut /></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}