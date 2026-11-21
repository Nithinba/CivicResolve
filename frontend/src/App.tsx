import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TrackComplaint } from './pages/TrackComplaint';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { SubmitComplaint } from './pages/SubmitComplaint';
import { ComplaintDetails } from './pages/ComplaintDetails';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminComplaints } from './pages/AdminComplaints';
import { AdminComplaintDetails } from './pages/AdminComplaintDetails';
import { Analytics } from './pages/Analytics';

export const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/track" element={<TrackComplaint />} />

        {/* Citizen Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit-complaint"
          element={
            <ProtectedRoute requiredRole="citizen">
              <SubmitComplaint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute requiredRole="citizen">
              <ComplaintDetails />
            </ProtectedRoute>
          }
        />

        {/* Administrator Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/complaints/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminComplaintDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requiredRole="admin">
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
