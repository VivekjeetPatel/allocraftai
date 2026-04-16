import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If user's role isn't allowed, redirect to their respective dashboard
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'volunteerHead') return <Navigate to="/volunteer-head" replace />;
    if (role === 'volunteer') return <Navigate to="/volunteer" replace />;
    return <Navigate to="/login" replace />; // Fallback
  }

  return children;
}
