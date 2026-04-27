import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/shared/Card'
import { getDashboardData } from '../services/dashboardService'

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    heroData: null,
    quickModules: [],
    messTabs: [],
    todaysMenu: {},
    dashboardHighlights: [],
  })
  const [activeMealTab, setActiveMealTab] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const data = await getDashboardData()
      setDashboardData(data)
      setActiveMealTab(data.messTabs[0] ?? '')
    }
    loadDashboard()
  }, [])

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
          <h2>{dashboardData.heroData.studentName}</h2>
          <div className="dashboard-hero-meta">
            <span>{dashboardData.heroData.dateLabel}</span>
            <span>{dashboardData.heroData.weatherIcon}</span>
          </div>
          <div className="campus-status">
            <span className="campus-status-home">🏠</span>
            <div>
              <strong>{dashboardData.heroData.campusStatus}</strong>
              <small>{dashboardData.heroData.statusLabel}</small>
            </div>
          </div>
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

      <Card title="Highlights">
        <div className="item-list">
          {dashboardData.dashboardHighlights.map((item) => (
            <div key={item.title} className="item-row">
              <span>{item.title}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage