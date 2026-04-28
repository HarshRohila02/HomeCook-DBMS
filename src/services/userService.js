import { profileActions, profileSummary } from '../data/profileData'
import { getCurrentUser } from './authService'

const USERS_API_BASE = 'http://localhost:5000/api/users'

function toInitials(name) {
  if (!name) return profileSummary.avatarPlaceholder
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function buildProfileSummary(userData) {
  const resolvedName = userData.full_name ?? profileSummary.name
  return {
    ...profileSummary,
    name: resolvedName,
    phone: userData.phone ?? profileSummary.phone,
    email: userData.email ?? profileSummary.email,
    university: userData.university ?? profileSummary.university,
    role: userData.role ?? 'student',
    profileImage: userData.profile_image ?? null,
    avatarPlaceholder: toInitials(resolvedName),
  }
}

export async function getUserProfile() {
  const currentUserId = Number(getCurrentUser()?.id) || 1
  const localUser = getCurrentUser()

  try {
    const response = await fetch(`${USERS_API_BASE}/${currentUserId}`)
    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.status}`)
    }

    const userData = await response.json()
    return {
      profileSummary: buildProfileSummary(userData),
      profileActions,
    }
  } catch {
    return {
      profileSummary: buildProfileSummary(localUser ?? {}),
      profileActions,
    }
  }
}

export async function changePassword(userId, currentPassword, newPassword) {
  const response = await fetch(`${USERS_API_BASE}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, currentPassword, newPassword }),
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result?.message || `Failed to change password: ${response.status}`)
  }

  return response.json()
}

export async function submitFeedback(userId, message) {
  const response = await fetch(`${USERS_API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, message }),
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result?.message || `Failed to submit feedback: ${response.status}`)
  }

  return response.json()
}
