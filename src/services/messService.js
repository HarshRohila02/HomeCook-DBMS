import { messDateOptions, messMenuByDate } from '../data/messMenuData'

const MESS_API_BASE = 'http://localhost:5000/api/mess'
const MESS_DATES_API = 'http://localhost:5000/api/mess/dates'
const MEAL_ORDER = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']

function toShortTime(mysqlTime) {
  if (!mysqlTime) return ''
  return String(mysqlTime).slice(0, 5)
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function normalizeDateKey(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function transformRows(rows) {
  const byDate = {}
  const dateSet = new Set()

  rows.forEach((row) => {
    const dateKey = normalizeDateKey(row.menu_date)
    if (!dateKey) return
    dateSet.add(dateKey)

    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push({
      messMenuId: row.id,
      meal: row.meal_type,
      time: `${toShortTime(row.start_time)} - ${toShortTime(row.end_time)}`,
      items: (row.items_text ?? '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      rating: Number(row.avg_rating ?? 0),
      reviews: Number(row.review_count ?? 0),
    })
  })

  Object.keys(byDate).forEach((dateKey) => {
    byDate[dateKey].sort(
      (a, b) => MEAL_ORDER.indexOf(a.meal) - MEAL_ORDER.indexOf(b.meal),
    )
  })

  const options = Array.from(dateSet)
    .sort()
    .map((dateKey) => ({ id: dateKey, label: formatDateLabel(dateKey) }))

  return {
    messDateOptions: options,
    messMenuByDate: byDate,
  }
}

function getFallback(date) {
  if (date) {
    return {
      messDateOptions: messDateOptions.filter((item) => item.id === date),
      messMenuByDate: {
        [date]: messMenuByDate[date] ?? [],
      },
    }
  }

  return { messDateOptions, messMenuByDate }
}

export async function getMessDates() {
  try {
    const response = await fetch(MESS_DATES_API)
    if (!response.ok) throw new Error(`Failed to fetch mess dates: ${response.status}`)
    const rows = await response.json()
    return rows.map(normalizeDateKey).filter(Boolean).sort()
  } catch {
    return messDateOptions.map((item) => item.id).sort()
  }
}

export async function getMessMenu(date) {
  try {
    const url = date
      ? `${MESS_API_BASE}?date=${encodeURIComponent(date)}`
      : MESS_API_BASE
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch mess menu: ${response.status}`)

    const rows = await response.json()
    return transformRows(rows)
  } catch {
    return getFallback(date)
  }
}

export async function getMessByDate(date) {
  return getMessMenu(date)
}

export async function submitMessReview(payload) {
  const response = await fetch(`${MESS_API_BASE}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to submit review: ${response.status}`)
  }

  return response.json()
}

export async function addMessMenu(data) {
  const response = await fetch(MESS_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result?.message || `Failed to add menu: ${response.status}`)
  }
  return response.json()
}

export async function updateMessMenu(id, data) {
  const response = await fetch(`${MESS_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result?.message || `Failed to update menu: ${response.status}`)
  }
  return response.json()
}

export async function deleteMessMenu(id, userId) {
  const response = await fetch(`${MESS_API_BASE}/${id}?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result?.message || `Failed to delete menu: ${response.status}`)
  }
  return response.json()
}