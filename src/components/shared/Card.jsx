function Card({ title, children, action }) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="page-title" style={{ marginBottom: '10px' }}>
          {title ? <h3>{title}</h3> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export default Card