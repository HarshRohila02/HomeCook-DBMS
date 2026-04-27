import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import { register } from '../services/authService'

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    university: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to register right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Card>
        <div className="auth-header">
          <h2>Create your Unisphere account</h2>
          <p>Register once and continue to your dashboard.</p>
        </div>

        <form className="review-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            value={form.full_name}
            onChange={(event) => updateField('full_name', event.target.value)}
            required
          />

          <label htmlFor="register-phone">Phone</label>
          <input
            id="register-phone"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            required
          />

          <label htmlFor="register-university">University</label>
          <input
            id="register-university"
            value={form.university}
            onChange={(event) => updateField('university', event.target.value)}
            required
          />

          {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

          <div className="review-submit">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>

        <p className="auth-link-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}

export default RegisterPage
