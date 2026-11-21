import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'citizen' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Authenticating secure session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If citizen tries to access admin, redirect to citizen dashboard
    if (requiredRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    // If admin tries to access citizen, redirect to admin dashboard
    if (requiredRole === 'citizen') {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};
