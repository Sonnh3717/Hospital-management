import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProtectedWorkspace from './components/auth/ProtectedWorkspace.jsx';
import ReceptionAppointmentsPage from './pages/reception/ReceptionAppointmentsPage.jsx';
import AssignedPatientsPage from './pages/doctor/AssignedPatientsPage.jsx';
import ClinicalEncounterPage from './pages/doctor/ClinicalEncounterPage.jsx';
import ServiceQueuePage from './pages/medicalservice/ServiceQueuePage.jsx';
import ServiceRequestPage from './pages/medicalservice/ServiceRequestPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<ProtectedWorkspace role="RECEPTIONIST" />}>
        <Route
          path="reception/appointments"
          element={<ReceptionAppointmentsPage />}
        />
      </Route>
      <Route element={<ProtectedWorkspace role="DOCTOR" />}>
        <Route path="doctor/patients" element={<AssignedPatientsPage />} />
        <Route
          path="doctor/encounters/:encounterId"
          element={<ClinicalEncounterPage />}
        />
      </Route>
      <Route element={<ProtectedWorkspace role="MEDICAL_SERVICE_STAFF" />}>
        <Route path="services/queue" element={<ServiceQueuePage />} />
        <Route
          path="services/requests/:requestId"
          element={<ServiceRequestPage />}
        />
      </Route>
    </Routes>
  );
}
