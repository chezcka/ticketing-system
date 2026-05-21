import React from 'react';
import { useAuth } from '../context/useAuth';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import './MainLayout.css';
 
export default function MainLayout({ children }) {
  const { user, isLoading } = useAuth();
 
  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
 
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="layout-content">
        <Header />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}