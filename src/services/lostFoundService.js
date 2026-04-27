import { claimedItems, foundItems, lostItems } from '../data/lostFoundData'

const LOST_FOUND_API_BASE = 'http://localhost:5000/api/lost-found/items'
const LOST_FOUND_CLAIMS_API = 'http://localhost:5000/api/lost-found/claims'

function formatDateTime(dateValue) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart}, ${timePart}`
}

function mapItem(row) {
  return {
    id: row.id,
    createdByUserId: row.created_by_user_id,
    tokenId: row.token_code || String(row.id),
    itemName: row.item_name,
    location: row.location,
    status: row.status,
    dateTime: formatDateTime(row.reported_at),
    imageUrl: row.image_url ?? '',
    description: row.description ?? '',
  }
}

function fallbackData(status) {
  if (status === 'found') return foundItems
  if (status === 'lost') return lostItems
  if (status === 'claimed') return claimedItems
  return [...foundItems, ...lostItems, ...claimedItems]
}

export async function getLostFoundItems(status) {
  try {
    const url = status
      ? `${LOST_FOUND_API_BASE}?status=${encodeURIComponent(status)}`
      : LOST_FOUND_API_BASE
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch items: ${response.status}`)
    const rows = await response.json()
    return rows.map(mapItem)
  } catch {
    return fallbackData(status)
  }
}

export async function createLostFoundItem(payload) {
  const response = await fetch(LOST_FOUND_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to create item: ${response.status}`)
  }

  const row = await response.json()
  return mapItem(row)
}

export async function getLostFoundData() {
  const [backendFound, backendLost, backendClaimed] = await Promise.all([
    getLostFoundItems('found'),
    getLostFoundItems('lost'),
    getLostFoundItems('claimed'),
  ])

  return {
    foundItems: backendFound,
    lostItems: backendLost,
    claimedItems: backendClaimed,
  }
}

export async function claimItem(itemId, data) {
  const response = await fetch(`${LOST_FOUND_API_BASE}/${itemId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result?.message || `Failed to submit claim: ${response.status}`)
  }

  return response.json()
}

export async function getClaims(userId) {
  try {
    const url = `${LOST_FOUND_CLAIMS_API}?user_id=${encodeURIComponent(userId)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch claims: ${response.status}`)
    return response.json()
  } catch {
    return []
  }
}

export async function updateClaimStatus(claimId, status, userId) {
  const response = await fetch(`${LOST_FOUND_CLAIMS_API}/${claimId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, user_id: userId }),
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result?.message || `Failed to update claim: ${response.status}`)
  }

  return response.json()
}