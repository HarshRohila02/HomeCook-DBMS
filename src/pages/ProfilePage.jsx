import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import Modal from '../components/shared/Modal'
import { getCurrentUser, logout } from '../services/authService'
import {
  getUserProfile,
  changePassword as changePasswordApi,
  submitFeedback as submitFeedbackApi,
} from '../services/userService'

function ProfilePage() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const currentUserId = Number(currentUser?.id) || 1
  const isHost = currentUser?.role === 'host'

  const [profile, setProfile] = useState(null)
  const [actions, setActions] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Info modals
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showSurveysModal, setShowSurveysModal] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setErrorMessage('')
      try {
        const data = await getUserProfile()
        setProfile(data.profileSummary)
        setActions(data.profileActions)
      } catch {
        setErrorMessage('Unable to load profile right now.')
      }
    }
    loadProfile()
  }, [])

  function handleActionClick(actionId) {
    switch (actionId) {
      case 'change-password':
        setCurrentPassword('')
        setNewPassword('')
        setPasswordMessage('')
        setShowPasswordModal(true)
        break
      case 'blocked-users':
        setShowBlockedModal(true)
        break
      case 'feedback':
        setFeedbackText('')
        setFeedbackMessage('')
        setShowFeedbackModal(true)
        break
      case 'surveys':
        setShowSurveysModal(true)
        break
      case 'logout':
        logout()
        navigate('/login', { replace: true })
        break
      default:
        break
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')
    try {
      const result = await changePasswordApi(currentUserId, currentPassword, newPassword)
      setPasswordMessage(result?.message || 'Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error) {
      setPasswordMessage(error?.message || 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleSubmitFeedback(event) {
    event.preventDefault()
    setFeedbackLoading(true)
    setFeedbackMessage('')
    try {
      const result = await submitFeedbackApi(currentUserId, feedbackText)
      setFeedbackMessage(result?.message || 'Feedback submitted! Thank you.')
      setFeedbackText('')
    } catch (error) {
      setFeedbackMessage(error?.message || 'Failed to submit feedback.')
    } finally {
      setFeedbackLoading(false)
    }
  }

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

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      <Card>
        <div className="profile-main-card">
          <div className="qr-placeholder">{profile.qrPlaceholder}</div>
          <div className="profile-details">
            <h3>{profile.name}</h3>
            {profile.phone ? <p>{profile.phone}</p> : null}
            <p>{profile.email}</p>
            <p className="profile-university">
              <span>{profile.universityIcon}</span>
              <span>{profile.university}</span>
            </p>
            <p style={{ marginTop: '4px' }}>
              <span
                className="gatepass-status"
                style={{ textTransform: 'capitalize' }}
              >
                {profile.role}
              </span>
            </p>
          </div>
        </div>
      </Card>

      <div className="profile-actions">
        {actions.map((action) => (
          <article
            key={action.id}
            className="profile-action-card"
            onClick={() => handleActionClick(action.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="profile-action-icon">{action.icon}</div>
            <div>
              <h4>{action.title}</h4>
              <p>{action.subtitle}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <Modal isOpen={true} title="Change Password" onClose={() => setShowPasswordModal(false)}>
          <form className="review-form" onSubmit={handleChangePassword}>
            <label htmlFor="profile-current-pw">Current Password</label>
            <input
              id="profile-current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            <label htmlFor="profile-new-pw">New Password</label>
            <input
              id="profile-new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 4 chars)"
              minLength={4}
              required
            />
            {passwordMessage ? <p className="header-meta">{passwordMessage}</p> : null}
            <div className="review-submit">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Saving...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <Modal isOpen={true} title="Send Feedback" onClose={() => setShowFeedbackModal(false)}>
          <form className="review-form" onSubmit={handleSubmitFeedback}>
            <label htmlFor="profile-feedback">Your Feedback</label>
            <textarea
              id="profile-feedback"
              rows="4"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us how we can improve..."
              required
            />
            {feedbackMessage ? <p className="header-meta">{feedbackMessage}</p> : null}
            <div className="review-submit">
              <Button type="submit" disabled={feedbackLoading}>
                {feedbackLoading ? 'Sending...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Blocked Users Modal */}
      {showBlockedModal && (
        <Modal isOpen={true} title="Blocked Users" onClose={() => setShowBlockedModal(false)}>
          {isHost ? (
            <p className="header-meta">No blocked users at the moment.</p>
          ) : (
            <p className="header-meta">This feature is available for host only.</p>
          )}
        </Modal>
      )}

      {/* Surveys Modal */}
      {showSurveysModal && (
        <Modal isOpen={true} title="Surveys" onClose={() => setShowSurveysModal(false)}>
          <p className="header-meta">No surveys available at the moment.</p>
        </Modal>
      )}
    </div>
  )
}

export default ProfilePage