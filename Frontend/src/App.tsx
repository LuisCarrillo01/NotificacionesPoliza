import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { ProtectedRoute } from './app/ProtectedRoute'
import { RoleRoute } from './app/RoleRoute'
import { AuthProvider } from './contexts/AuthProvider'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { EmergencyDetailPage } from './features/emergencies/EmergencyDetailPage'
import { EmergenciesPage } from './features/emergencies/EmergenciesPage'
import { NewEmergencyPage } from './features/emergencies/NewEmergencyPage'
import { LoginPage } from './features/auth/LoginPage'
import { NotificationDetailPage } from './features/notifications/NotificationDetailPage'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ReportsPage } from './features/reports/ReportsPage'
import { emergencyAccessRoles } from './shared/authorization/roles'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="emergencies"
              element={
                <RoleRoute allowedRoles={emergencyAccessRoles} redirectTo="/app/notifications">
                  <EmergenciesPage />
                </RoleRoute>
              }
            />
            <Route
              path="emergencies/new"
              element={
                <RoleRoute allowedRoles={['registrador_emergencia']} redirectTo="/app/notifications">
                  <NewEmergencyPage />
                </RoleRoute>
              }
            />
            <Route
              path="emergencies/:emergencyId"
              element={
                <RoleRoute allowedRoles={emergencyAccessRoles} redirectTo="/app/notifications">
                  <EmergencyDetailPage />
                </RoleRoute>
              }
            />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="notifications/:notificationId" element={<NotificationDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/:reportId" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
