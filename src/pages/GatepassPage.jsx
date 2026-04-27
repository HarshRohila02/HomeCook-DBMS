import { useEffect, useMemo, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import Modal from '../components/shared/Modal'
import SearchBar from '../components/shared/SearchBar'
import { getCurrentUser } from '../services/authService'
import {
  createGatepass,
  getGatepasses,
  updateGatepassStatus,
} from '../services/gatepassService'

function GatepassPage() {
  const currentUser = getCurrentUser()
  const currentUserId = Number(currentUser?.id) || 1
  const isHost = currentUser?.role === 'host'
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [gatepasses, setGatepasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [reason, setReason] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [timeOut, setTimeOut] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')

  useEffect(() => {
    async function loadGatepasses() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await getGatepasses()
        setGatepasses(data)
      } catch {
        setErrorMessage('Unable to load gatepasses right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadGatepasses()
  }, [])

  const records = useMemo(() => {
    return gatepasses
      .filter((row) => (isHost ? true : row.userId === currentUserId))
      .filter((row) =>
        `${row.id} ${row.destination} ${row.reason} ${row.status}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
  }, [gatepasses, isHost, currentUserId, query])

  function openRequestModal() {
    setReason('')
    setDestination('')
    setDate('')
    setTimeOut('')
    setExpectedReturn('')
    setIsModalOpen(true)
  }

  function closeRequestModal() {
    setIsModalOpen(false)
  }

  async function submitGatepass(event) {
    event.preventDefault()
    const randomId = Math.floor(1000 + Math.random() * 9000)
    const nextRequest = {
      id: `GP-${randomId}`,
      reason: reason.trim(),
      destination: destination.trim(),
      date,
      timeOut,
      expectedReturn,
      status: 'Pending',
    }

    try {
      const created = await createGatepass({
        user_id: currentUserId,
        reason: reason.trim(),
        destination: destination.trim(),
        date,
        time_out: timeOut,
        expected_return_time: expectedReturn,
      })
      setGatepasses((prev) => [created, ...prev])
      setErrorMessage('')
    } catch {
      setGatepasses((prev) => [nextRequest, ...prev])
      setErrorMessage('Saved locally because backend is unavailable.')
    }

    closeRequestModal()
  }

  async function handleStatusUpdate(gatepassId, status) {
    try {
      const updated = await updateGatepassStatus(gatepassId, status, currentUserId)
      setGatepasses((prev) =>
        prev.map((item) => (item.gatepassId === gatepassId ? updated : item)),
      )
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to update gatepass status.')
    }
  }

  return (
    <div className="page-content gatepass-page">
      <section className="gatepass-header">
        <div className="gatepass-header-row">
          <span className="gatepass-back">←</span>
          <h2>Gatepass</h2>
        </div>
      </section>

      <section className="gatepass-hero">
        <div>
          <h3>Campus Gatepass</h3>
          <p>Manage your campus gatepass requests</p>
        </div>
        <div className="gatepass-illustration">Security illustration</div>
      </section>

      <SearchBar value={query} onChange={setQuery} placeholder="Search by gatepass ID" />
      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Gatepass Requests">Loading gatepasses...</Card>
      ) : (
        <Card
          title="Gatepass Requests"
          action={
            isHost ? null : <Button onClick={openRequestModal}>Request Gatepass</Button>
          }
        >
          {records.length ? (
            <div className="item-list">
              {records.map((item) => (
                <article key={item.id} className="gatepass-card-row">
                  <div>
                    <h4>{item.id}</h4>
                    <p>Destination: {item.destination}</p>
                    <p>Reason: {item.reason}</p>
                    <small>
                      {item.date} • Out: {item.timeOut} • Return: {item.expectedReturn}
                    </small>
                  </div>
                  <span className="gatepass-status">{item.status}</span>
                  {isHost ? (
                    <div className="host-claim-actions">
                      <Button onClick={() => handleStatusUpdate(item.gatepassId, 'approved')}>
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleStatusUpdate(item.gatepassId, 'rejected')}
                      >
                        Reject
                      </Button>
                      <Button onClick={() => handleStatusUpdate(item.gatepassId, 'security_out')}>
                        Mark OUT
                      </Button>
                      <Button onClick={() => handleStatusUpdate(item.gatepassId, 'security_in')}>
                        Mark IN
                      </Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No gatepasses found"
              description="Your gatepass requests will appear here"
            />
          )}
        </Card>
      )}

      <Modal isOpen={isModalOpen} title="Request Gatepass" onClose={closeRequestModal}>
        <form className="review-form" onSubmit={submitGatepass}>
          <label htmlFor="gatepass-reason">Reason</label>
          <input
            id="gatepass-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />

          <label htmlFor="gatepass-destination">Destination</label>
          <input
            id="gatepass-destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            required
          />

          <label htmlFor="gatepass-date">Date</label>
          <input
            id="gatepass-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />

          <label htmlFor="gatepass-time-out">Time out</label>
          <input
            id="gatepass-time-out"
            type="time"
            value={timeOut}
            onChange={(event) => setTimeOut(event.target.value)}
            required
          />

          <label htmlFor="gatepass-return-time">Expected return time</label>
          <input
            id="gatepass-return-time"
            type="time"
            value={expectedReturn}
            onChange={(event) => setExpectedReturn(event.target.value)}
            required
          />

          <div className="review-submit">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default GatepassPage