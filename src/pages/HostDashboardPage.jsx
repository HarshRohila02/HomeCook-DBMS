import { Link } from 'react-router-dom'
import Card from '../components/shared/Card'

const hostCards = [
  {
    id: 'mess',
    title: 'Mess Management',
    description: 'Add and update daily mess menu records.',
    route: '/host/mess-management',
  },
  {
    id: 'lost-found',
    title: 'Lost & Found Claims',
    description: 'Review and approve item claims.',
    route: '/host/lost-found-claims',
  },
  { id: 'gatepass', title: 'Gatepass Approvals', description: 'Approve or reject pending gatepass requests.', route: '/gatepass' },
  {
    id: 'shuttle',
    title: 'Shuttle Management',
    description: 'Manage shuttle schedules and seat availability.',
    route: '/host/shuttle-management',
  },
  { id: 'campus-logs', title: 'Campus Logs', description: 'View and monitor campus IN/OUT logs.', route: '/campus-logs' },
]

function HostDashboardPage() {
  return (
    <div className="page-content host-dashboard-page">
      <section className="host-header">
        <div className="host-header-row">
          <span className="host-back">←</span>
          <h2>Host Dashboard</h2>
        </div>
        <p>Administrative controls for campus operations.</p>
      </section>

      <div className="grid-2">
        {hostCards.map((card) => (
          <Card key={card.id} title={card.title}>
            <p className="header-meta">{card.description}</p>
            {card.route ? (
              <div className="access-denied-actions">
                <Link to={card.route} className="btn btn-primary">
                  Open
                </Link>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  )
}

export default HostDashboardPage
