import { useEffect, useMemo, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import { getShuttleSchedule } from '../services/shuttleService'

function ShuttlePage() {
  const [activeTab, setActiveTab] = useState('Shuttles')
  const [shuttles, setShuttles] = useState([])
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    async function loadShuttles() {
      const data = await getShuttleSchedule()
      setShuttles(data)
    }
    loadShuttles()
  }, [])

  const bookedIds = useMemo(() => new Set(bookings.map((booking) => booking.id)), [bookings])

  function bookShuttle(shuttleId) {
    if (bookedIds.has(shuttleId)) return
    const shuttle = shuttles.find((item) => item.id === shuttleId)
    if (!shuttle || shuttle.seatsAvailable <= 0) return

    setShuttles((prev) =>
      prev.map((item) =>
        item.id === shuttleId
          ? { ...item, seatsAvailable: item.seatsAvailable - 1 }
          : item,
      ),
    )

    const nextBooking = {
      ...shuttle,
      bookedAt: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setBookings((prev) => [nextBooking, ...prev])
    setActiveTab('Bookings')
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
        <button
          type="button"
          className={`shuttle-tab${activeTab === 'Bookings' ? ' active' : ''}`}
          onClick={() => setActiveTab('Bookings')}
        >
          Bookings
        </button>
      </div>

      {activeTab === 'Shuttles' ? (
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
                    <Button
                      onClick={() => bookShuttle(shuttle.id)}
                      disabled={alreadyBooked || full}
                    >
                      {alreadyBooked ? 'Booked' : full ? 'Full' : 'Book'}
                    </Button>
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
      ) : (
        <Card title="My Bookings">
          {bookings.length ? (
            <div className="shuttle-list">
              {bookings.map((booking) => (
                <article key={`${booking.id}-${booking.bookedAt}`} className="shuttle-card-row">
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