import { shuttleSchedule } from '../data/shuttleData'

const SHUTTLE_API_BASE = 'http://localhost:5000/api/shuttles'

function formatTime(timeValue) {
  if (!timeValue) return ''
  const date = new Date(`1970-01-01T${timeValue}`)
  if (Number.isNaN(date.getTime())) return String(timeValue)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function mapShuttle(row) {
  return {
    id: row.id,
    route: row.route ?? '',
    departureTime: formatTime(row.departure_time),
    arrivalTime: formatTime(row.arrival_time),
    seatsAvailable: Number(row.seats_available ?? 0),
  }
}

function mapBooking(row) {
  return {
    id: row.id,
    shuttleId: row.shuttle_id,
    route: row.route ?? '',
    departureTime: formatTime(row.departure_time),
    arrivalTime: formatTime(row.arrival_time),
    status: row.booking_status ?? 'Booked',
    bookedAt: row.booked_at
      ? new Date(row.booked_at).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  }
}

export async function getShuttles() {
  try {
    const response = await fetch(SHUTTLE_API_BASE)
    if (!response.ok) throw new Error(`Failed to fetch shuttles: ${response.status}`)
    const rows = await response.json()
    return rows.map(mapShuttle)
  } catch {
    return shuttleSchedule
  }
}

export async function bookShuttle(data) {
  const response = await fetch(`${SHUTTLE_API_BASE}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    let errorMessage = `Failed to book shuttle: ${response.status}`
    try {
      const result = await response.json()
      errorMessage = result?.message || errorMessage
    } catch {
      // Keep default error message.
    }
    throw new Error(errorMessage)
  }

  const row = await response.json()
  return mapBooking(row)
}

export async function getBookings(userId) {
  try {
    const response = await fetch(`${SHUTTLE_API_BASE}/bookings/${userId}`)
    if (!response.ok) throw new Error(`Failed to fetch bookings: ${response.status}`)
    const rows = await response.json()
    return rows.map(mapBooking)
  } catch {
    return []
  }
}

export async function getShuttleSchedule() {
  return getShuttles()
}