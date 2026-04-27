function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return <input className="search-bar" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
}

export default SearchBar