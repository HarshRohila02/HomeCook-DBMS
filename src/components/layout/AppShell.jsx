import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../shared/Sidebar'
import Header from '../shared/Header'

function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [mobileMenuOpen])

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <main className="main-pane">
        <Header onMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell