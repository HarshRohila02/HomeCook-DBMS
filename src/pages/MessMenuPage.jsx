import { useEffect, useMemo, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'
import { getMessMenu, submitMessReview } from '../services/messService'
import { getCurrentUser } from '../services/authService'

function MessMenuPage() {
  const currentUserId = Number(getCurrentUser()?.id) || 1
  const [dateOptions, setDateOptions] = useState([])
  const [menuByDate, setMenuByDate] = useState({})
  const [activeDate, setActiveDate] = useState('')
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [ratingInput, setRatingInput] = useState('4')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadMenu() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await getMessMenu()
        setDateOptions(data.messDateOptions)
        setMenuByDate(data.messMenuByDate)
        if (data.messDateOptions.length > 0) {
          setActiveDate(data.messDateOptions[1]?.id ?? data.messDateOptions[0].id)
        }
      } catch {
        setErrorMessage('Unable to load mess menu right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadMenu()
  }, [])

  const mealCards = useMemo(() => menuByDate[activeDate] ?? [], [menuByDate, activeDate])

  function openReviewModal(meal) {
    setSelectedMeal(meal)
    setRatingInput('4')
    setFeedbackInput('')
  }

  function closeReviewModal() {
    setSelectedMeal(null)
  }

  async function loadDateMenu(dateId) {
    try {
      const data = await getMessMenu(dateId)
      setMenuByDate((prev) => ({
        ...prev,
        [dateId]: data.messMenuByDate[dateId] ?? [],
      }))
      if (data.messDateOptions.length) {
        setDateOptions((prev) => {
          const map = new Map(prev.map((item) => [item.id, item]))
          data.messDateOptions.forEach((item) => map.set(item.id, item))
          return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id))
        })
      }
    } catch {
      // fallback is handled in service; keep silent here
    }
  }

  function selectDate(dateId) {
    setActiveDate(dateId)
    loadDateMenu(dateId)
  }

  async function submitReview(event) {
    event.preventDefault()
    if (!selectedMeal || !activeDate) return

    const parsedRating = Number(ratingInput)
    const safeRating = Number.isFinite(parsedRating)
      ? Math.min(5, Math.max(1, parsedRating))
      : selectedMeal.rating

    try {
      if (selectedMeal.messMenuId) {
        await submitMessReview({
          user_id: currentUserId,
          mess_menu_id: selectedMeal.messMenuId,
          rating: safeRating,
          review_text: feedbackInput,
        })
        await loadDateMenu(activeDate)
      } else {
        throw new Error('No backend menu id available')
      }
    } catch {
      // Local fallback update if backend submission fails.
      setMenuByDate((prev) => {
        const dateMeals = prev[activeDate] ?? []
        return {
          ...prev,
          [activeDate]: dateMeals.map((meal) => {
            if (meal.meal !== selectedMeal.meal) return meal
            const nextReviews = meal.reviews + 1
            const nextRating = Number(
              ((meal.rating * meal.reviews + safeRating) / nextReviews).toFixed(1),
            )
            return { ...meal, reviews: nextReviews, rating: nextRating }
          }),
        }
      })
    }

    setErrorMessage('')
    closeReviewModal()
  }

  const activeDateLabel =
    dateOptions.find((dateOption) => dateOption.id === activeDate)?.label ?? ''

  return (
    <div className="page-content mess-menu-page">
      <section className="mess-header">
        <div className="mess-header-row">
          <span className="mess-back">←</span>
          <h2>Mess Menu</h2>
        </div>
        <p>{activeDateLabel}</p>
      </section>

      <div className="date-selector">
        {dateOptions.map((dateOption) => (
          <button
            type="button"
            key={dateOption.id}
            className={`date-pill${activeDate === dateOption.id ? ' active' : ''}`}
            onClick={() => selectDate(dateOption.id)}
          >
            {dateOption.label}
          </button>
        ))}
      </div>

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Mess Menu">Loading menu...</Card>
      ) : (
        <div className="meal-list">
          {mealCards.map((meal) => (
            <Card key={`${activeDate}-${meal.meal}`}>
              <div className="meal-header">
                <div>
                  <h3>{meal.meal}</h3>
                  <p>{meal.time}</p>
                </div>
              </div>
              <div className="meal-items">
                {meal.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="meal-footer">
                <div className="meal-metrics">
                  <span>★ {meal.rating.toFixed(1)}</span>
                  <span>{meal.reviews} reviews</span>
                </div>
                <Button onClick={() => openReviewModal(meal)}>+ Add Review</Button>
              </div>
            </Card>
          ))}
          {!mealCards.length ? (
            <EmptyState
              title="No menu records found"
              description="Select another date to view menu."
            />
          ) : null}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedMeal)}
        title={selectedMeal ? `Add Review - ${selectedMeal.meal}` : 'Add Review'}
        onClose={closeReviewModal}
      >
        <form className="review-form" onSubmit={submitReview}>
          <label htmlFor="rating-input">Rating (1-5)</label>
          <input
            id="rating-input"
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={ratingInput}
            onChange={(event) => setRatingInput(event.target.value)}
            required
          />
          <label htmlFor="feedback-input">Feedback</label>
          <textarea
            id="feedback-input"
            rows="3"
            value={feedbackInput}
            onChange={(event) => setFeedbackInput(event.target.value)}
            placeholder="Share your meal feedback..."
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

export default MessMenuPage