import { profileActions, profileSummary } from '../data/profileData'
import { getCurrentUser } from './authService'

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
    profileImage: userData.profile_image ?? null,
    avatarPlaceholder: toInitials(resolvedName),
  }
}

export async function getUserProfile() {
  const currentUserId = Number(getCurrentUser()?.id) || 1
  const localUser = getCurrentUser()

  try {
    const response = await fetch(`http://localhost:5000/api/users/${currentUserId}`)
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
