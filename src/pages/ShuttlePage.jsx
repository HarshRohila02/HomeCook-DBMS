import { useEffect, useMemo, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import { getCurrentUser } from '../services/authService'
import {
  bookShuttle,
  getBookings,
  getShuttles,
  addShuttle,
  updateShuttle as updateShuttleApi,
  deleteShuttle as deleteShuttleApi,
} from '../services/shuttleService'

function ShuttlePage() {
  const currentUser = getCurrentUser()
  const isHost = currentUser?.role === 'host'
  const userId = Number(currentUser?.id) || 1

  const [activeTab, setActiveTab] = useState('Shuttles')
  const [shuttles, setShuttles] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')

  // Host form state
  const [showForm, setShowForm] = useState(false)
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
        const [shuttleData, bookingData] = await Promise.all([
          getShuttles(),
          isHost ? Promise.resolve([]) : getBookings(userId),
        ])
        setShuttles(shuttleData)
        setBookings(bookingData)
      } catch {
        setErrorMessage('Unable to load shuttle data right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const bookedIds = useMemo(() => new Set(bookings.map((booking) => booking.shuttleId)), [bookings])

  // ── Student booking handler ──
  async function handleBookShuttle(shuttleId) {
    if (bookedIds.has(shuttleId)) return
    const shuttle = shuttles.find((item) => item.id === shuttleId)
    if (!shuttle || shuttle.seatsAvailable <= 0) return

    const nextBooking = {
      ...shuttle,
      shuttleId,
      status: 'Booked',
      bookedAt: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    try {
      const createdBooking = await bookShuttle({
        user_id: userId,
        shuttle_id: shuttleId,
      })
      setBookings((prev) => [createdBooking, ...prev])
      setShuttles((prev) =>
        prev.map((item) =>
          item.id === shuttleId ? { ...item, seatsAvailable: Math.max(0, item.seatsAvailable - 1) } : item,
        ),
      )
      setBookingMessage('')
    } catch (error) {
      const message = error?.message || ''
      const isBusinessRuleFailure =
        message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('no seats')
      if (isBusinessRuleFailure) {
        setBookingMessage(message)
        return
      }

      // Preserve existing fallback behavior when backend is unavailable.
      setBookings((prev) => [nextBooking, ...prev])
      setShuttles((prev) =>
        prev.map((item) =>
          item.id === shuttleId ? { ...item, seatsAvailable: Math.max(0, item.seatsAvailable - 1) } : item,
        ),
      )
      setBookingMessage('Booked locally because backend is unavailable.')
    }

    setActiveTab('Bookings')
  }

  // ── Host CRUD handlers ──
  function resetForm() {
    setEditingId(null)
    setShowForm(false)
    setForm({
      route: '',
      departure_time: '08:00:00',
      arrival_time: '08:30:00',
      seats_available: 15,
    })
  }

  function handleEditClick(shuttle) {
    setEditingId(shuttle.id)
    setShowForm(true)
    setForm({
      route: shuttle.route,
      departure_time: shuttle.rawDepartureTime || '08:00:00',
      arrival_time: shuttle.rawArrivalTime || '08:30:00',
      seats_available: shuttle.seatsAvailable,
    })
  }

  async function handleDeleteClick(id) {
    if (!window.confirm('Are you sure you want to delete this shuttle?')) return
    try {
      await deleteShuttleApi(id)
      setShuttles((prev) => prev.filter((item) => item.id !== id))
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to delete shuttle.')
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault()
    try {
      const payload = { ...form }
      if (editingId) {
        const updated = await updateShuttleApi(editingId, payload)
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
    <div className="page-content shuttle-page">
      <section className="shuttle-header">
        <div className="shuttle-header-row">
          <span className="shuttle-back">←</span>
          <h2>Shuttle</h2>
        </div>
      </section>

      <div className="shuttle-tabs">
        <button
          type="button"
          className={`shuttle-tab${activeTab === 'Shuttles' ? ' active' : ''}`}
          onClick={() => setActiveTab('Shuttles')}
        >
          Shuttles
        </button>
        {!isHost && (
          <button
            type="button"
            className={`shuttle-tab${activeTab === 'Bookings' ? ' active' : ''}`}
            onClick={() => setActiveTab('Bookings')}
          >
            Bookings
          </button>
        )}
      </div>

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}
      {bookingMessage ? <p className="header-meta">{bookingMessage}</p> : null}

      {isLoading ? (
        <Card title="Shuttle">Loading shuttle data...</Card>
      ) : activeTab === 'Shuttles' ? (
        <>
          {/* Host: Add Shuttle button */}
          {isHost && !showForm && (
            <div style={{ marginBottom: '1rem' }}>
              <Button onClick={() => { setEditingId(null); setShowForm(true) }}>
                + Add Shuttle
              </Button>
            </div>
          )}

          {/* Host: Add/Edit form */}
          {isHost && showForm && (
            <Card title={editingId ? 'Edit Shuttle' : 'Add New Shuttle'}>
              <form className="review-form" onSubmit={handleFormSubmit}>
                <label htmlFor="shuttle-route">Route</label>
                <input
                  id="shuttle-route"
                  type="text"
                  value={form.route}
                  onChange={(e) => setForm((prev) => ({ ...prev, route: e.target.value }))}
                  placeholder="Hostel A -> Academic Block"
                  required
                />
                <label htmlFor="shuttle-departure">Departure Time</label>
                <input
                  id="shuttle-departure"
                  type="time"
                  step="1"
                  value={form.departure_time}
                  onChange={(e) => setForm((prev) => ({ ...prev, departure_time: e.target.value }))}
                  required
                />
                <label htmlFor="shuttle-arrival">Arrival Time</label>
                <input
                  id="shuttle-arrival"
                  type="time"
                  step="1"
                  value={form.arrival_time}
                  onChange={(e) => setForm((prev) => ({ ...prev, arrival_time: e.target.value }))}
                  required
                />
                <label htmlFor="shuttle-seats">Seats Available</label>
                <input
                  id="shuttle-seats"
                  type="number"
                  min="0"
                  value={form.seats_available}
                  onChange={(e) => setForm((prev) => ({ ...prev, seats_available: e.target.value }))}
                  required
                />
                <div className="review-submit">
                  <Button type="submit">{editingId ? 'Update' : 'Create'} Shuttle</Button>
                  <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Available Shuttles">
            {shuttles.length ? (
              <div className="shuttle-list">
                {shuttles.map((shuttle) => {
                  const alreadyBooked = bookedIds.has(shuttle.id)
                  const full = shuttle.seatsAvailable <= 0
                  return (
                    <article key={shuttle.id} className="shuttle-card-row">
                      <div>
                        <h4>{shuttle.route}</h4>
                        <p>
                          {shuttle.departureTime} - {shuttle.arrivalTime}
                        </p>
                        <small>Seats available: {shuttle.seatsAvailable}</small>
                      </div>
                      {isHost ? (
                        <div className="host-claim-actions">
                          <Button onClick={() => handleEditClick(shuttle)}>Edit</Button>
                          <Button variant="ghost" onClick={() => handleDeleteClick(shuttle.id)}>
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleBookShuttle(shuttle.id)}
                          disabled={alreadyBooked || full}
                        >
                          {alreadyBooked ? 'Booked' : full ? 'Full' : 'Book'}
                        </Button>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="No shuttles available"
                description="New trips will appear here."
              />
            )}
          </Card>
        </>
      ) : (
        <Card title="My Bookings">
          {bookings.length ? (
            <div className="shuttle-list">
              {bookings.map((booking) => (
                <article key={`${booking.shuttleId}-${booking.bookedAt}`} className="shuttle-card-row">
                  <div>
                    <h4>{booking.route}</h4>
                    <p>
                      {booking.departureTime} - {booking.arrivalTime}
                    </p>
                    <small>Booked on: {booking.bookedAt}</small>
                  </div>
                  <span className="shuttle-booked-badge">Booked</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No bookings found"
              description="Your booked shuttles will appear here."
            />
          )}
        </Card>
      )}
    </div>
  )
}

export default ShuttlePage