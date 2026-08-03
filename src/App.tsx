import { Navigate, Route, Routes } from 'react-router-dom'
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/components/layout/ProtectedRoute'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminStatsPage } from '@/pages/admin/AdminStatsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { DoctorConsultationsPage } from '@/pages/doctor/DoctorConsultationsPage'
import { DoctorConsultationPage } from '@/pages/doctor/DoctorConsultationPage'
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard'
import { DoctorPatientDetailPage } from '@/pages/doctor/DoctorPatientDetailPage'
import { DoctorPatientsPage } from '@/pages/doctor/DoctorPatientsPage'
import { LabDashboard } from '@/pages/lab/LabDashboard'
import { LabRequestsPage } from '@/pages/lab/LabRequestsPage'
import { LoginPage } from '@/pages/LoginPage'
import { PatientDashboard } from '@/pages/patient/PatientDashboard'
import { PatientPrescriptionsPage } from '@/pages/patient/PatientPrescriptionsPage'
import { PatientSuiviPage } from '@/pages/patient/PatientSuiviPage'
import { SplashPage } from '@/pages/SplashPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/stats" element={<AdminStatsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
        <Route path="/doctor/patients/:id" element={<DoctorPatientDetailPage />} />
        <Route
          path="/doctor/consultations"
          element={<DoctorConsultationsPage />}
        />
        <Route
          path="/doctor/consultations/:id"
          element={<DoctorConsultationPage />}
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['lab']} />}>
        <Route path="/lab" element={<LabDashboard />} />
        <Route path="/lab/requests" element={<LabRequestsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route path="/patient" element={<PatientDashboard />} />
        <Route
          path="/patient/prescriptions"
          element={<PatientPrescriptionsPage />}
        />
        <Route path="/patient/suivi" element={<PatientSuiviPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
