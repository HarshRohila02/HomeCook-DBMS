import { gatepassRequests } from '../data/gatepassData'

const GATEPASS_API_BASE = 'http://localhost:5000/api/gatepasses'

function formatDate(dateValue) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(timeValue) {
  if (!timeValue) return ''
  const baseDate = `1970-01-01T${timeValue}`
  const date = new Date(baseDate)
  if (Number.isNaN(date.getTime())) return String(timeValue)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatStatus(statusValue) {
  if (!statusValue) return 'pending'
  const normalized = String(statusValue).trim().toLowerCase()
  if (!normalized) return 'pending'
  if (normalized === 'requested') return 'Pending'
  return normalized[0].toUpperCase() + normalized.slice(1)
}

function mapGatepass(row) {
  return {
    id: row.gatepass_code ?? `GP-${row.id}`,
    reason: row.reason ?? '',
    destination: row.destination ?? '',
    date: formatDate(row.date),
    timeOut: formatTime(row.time_out),
    expectedReturn: formatTime(row.expected_return_time),
    status: formatStatus(row.status),
    gatepassId: row.id,
  }
}

export async function getGatepasses() {
  try {
    const response = await fetch(GATEPASS_API_BASE)
    if (!response.ok) throw new Error(`Failed to fetch gatepasses: ${response.status}`)
    const rows = await response.json()
    return rows.map(mapGatepass)
  } catch {
    return gatepassRequests
  }
}

export async function getGatepassById(id) {
  try {
    const response = await fetch(`${GATEPASS_API_BASE}/${id}`)
    if (!response.ok) throw new Error(`Failed to fetch gatepass: ${response.status}`)
    const row = await response.json()
    return mapGatepass(row)
  } catch {
    const needle = String(id).toLowerCase().replace('gp-', '')
    return (
      gatepassRequests.find((item) => {
        const itemId = String(item.id).toLowerCase()
        return itemId === `gp-${needle}` || itemId === needle
      }) ?? null
    )
  }
}

export async function createGatepass(data) {
  const response = await fetch(GATEPASS_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to create gatepass: ${response.status}`)
  }
  const row = await response.json()
  return mapGatepass(row)
}