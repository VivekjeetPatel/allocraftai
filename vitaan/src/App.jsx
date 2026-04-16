import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './components/Auth/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProjects from './pages/Admin/Projects';
import AdminVolunteers from './pages/Admin/Volunteers';
import AdminQueryBoard from './pages/Admin/QueryBoard';

// Volunteer Head Pages
import HeadMyProjects from './pages/VolunteerHead/MyProjects';
import HeadTaskManagement from './pages/VolunteerHead/TaskManagement';
import HeadTeamMonitoring from './pages/VolunteerHead/TeamMonitoring';
import HeadQueryBoard from './pages/VolunteerHead/QueryBoard';

// Volunteer Pages
import VolunteerTaskKanban from './pages/Volunteer/TaskKanban';
import VolunteerTeamMembers from './pages/Volunteer/TeamMembers';
import VolunteerQueryBoard from './pages/Volunteer/QueryBoard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
            <Route path="queries" element={<AdminQueryBoard />} />
          </Route>

          {/* Volunteer Head Routes */}
          <Route 
            path="/volunteer-head" 
            element={
              <ProtectedRoute allowedRoles={['volunteerHead']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HeadMyProjects />} />
            <Route path="tasks" element={<HeadTaskManagement />} />
            <Route path="team" element={<HeadTeamMonitoring />} />
            <Route path="queries" element={<HeadQueryBoard />} />
          </Route>

          {/* Volunteer Routes */}
          <Route 
            path="/volunteer" 
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<VolunteerTaskKanban />} />
            <Route path="team" element={<VolunteerTeamMembers />} />
            <Route path="queries" element={<VolunteerQueryBoard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
