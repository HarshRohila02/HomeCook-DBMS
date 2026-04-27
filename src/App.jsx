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

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
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