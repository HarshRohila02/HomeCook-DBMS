import { messDateOptions, messMenuByDate } from '../data/messMenuData'

const MESS_API_BASE = 'http://localhost:5000/api/mess'
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

function transformRows(rows) {
  const byDate = {}
  const dateSet = new Set()

  rows.forEach((row) => {
    const dateKey = row.menu_date
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