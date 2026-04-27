function EmptyState({ title = 'No records available', description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export default EmptyState