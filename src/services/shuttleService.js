import { shuttleSchedule } from '../data/shuttleData'

const SHUTTLE_API_BASE = 'http://localhost:5000/api/shuttles'

function formatTime(timeValue) {
  if (!timeValue) return ''
  const date = new Date(`1970-01-01T${timeValue}`)
  if (Number.isNaN(date.getTime())) return String(timeValue)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function toTimeInput(timeValue) {
  if (!timeValue) return ''
  const raw = String(timeValue)
  if (raw.length >= 5 && raw.includes(':')) return raw.slice(0, 8)
  return raw
}

function mapShuttle(row) {
  return {
    id: row.id,
    route: row.route ?? '',
    departureTime: formatTime(row.departure_time),
    arrivalTime: formatTime(row.arrival_time),
    rawDepartureTime: toTimeInput(row.departure_time),
    rawArrivalTime: toTimeInput(row.arrival_time),
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

export async function addShuttle(data) {
  try {
    const response = await fetch(SHUTTLE_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to add shuttle')
    const row = await response.json()
    return mapShuttle(row)
  } catch {
    return {
      id: `SH-${Math.floor(100 + Math.random() * 900)}`,
      ...data,
      departureTime: formatTime(data.departure_time),
      arrivalTime: formatTime(data.arrival_time),
      rawDepartureTime: toTimeInput(data.departure_time),
      rawArrivalTime: toTimeInput(data.arrival_time),
      seatsAvailable: Number(data.seats_available),
    }
  }
}

export async function updateShuttle(id, data) {
  try {
    const response = await fetch(`${SHUTTLE_API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update shuttle')
    const row = await response.json()
    return mapShuttle(row)
  } catch {
    return {
      id,
      ...data,
      departureTime: formatTime(data.departure_time),
      arrivalTime: formatTime(data.arrival_time),
      rawDepartureTime: toTimeInput(data.departure_time),
      rawArrivalTime: toTimeInput(data.arrival_time),
      seatsAvailable: Number(data.seats_available),
    }
  }
}

export async function deleteShuttle(id) {
  try {
    const response = await fetch(`${SHUTTLE_API_BASE}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete shuttle')
    return true
  } catch {
    return true
  }
}