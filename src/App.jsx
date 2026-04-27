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
import { getCurrentUser } from './services/authService'

function ProtectedLayout() {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return <AppShell />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App