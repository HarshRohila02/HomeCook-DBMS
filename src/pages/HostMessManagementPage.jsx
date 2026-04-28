import { useEffect, useMemo, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import { getCurrentUser } from '../services/authService'
import {
  addMessMenu,
  deleteMessMenu,
  getMessByDate,
  getMessDates,
  updateMessMenu,
} from '../services/messService'

const mealTypes = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']

function HostMessManagementPage() {
  const currentUserId = Number(getCurrentUser()?.id) || 1
  const [dates, setDates] = useState([])
  const [activeDate, setActiveDate] = useState('')
  const [menus, setMenus] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    menu_date: '',
    meal_type: 'Breakfast',
    start_time: '08:00',
    end_time: '09:00',
    items_text: '',
    avg_rating: 0,
    review_count: 0,
  })

  const sortedMenus = useMemo(() => {
    return [...menus].sort((a, b) => mealTypes.indexOf(a.meal_type) - mealTypes.indexOf(b.meal_type))
  }, [menus])

  function resetForm(dateValue = activeDate) {
    setEditingId(null)
    setForm({
      menu_date: dateValue || '',
      meal_type: 'Breakfast',
      start_time: '08:00',
      end_time: '09:00',
      items_text: '',
      avg_rating: 0,
      review_count: 0,
    })
  }

  async function loadDateMenus(dateValue) {
    if (!dateValue) {
      setMenus([])
      return
    }
    const data = await getMessByDate(dateValue)
    const rows = (data.messMenuByDate[dateValue] ?? []).map((meal) => ({
      id: meal.messMenuId,
      menu_date: dateValue,
      meal_type: meal.meal,
      start_time: meal.time.split(' - ')[0] || '',
      end_time: meal.time.split(' - ')[1] || '',
      items_text: meal.items.join('\n'),
      avg_rating: meal.rating,
      review_count: meal.reviews,
    }))
    setMenus(rows)
  }

  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const dateList = await getMessDates()
        setDates(dateList)
        const first = dateList[0] || ''
        setActiveDate(first)
        resetForm(first)
        await loadDateMenus(first)
      } catch {
        setErrorMessage('Unable to load mess management data right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadInitial()
  }, [])

  async function onSelectDate(dateValue) {
    setActiveDate(dateValue)
    resetForm(dateValue)
    await loadDateMenus(dateValue)
  }

  function onEdit(menu) {
    setEditingId(menu.id)
    setForm({
      menu_date: menu.menu_date,
      meal_type: menu.meal_type,
      start_time: menu.start_time,
      end_time: menu.end_time,
      items_text: menu.items_text,
      avg_rating: menu.avg_rating,
      review_count: menu.review_count,
    })
  }

  async function onDelete(menuId) {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return
    try {
      await deleteMessMenu(menuId, currentUserId)
      setMenus((prev) => prev.filter((item) => item.id !== menuId))
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to delete menu item.')
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    try {
      const payload = { ...form, user_id: currentUserId }
      if (editingId) {
        const updated = await updateMessMenu(editingId, payload)
        setMenus((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  ...updated,
                  menu_date: updated.menu_date?.slice?.(0, 10) || form.menu_date,
                }
              : item,
          ),
        )
      } else {
        const created = await addMessMenu(payload)
        const nextDate = created.menu_date?.slice?.(0, 10) || form.menu_date
        if (nextDate && !dates.includes(nextDate)) {
          setDates((prev) => [...prev, nextDate].sort())
        }
        if (nextDate === activeDate) {
          setMenus((prev) => [...prev, { ...created, menu_date: nextDate }])
        }
      }
      resetForm(form.menu_date)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save menu item.')
    }
  }

  return (
    <div className="page-content host-dashboard-page">
      <section className="host-header">
        <div className="host-header-row">
          <span className="host-back">←</span>
          <h2>Mess Management</h2>
        </div>
        <p>Add, edit, and delete mess menus by date and meal type.</p>
      </section>

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Mess Management">Loading management view...</Card>
      ) : (
        <>
          <Card title="Select Date">
            <div className="date-selector">
              {dates.map((date) => (
                <button
                  type="button"
                  key={date}
                  className={`date-pill${activeDate === date ? ' active' : ''}`}
                  onClick={() => onSelectDate(date)}
                >
                  {date}
                </button>
              ))}
            </div>
          </Card>

          <Card title={editingId ? 'Edit Menu Item' : 'Add Menu Item'}>
            <form className="review-form" onSubmit={onSubmit}>
              <label htmlFor="menu-date">Date</label>
              <input
                id="menu-date"
                type="date"
                value={form.menu_date}
                onChange={(event) => setForm((prev) => ({ ...prev, menu_date: event.target.value }))}
                required
              />
              <label htmlFor="menu-meal">Meal Type</label>
              <select
                id="menu-meal"
                className="lost-select"
                value={form.meal_type}
                onChange={(event) => setForm((prev) => ({ ...prev, meal_type: event.target.value }))}
              >
                {mealTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <label htmlFor="menu-start">Start Time</label>
              <input
                id="menu-start"
                type="time"
                value={form.start_time}
                onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))}
                required
              />
              <label htmlFor="menu-end">End Time</label>
              <input
                id="menu-end"
                type="time"
                value={form.end_time}
                onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))}
                required
              />
              <label htmlFor="menu-items">Items (with calories)</label>
              <textarea
                id="menu-items"
                rows="4"
                value={form.items_text}
                onChange={(event) => setForm((prev) => ({ ...prev, items_text: event.target.value }))}
                placeholder="Poha - 250 kcal"
                required
              />
              <div className="review-submit">
                <Button type="submit">{editingId ? 'Update' : 'Add'} Menu</Button>
                {editingId && (
                  <Button variant="ghost" onClick={() => resetForm(activeDate)}>Cancel</Button>
                )}
              </div>
            </form>
          </Card>

          <Card title="Menus for Selected Date">
            {sortedMenus.length ? (
              <div className="item-list">
                {sortedMenus.map((menu) => (
                  <article key={menu.id} className="item-row">
                    <div>
                      <strong>{menu.meal_type}</strong>
                      <small>
                        {menu.start_time} - {menu.end_time}
                      </small>
                      <small>{menu.items_text}</small>
                    </div>
                    <div className="host-claim-actions">
                      <Button onClick={() => onEdit(menu)}>Edit</Button>
                      <Button variant="ghost" onClick={() => onDelete(menu.id)}>
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No menu items"
                description="Add a menu item for this date to get started."
              />
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default HostMessManagementPage
