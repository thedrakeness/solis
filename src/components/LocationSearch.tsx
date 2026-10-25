import { useState, useEffect, useRef, useId } from 'react'
import type { KeyboardEvent } from 'react'
import type { Location } from '../types'
import { searchLocations } from '../lib/api'
import { Icons } from './Icons'

interface Props {
  currentLocation: Location
  onSelect: (loc: Location) => void
  variant?: 'topbar' | 'overview'
}

export function LocationSearch({ currentLocation, onSelect, variant = 'topbar' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      const res = await searchLocations(query)
      setResults(res)
      setActive(0)
      setLoading(false)
    }, 320)
    return () => clearTimeout(t)
  }, [query])

  function handleSelect(loc: Location) {
    onSelect(loc)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[active]) }
  }

  const isCurrent = (l: Location) =>
    Math.abs(l.lat - currentLocation.lat) < 0.01 && Math.abs(l.lon - currentLocation.lon) < 0.01

  const dropdown = open && (
    <div className={`loc-dropdown loc-dropdown--${variant}`}>
      <div className="loc-dropdown-field">
        <Icons.Search size={16} />
        <input
          ref={inputRef}
          className="loc-dropdown-input"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Search for a city"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
        />
        {query && (
          <button type="button" className="loc-dropdown-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear search">
            <Icons.Close size={14} />
          </button>
        )}
      </div>

      <div className="loc-dropdown-body">
        {!query.trim() && (
          <div className="loc-dropdown-current">
            <span className="loc-dropdown-label">Current location</span>
            <div className="loc-dropdown-option is-selected">
              <span className="loc-dropdown-text">
                <span className="loc-dropdown-name">{currentLocation.name}</span>
                {currentLocation.region && <span className="loc-dropdown-region">{currentLocation.region}</span>}
              </span>
              <Icons.Check size={16} />
            </div>
          </div>
        )}
        {query.trim() && loading && <div className="loc-dropdown-status">Searching…</div>}
        {query.trim() && !loading && results.length === 0 && (
          <div className="loc-dropdown-status">No places match “{query.trim()}”</div>
        )}
        {!loading && results.length > 0 && (
          <ul id={listId} role="listbox" className="loc-dropdown-list">
            {results.map((l, i) => (
              <li
                key={`${l.lat},${l.lon}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`loc-dropdown-option${i === active ? ' is-active' : ''}${isCurrent(l) ? ' is-selected' : ''}`}
                onPointerEnter={() => setActive(i)}
                onClick={() => handleSelect(l)}
              >
                <span className="loc-dropdown-text">
                  <span className="loc-dropdown-name">{l.name}</span>
                  {l.region && <span className="loc-dropdown-region">{l.region}</span>}
                </span>
                {isCurrent(l) && <Icons.Check size={16} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  if (variant === 'overview') {
    return (
      <div ref={ref} className="relative">
        <button className="ov-meta-loc-btn" onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open}>
          <Icons.Pin size={14} />
          <span>{currentLocation.name}</span>
          <span className={`loc-chev${open ? ' open' : ''}`}><Icons.Chev size={13} /></span>
        </button>
        {dropdown}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex items-center gap-[14px]">
      <span className="text-[rgba(255,255,255,0.4)] text-[32px] leading-none font-[family-name:var(--serif)]">·</span>
      <button className="topbar-loc-btn" onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open}>
        <span>{currentLocation.name}</span>
        <span className={`loc-chev text-[rgba(255,255,255,0.6)] inline-flex items-center${open ? ' open' : ''}`}>
          <Icons.Chev size={18} />
        </span>
      </button>
      {dropdown}
    </div>
  )
}
