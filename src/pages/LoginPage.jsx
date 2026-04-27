import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import { login } from '../services/authService'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to login right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Card>
        <div className="auth-header">
          <h2>Welcome to Unisphere</h2>
          <p>Sign in to access your campus dashboard.</p>
        </div>

        <form className="review-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="harsh.rohila.24cse@bmu.edu.in"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password123"
            required
          />

          {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

          <div className="review-submit">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </form>

        <p className="auth-link-text">
          New to Unisphere? <Link to="/register">Create an account</Link>
        </p>
      </Card>
    </div>
  )
}

export default LoginPage
