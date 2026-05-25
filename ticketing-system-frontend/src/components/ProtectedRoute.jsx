import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * ProtectedRoute - Prevents deactivated users from accessing protected routes
 * Redirects to login without refresh if user is deactivated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuth, user } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is deactivated (status = INACTIVE)
  if (user?.status === 'INACTIVE' || user?.active === false) {
    // Clear auth data to prevent infinite refresh loops
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    
    // Redirect to login without refresh
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and active - allow access
  return children;
};

export default ProtectedRoute;