import { useEffect, useMemo, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import Modal from '../components/shared/Modal'
import SearchBar from '../components/shared/SearchBar'
import { createLostFoundItem, getLostFoundData } from '../services/lostFoundService'

function LostFoundPage() {
  const [activeTab, setActiveTab] = useState('Found')
  const [query, setQuery] = useState('')
  const [showAllFound, setShowAllFound] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [foundItems, setFoundItems] = useState([])
  const [lostItems, setLostItems] = useState([])
  const [claimedItems, setClaimedItems] = useState([])

  const [itemName, setItemName] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('found')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    async function loadLostFound() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await getLostFoundData()
        setFoundItems(data.foundItems)
        setLostItems(data.lostItems)
        setClaimedItems(data.claimedItems)
      } catch {
        setErrorMessage('Unable to load lost and found items right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadLostFound()
  }, [])

  const filteredFoundItems = useMemo(() => {
    return foundItems.filter((item) => {
      const searchText = `${item.itemName} ${item.location} ${item.status} ${item.tokenId}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    })
  }, [foundItems, query])

  const filteredLostItems = useMemo(() => {
    return lostItems.filter((item) => {
      const searchText = `${item.itemName} ${item.location} ${item.status} ${item.tokenId}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    })
  }, [lostItems, query])

  const filteredClaimedItems = useMemo(() => {
    return claimedItems.filter((item) => {
      const searchText = `${item.itemName} ${item.location} ${item.status} ${item.tokenId}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    })
  }, [claimedItems, query])

  function openModal() {
    setItemName('')
    setLocation('')
    setStatus('found')
    setImageUrl('')
    setDescription('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
  }

  async function submitItem(event) {
    event.preventDefault()
    const now = new Date()
    const tokenId = Math.floor(1000 + Math.random() * 9000)
    const formattedDate = `${now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`

    const nextItem = {
      tokenId,
      itemName: itemName.trim(),
      location: location.trim(),
      status,
      imageUrl: imageUrl.trim(),
      description: description.trim(),
      dateTime: formattedDate,
    }

    try {
      const createdItem = await createLostFoundItem({
        created_by_user_id: 1,
        item_name: itemName.trim(),
        location: location.trim(),
        status,
        token_code: String(tokenId),
        image_url: imageUrl.trim(),
        description: description.trim(),
      })

      if (status === 'found') setFoundItems((prev) => [createdItem, ...prev])
      if (status === 'lost') setLostItems((prev) => [createdItem, ...prev])
      if (status === 'claimed') setClaimedItems((prev) => [createdItem, ...prev])
    } catch {
      if (status === 'found') setFoundItems((prev) => [nextItem, ...prev])
      if (status === 'lost') setLostItems((prev) => [nextItem, ...prev])
      if (status === 'claimed') setClaimedItems((prev) => [nextItem, ...prev])
    }

    closeModal()
    setActiveTab(status === 'found' ? 'Found' : 'Requests')
  }

  const visibleFoundItems = showAllFound
    ? filteredFoundItems
    : filteredFoundItems.slice(0, 3)

  return (
    <div className="page-content lost-found-page">
      <section className="lost-header">
        <div className="lost-header-row">
          <span className="lost-back">←</span>
          <h2>Lost & Found</h2>
        </div>
      </section>

      <div className="lost-tabs">
        <button
          type="button"
          className={`lost-tab${activeTab === 'Found' ? ' active' : ''}`}
          onClick={() => setActiveTab('Found')}
        >
          Found
        </button>
        <button
          type="button"
          className={`lost-tab${activeTab === 'Requests' ? ' active' : ''}`}
          onClick={() => setActiveTab('Requests')}
        >
          Requests
        </button>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by item name, location, status or token ID"
      />

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Lost & Found">Loading items...</Card>
      ) : (
        <>

          {activeTab === 'Found' ? (
            <Card title="Found Items" action={<Button variant="ghost" onClick={() => setShowAllFound((prev) => !prev)}>{showAllFound ? 'Show Less' : 'View More'}</Button>}>
              <div className="lost-item-list">
                {visibleFoundItems.map((item) => (
                  <article className="lost-item-card" key={item.tokenId}>
                    <div className="lost-item-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.itemName} />
                      ) : (
                        <span>Item image</span>
                      )}
                    </div>
                    <div className="lost-item-content">
                      <h4>{item.itemName}</h4>
                      <p>{item.location}</p>
                      <p>{item.dateTime}</p>
                      <small>Token ID: {item.tokenId}</small>
                    </div>
                    <span className="lost-status">{item.status}</span>
                  </article>
                ))}
                {!visibleFoundItems.length ? (
                  <EmptyState
                    title="No items found"
                    description="Try another search keyword."
                  />
                ) : null}
              </div>
            </Card>
          ) : (
            <div className="grid-2">
              <Card title="Lost">
                {filteredLostItems.length ? (
                  <div className="lost-item-list">
                    {filteredLostItems.map((item) => (
                      <article className="lost-item-card" key={item.tokenId}>
                        <div className="lost-item-image">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName} />
                          ) : (
                            <span>Item image</span>
                          )}
                        </div>
                        <div className="lost-item-content">
                          <h4>{item.itemName}</h4>
                          <p>{item.location}</p>
                          <small>Token ID: {item.tokenId}</small>
                        </div>
                        <span className="lost-status">{item.status}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No lost items" description="Requests will appear here." />
                )}
              </Card>
              <Card title="Claimed">
                {filteredClaimedItems.length ? (
                  <div className="lost-item-list">
                    {filteredClaimedItems.map((item) => (
                      <article className="lost-item-card" key={item.tokenId}>
                        <div className="lost-item-image">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName} />
                          ) : (
                            <span>Item image</span>
                          )}
                        </div>
                        <div className="lost-item-content">
                          <h4>{item.itemName}</h4>
                          <p>{item.location}</p>
                          <small>Token ID: {item.tokenId}</small>
                        </div>
                        <span className="lost-status">{item.status}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No claimed items"
                    description="Claimed requests will appear here."
                  />
                )}
              </Card>
            </div>
          )}
        </>
      )}

      <Button className="lost-new-desktop" onClick={openModal}>
        + New
      </Button>
      <button type="button" className="lost-fab" onClick={openModal}>
        + New
      </button>

      <Modal isOpen={isModalOpen} title="Add New Item" onClose={closeModal}>
        <form className="review-form" onSubmit={submitItem}>
          <label htmlFor="lost-item-name">Item name</label>
          <input
            id="lost-item-name"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            required
          />
          <label htmlFor="lost-location">Location</label>
          <input
            id="lost-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            required
          />
          <label htmlFor="lost-status">Status</label>
          <select
            id="lost-status"
            className="lost-select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="found">found</option>
            <option value="lost">lost</option>
            <option value="claimed">claimed</option>
          </select>
          <label htmlFor="lost-image-url">Image URL</label>
          <input
            id="lost-image-url"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/item.jpg"
          />
          <label htmlFor="lost-description">Description</label>
          <textarea
            id="lost-description"
            rows="3"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
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

export default LostFoundPage