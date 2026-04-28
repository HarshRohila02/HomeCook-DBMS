import { NavLink } from 'react-router-dom'
import { getCurrentUser } from '../../services/authService'

const navLinks = [
  ['/', 'Dashboard'],
  ['/profile', 'Profile'],
  ['/mess-menu', 'Mess Menu'],
  ['/community', 'Community'],
  ['/lost-found', 'Lost & Found'],
  ['/gatepass', 'Gatepass'],
  ['/shuttle', 'Shuttle'],
  ['/campus-logs', 'Campus Logs'],
]

function Sidebar({ isOpen, onClose }) {
  const currentUser = getCurrentUser()
  const isHost = currentUser?.role === 'host'
  const roleAwareLinks = isHost
    ? [
        ...navLinks,
        ['/host', 'Host Dashboard'],
        ['/host/mess-management', 'Host Mess'],
        ['/host/lost-found-claims', 'Host Claims'],
        ['/host/shuttle-management', 'Shuttle Mgmt'],
      ]
    : navLinks

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-label="Close navigation menu"
      />
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">Unisphere</div>
        <nav>
          {roleAwareLinks.map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar