import { useEffect, useMemo, useState } from 'react'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import { getCampusLogs } from '../services/campusLogsService'

function CampusLogsPage() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadLogs(statusFilter) {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const data = await getCampusLogs(statusFilter)
      setLogs(data)
    } catch {
      setErrorMessage('Unable to load campus logs right now.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const statusFilter = filter === 'All' ? undefined : filter
    loadLogs(statusFilter)
  }, [filter])

  const filteredLogs = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => {
      return new Date(b.time).getTime() - new Date(a.time).getTime()
    })
    return sortedLogs
  }, [logs, filter])

  return (
    <div className="page-content campus-logs-page">
      <section className="campus-header">
        <div className="campus-header-row">
          <span className="campus-back">←</span>
          <h2>Campus Logs</h2>
        </div>
      </section>

      <div className="campus-filters">
        {['All', 'IN', 'OUT'].map((option) => (
          <button
            key={option}
            type="button"
            className={`campus-filter${filter === option ? ' active' : ''}`}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Recent Activity">Loading campus logs...</Card>
      ) : (
        <Card title="Recent Activity">
          {filteredLogs.length ? (
            <div className="campus-log-list">
              {filteredLogs.map((log) => (
                <article key={log.id} className="campus-log-card">
                  <div className="campus-log-avatar">
                    {log.profileImage ? (
                      <img src={log.profileImage} alt={log.name} />
                    ) : (
                      log.profilePlaceholder
                    )}
                  </div>
                  <div className="campus-log-content">
                    <small>{log.label}</small>
                    <h4>{log.name}</h4>
                    <p>{log.time}</p>
                  </div>
                  <span className={`campus-log-status ${log.action === 'IN' ? 'in' : 'out'}`}>
                    {log.action}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No logs found" description="Try changing the filter." />
          )}
        </Card>
      )}
    </div>
  )
}

export default CampusLogsPage