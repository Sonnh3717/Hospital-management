import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Role Views
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientBookingPage from './pages/patient/PatientBookingPage';
import ReceptionAppointmentsPage from './pages/reception/ReceptionAppointmentsPage';
import ReceptionPatientsPage from './pages/reception/ReceptionPatientsPage';
import ReceptionWalkInPage from './pages/reception/ReceptionWalkInPage';
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes with Landing Header & Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Patient Portal */}
          <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
            <Route element={<WorkspaceLayout role="PATIENT" />}>
              <Route path="/patient" element={<Navigate to="/patient/appointments" replace />} />
              <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
              <Route path="/patient/book" element={<PatientBookingPage />} />
            </Route>
          </Route>

          {/* Protected Receptionist Portal */}
          <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']} />}>
            <Route element={<WorkspaceLayout role="RECEPTIONIST" />}>
              <Route path="/reception" element={<Navigate to="/reception/appointments" replace />} />
              <Route path="/reception/appointments" element={<ReceptionAppointmentsPage />} />
              <Route path="/reception/patients" element={<ReceptionPatientsPage />} />
              <Route path="/reception/walk-in" element={<ReceptionWalkInPage />} />
            </Route>
          </Route>

          {/* Protected Doctor Portal */}
          <Route element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} />}>
            <Route element={<WorkspaceLayout role="DOCTOR" />}>
              <Route path="/doctor" element={<DoctorDashboardPage />} />
            </Route>
          </Route>

          {/* Protected Admin Fallback */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<Navigate to="/reception" replace />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
