import { useEffect, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import {
  getShuttles,
  addShuttle,
  updateShuttle,
  deleteShuttle,
} from '../services/shuttleService'

function HostShuttleManagementPage() {
  const [shuttles, setShuttles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    route: '',
    departure_time: '08:00:00',
    arrival_time: '08:30:00',
    seats_available: 15,
  })

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await getShuttles()
        setShuttles(data)
      } catch {
        setErrorMessage('Unable to load shuttle management data right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  function resetForm() {
    setEditingId(null)
    setForm({
      route: '',
      departure_time: '08:00:00',
      arrival_time: '08:30:00',
      seats_available: 15,
    })
  }

  function onEdit(shuttle) {
    setEditingId(shuttle.id)
    setForm({
      route: shuttle.route,
      departure_time: shuttle.rawDepartureTime || '08:00:00',
      arrival_time: shuttle.rawArrivalTime || '08:30:00',
      seats_available: shuttle.seatsAvailable,
    })
  }

  async function onDelete(id) {
    if (!window.confirm('Are you sure you want to delete this shuttle?')) return
    try {
      await deleteShuttle(id)
      setShuttles((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to delete shuttle.')
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    try {
      const payload = { ...form }
      if (editingId) {
        const updated = await updateShuttle(editingId, payload)
        setShuttles((prev) =>
          prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item)),
        )
      } else {
        const created = await addShuttle(payload)
        setShuttles((prev) => [...prev, created])
      }
      resetForm()
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save shuttle.')
    }
  }

  return (
    <div className="page-content host-dashboard-page">
      <section className="host-header">
        <div className="host-header-row">
          <span className="host-back" onClick={() => window.history.back()}>←</span>
          <h2>Shuttle Management</h2>
        </div>
        <p>Manage shuttle routes, timings, and seat availability.</p>
      </section>

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Shuttle Management">Loading management view...</Card>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
          <Card title={editingId ? 'Edit Shuttle' : 'Add New Shuttle'}>
            <form className="review-form" onSubmit={onSubmit}>
              <label htmlFor="shuttle-mgmt-route">Route</label>
              <input
                id="shuttle-mgmt-route"
                type="text"
                value={form.route}
                onChange={(e) => setForm((prev) => ({ ...prev, route: e.target.value }))}
                placeholder="Hostel A -> Academic Block"
                required
              />
              <label htmlFor="shuttle-mgmt-departure">Departure Time</label>
              <input
                id="shuttle-mgmt-departure"
                type="time"
                step="1"
                value={form.departure_time}
                onChange={(e) => setForm((prev) => ({ ...prev, departure_time: e.target.value }))}
                required
              />
              <label htmlFor="shuttle-mgmt-arrival">Arrival Time</label>
              <input
                id="shuttle-mgmt-arrival"
                type="time"
                step="1"
                value={form.arrival_time}
                onChange={(e) => setForm((prev) => ({ ...prev, arrival_time: e.target.value }))}
                required
              />
              <label htmlFor="shuttle-mgmt-seats">Seats Available</label>
              <input
                id="shuttle-mgmt-seats"
                type="number"
                min="0"
                value={form.seats_available}
                onChange={(e) => setForm((prev) => ({ ...prev, seats_available: e.target.value }))}
                required
              />
              <div className="review-submit">
                <Button type="submit">{editingId ? 'Update' : 'Create'} Shuttle</Button>
                {editingId && (
                  <Button variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card title="Existing Shuttles">
            {shuttles.length ? (
              <div className="item-list">
                {shuttles.map((shuttle) => (
                  <article key={shuttle.id} className="item-row">
                    <div>
                      <strong>{shuttle.route}</strong>
                      <small>
                        {shuttle.departureTime} - {shuttle.arrivalTime}
                      </small>
                      <small>Seats: {shuttle.seatsAvailable}</small>
                    </div>
                    <div className="host-claim-actions">
                      <Button onClick={() => onEdit(shuttle)}>Edit</Button>
                      <Button variant="ghost" onClick={() => onDelete(shuttle.id)}>
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No shuttles found"
                description="Add your first shuttle route above."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default HostShuttleManagementPage
