import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/shared/Card'
import { getCurrentUser } from '../services/authService'
import { getDashboardData } from '../services/dashboardService'
import { getLatestCampusStatus } from '../services/gatepassService'

function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const currentUserId = Number(currentUser?.id) || 1
  const [dashboardData, setDashboardData] = useState({
    heroData: null,
    quickModules: [],
    messTabs: [],
    todaysMenu: {},
  })
  const [activeMealTab, setActiveMealTab] = useState('')
  const [campusStatus, setCampusStatus] = useState('IN')

  useEffect(() => {
    async function loadDashboard() {
      const data = await getDashboardData()
      setDashboardData(data)
      setActiveMealTab(data.messTabs[0] ?? '')
    }
    loadDashboard()
  }, [])

  useEffect(() => {
    async function loadCampusStatus() {
      const latest = await getLatestCampusStatus(currentUserId)
      setCampusStatus(latest?.status === 'OUT' ? 'OUT' : 'IN')
    }
    loadCampusStatus()
  }, [currentUserId])

  const activeMenuItems = useMemo(
    () => dashboardData.todaysMenu[activeMealTab] ?? [],
    [activeMealTab, dashboardData.todaysMenu],
  )

  if (!dashboardData.heroData) {
    return (
      <div className="page-content dashboard-page">
        <Card title="Dashboard">Loading dashboard...</Card>
      </div>
    )
  }

  return (
    <div className="page-content dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-hero-greeting">{dashboardData.heroData.greeting}</p>
          <h2>{currentUser?.full_name ?? dashboardData.heroData.studentName}</h2>
          <div className="dashboard-hero-meta">
            <span>{dashboardData.heroData.dateLabel}</span>
            <span>{dashboardData.heroData.weatherIcon}</span>
          </div>
          <button
            type="button"
            className={`campus-status campus-status-btn ${campusStatus === 'OUT' ? 'status-out' : 'status-in'}`}
            onClick={() => navigate('/campus-logs')}
          >
            <span className="campus-status-home">🏠</span>
            <div>
              <strong>{campusStatus === 'OUT' ? 'OUT CAMPUS' : 'IN CAMPUS'}</strong>
              <small>{dashboardData.heroData.statusLabel}</small>
            </div>
          </button>
        </div>
        <div className="hero-side">
          <div className="profile-badge">{dashboardData.heroData.profilePlaceholder}</div>
          <div className="hero-illustration">{dashboardData.heroData.illustrationPlaceholder}</div>
        </div>
      </section>

      <section className="quick-grid">
        {dashboardData.quickModules.map((module) => (
          <Link to={module.route} key={module.name} className="quick-card">
            <div>
              <h3>{module.name}</h3>
              <p>{module.subtitle}</p>
            </div>
            <div className="quick-art">{module.placeholder}</div>
          </Link>
        ))}
      </section>

      <Card title="Mess Preview">
        <div className="mess-tabs">
          {dashboardData.messTabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={`mess-tab${activeMealTab === tab ? ' active' : ''}`}
              onClick={() => setActiveMealTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mess-items">
          {activeMenuItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage