import { useState, useEffect, useRef } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await searchLocations(query)
      setResults(res)
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

  if (variant === 'overview') {
    return (
      <div ref={ref} className="relative">
        <button className="ov-meta-loc-btn" onClick={() => setOpen(v => !v)}>
          <Icons.Pin size={14} />
          <span>{currentLocation.name}</span>
          <Icons.Chev size={13} />
        </button>
        {open && (
          <div className="loc-search-popover">
            <div className="loc-search-input-wrap">
              <Icons.Search size={13} />
              <input
                ref={inputRef}
                className="loc-search-input"
                placeholder="Search city..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            {loading && <div className="loc-search-empty">Searching…</div>}
            {!loading && results.length === 0 && query.trim() && (
              <div className="loc-search-empty">No results for "{query}"</div>
            )}
            {results.map((l, i) => (
              <button key={i} className={l.name === currentLocation.name ? 'active' : ''} onClick={() => handleSelect(l)}>
                {l.name}
                <span className="text-[rgba(243,247,251,0.35)] ml-2">— {l.region}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex items-center gap-[14px]">
      <span className="text-[rgba(255,255,255,0.4)] text-[32px] leading-none font-[family-name:var(--serif)]">·</span>
      <button className="topbar-loc-btn" onClick={() => setOpen(v => !v)}>
        <span>{currentLocation.name}</span>
        <span className="text-[rgba(255,255,255,0.6)] inline-flex items-center">
          <Icons.Chev size={18} />
        </span>
      </button>
      {open && (
        <div className="loc-search-popover top-[calc(100%+8px)] left-0">
          <div className="loc-search-input-wrap">
            <Icons.Search size={13} />
            <input
              ref={inputRef}
              className="loc-search-input"
              placeholder="Search city..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          {loading && <div className="loc-search-empty">Searching…</div>}
          {!loading && results.length === 0 && query.trim() && (
            <div className="loc-search-empty">No results for "{query}"</div>
          )}
          {results.map((l, i) => (
            <button key={i} className={l.name === currentLocation.name ? 'active' : ''} onClick={() => handleSelect(l)}>
              {l.name}
              <span className="text-[rgba(243,247,251,0.35)] ml-2">— {l.region}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
