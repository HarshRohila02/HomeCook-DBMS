import { NavLink } from 'react-router-dom'

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
          {navLinks.map(([path, label]) => (
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