import { Link } from 'react-router-dom'
import Card from '../components/shared/Card'

function AccessDeniedPage() {
  return (
    <div className="page-content access-denied-page">
      <Card title="Access Denied">
        <p className="header-meta">You do not have permission to view this page.</p>
        <div className="access-denied-actions">
          <Link to="/" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default AccessDeniedPage
