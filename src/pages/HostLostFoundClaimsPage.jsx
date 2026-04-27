import { useEffect, useMemo, useState } from 'react'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import Button from '../components/shared/Button'
import { getCurrentUser } from '../services/authService'
import { getClaims, updateClaimStatus } from '../services/lostFoundService'

function HostLostFoundClaimsPage() {
  const currentUserId = Number(getCurrentUser()?.id) || 1
  const [claims, setClaims] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadClaims() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await getClaims(currentUserId)
        setClaims(data)
      } catch {
        setErrorMessage('Unable to load claims right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadClaims()
  }, [])

  async function handleStatusUpdate(claimId, status) {
    try {
      const updated = await updateClaimStatus(claimId, status, currentUserId)
      setClaims((prev) =>
        prev.map((claim) =>
          claim.id === claimId ? { ...claim, claim_status: updated.claim_status } : claim,
        ),
      )
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to update claim status.')
    }
  }

  const pendingClaims = useMemo(
    () => claims.filter((claim) => claim.claim_status === 'pending'),
    [claims],
  )

  return (
    <div className="page-content host-dashboard-page">
      <section className="host-header">
        <div className="host-header-row">
          <span className="host-back">←</span>
          <h2>Lost & Found Claims</h2>
        </div>
        <p>Review and process student claims for found items.</p>
      </section>

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Claims">Loading claims...</Card>
      ) : (
        <Card title="Pending Claims">
          {pendingClaims.length ? (
            <div className="item-list">
              {pendingClaims.map((claim) => (
                <article key={claim.id} className="item-row">
                  <div>
                    <strong>{claim.item_name}</strong>
                    <small>
                      {claim.location} • Token: {claim.token_code || claim.item_id}
                    </small>
                    <small>
                      {claim.student_name} ({claim.student_email})
                    </small>
                    <small>{claim.claim_message}</small>
                    <small>Status: {claim.claim_status}</small>
                  </div>
                  <div className="host-claim-actions">
                    <Button onClick={() => handleStatusUpdate(claim.id, 'approved')}>Approve</Button>
                    <Button variant="ghost" onClick={() => handleStatusUpdate(claim.id, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending claims"
              description="Pending lost & found claims will appear here."
            />
          )}
        </Card>
      )}
    </div>
  )
}

export default HostLostFoundClaimsPage
