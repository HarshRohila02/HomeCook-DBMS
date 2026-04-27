import { useNavigate } from 'react-router-dom'
import { profileSummary } from '../../data/profileData'
import { getCurrentUser, logout } from '../../services/authService'

function Header({ onMenuToggle }) {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="header">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>
      <div>
        <h1>Unisphere Web</h1>
        <div className="header-meta">Modern campus dashboard</div>
      </div>
      <div className="header-user">
        <span className="header-meta">{currentUser?.full_name ?? profileSummary.name}</span>
        {currentUser?.role === 'host' ? <span className="header-role-badge">Host</span> : null}
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}

export default Header