import { campusLogs } from '../data/campusLogsData'

const CAMPUS_LOGS_API_BASE = 'http://localhost:5000/api/campus-logs'

function formatDateTime(dateValue) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function mapCampusLog(row) {
  return {
    id: row.id,
    name: row.student_name ?? row.name ?? 'Unknown Student',
    action: row.status ?? row.action ?? '',
    time: formatDateTime(row.log_time ?? row.time),
    profilePlaceholder: row.profile_placeholder ?? row.profilePlaceholder ?? 'U',
    profileImage: row.profile_image ?? row.profileImage ?? '',
    label: 'Campus Log',
  }
}

function getFallbackLogs(status) {
  if (!status) return campusLogs
  return campusLogs.filter((log) => log.action === status)
}

export async function getCampusLogs(status) {
  try {
    const url = status ? `${CAMPUS_LOGS_API_BASE}?status=${encodeURIComponent(status)}` : CAMPUS_LOGS_API_BASE
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch campus logs: ${response.status}`)
    const rows = await response.json()
    return rows.map(mapCampusLog)
  } catch {
    return getFallbackLogs(status)
  }
}

export async function createCampusLog(data) {
  const response = await fetch(CAMPUS_LOGS_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to create campus log: ${response.status}`)
  }

  const row = await response.json()
  return mapCampusLog(row)
}