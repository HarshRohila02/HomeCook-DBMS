import { profileSummary } from '../../data/profileData'

function Header({ onMenuToggle }) {
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
        <div className="header-meta">Modern campus dashboard (dummy data mode)</div>
      </div>
      <div className="header-meta">{profileSummary.name}</div>
    </header>
  )
}

export default Header