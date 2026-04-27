import { profileActions, profileSummary } from '../data/profileData'

function buildProfileSummary(userData) {
  return {
    ...profileSummary,
    name: userData.full_name ?? profileSummary.name,
    phone: userData.phone ?? profileSummary.phone,
    email: userData.email ?? profileSummary.email,
    university: userData.university ?? profileSummary.university,
    profileImage: userData.profile_image ?? null,
  }
}

export async function getUserProfile() {
  try {
    const response = await fetch('http://localhost:5000/api/users/1')
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
      profileSummary,
      profileActions,
    }
  }
}
