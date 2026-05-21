import React from 'react';
import { useAuth } from '../context/useAuth';
import { Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import ClientDashboard from '../components/Dashboard/ClientDashboard';
import AgentDashboard from '../components/Dashboard/AgentDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'CLIENT':
        return <ClientDashboard user={user} />;
      case 'SUPPORT_AGENT':
        return <AgentDashboard user={user} />;
      case 'ADMIN':
        return <AdminDashboard user={user} />;
      default:
        return (
          <div className="dashboard-error">
            <h2>Unknown Role</h2>
            <p>Your role "{user.role}" is not recognized.</p>
          </div>
        );
    }
  };

  return (
    <MainLayout>
      {renderDashboard()}
    </MainLayout>
  );
}