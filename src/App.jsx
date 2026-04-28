import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import MessMenuPage from './pages/MessMenuPage'
import CommunityPage from './pages/CommunityPage'
import LostFoundPage from './pages/LostFoundPage'
import GatepassPage from './pages/GatepassPage'
import ShuttlePage from './pages/ShuttlePage'
import CampusLogsPage from './pages/CampusLogsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HostDashboardPage from './pages/HostDashboardPage'
import HostMessManagementPage from './pages/HostMessManagementPage'
import HostLostFoundClaimsPage from './pages/HostLostFoundClaimsPage'
import HostShuttleManagementPage from './pages/HostShuttleManagementPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
import { getCurrentUser } from './services/authService'

function ProtectedLayout() {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return <AppShell />
}

function HostRoute({ children }) {
  const currentUser = getCurrentUser()
  const isHost = currentUser?.role === 'host'
  return isHost ? children : <AccessDeniedPage />
}

function App() {
  const currentUser = getCurrentUser()

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={currentUser ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/mess-menu" element={<MessMenuPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/lost-found" element={<LostFoundPage />} />
        <Route path="/gatepass" element={<GatepassPage />} />
        <Route path="/shuttle" element={<ShuttlePage />} />
        <Route path="/campus-logs" element={<CampusLogsPage />} />
        <Route path="/host" element={<HostRoute><HostDashboardPage /></HostRoute>} />
        <Route
          path="/host/mess-management"
          element={<HostRoute><HostMessManagementPage /></HostRoute>}
        />
        <Route
          path="/host/lost-found-claims"
          element={<HostRoute><HostLostFoundClaimsPage /></HostRoute>}
        />
        <Route
          path="/host/shuttle-management"
          element={<HostRoute><HostShuttleManagementPage /></HostRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App