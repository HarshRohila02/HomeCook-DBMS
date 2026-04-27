import { useEffect, useState } from 'react'
import Card from '../components/shared/Card'
import { getUserProfile } from '../services/userService'

function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [actions, setActions] = useState([])

  useEffect(() => {
    async function loadProfile() {
      const data = await getUserProfile()
      setProfile(data.profileSummary)
      setActions(data.profileActions)
    }
    loadProfile()
  }, [])

  if (!profile) {
    return (
      <div className="page-content">
        <Card title="Profile">Loading profile...</Card>
      </div>
    )
  }

  return (
    <div className="page-content profile-page">
      <section className="profile-hero">
        <div className="profile-nav">
          <span className="profile-back">←</span>
          <h2>{profile.heading}</h2>
        </div>
        <div className="profile-avatar">{profile.avatarPlaceholder}</div>
      </section>

      <Card>
        <div className="profile-main-card">
          <div className="qr-placeholder">{profile.qrPlaceholder}</div>
          <div className="profile-details">
            <h3>{profile.name}</h3>
            <p>{profile.phone}</p>
            <p>{profile.email}</p>
            <p className="profile-university">
              <span>{profile.universityIcon}</span>
              <span>{profile.university}</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="profile-actions">
        {actions.map((action) => (
          <article key={action.id} className="profile-action-card">
            <div className="profile-action-icon">{action.icon}</div>
            <div>
              <h4>{action.title}</h4>
              <p>{action.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default ProfilePage