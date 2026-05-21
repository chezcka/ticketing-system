import React from 'react';
import { useAuth } from '../../context/useAuth';
import { useLocation } from 'react-router-dom';
import './Header.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/tickets/create': 'New Ticket',
  '/tickets/assigned': 'Assigned Tickets',
  '/analytics': 'Analytics',
  '/users': 'Users',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <span className="header-page-title">{pageTitle}</span>
        </div>
        <div className="header-right">
          <div className="header-user-info">
            <div className="user-avatar-small">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="user-name-small">{user?.fullName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}