import { useState, useEffect, useRef } from 'react'
import type { Tab } from '../types'
import { TABS } from '../constants'
import { Icons } from './Icons'

interface Props {
  tab: Tab
  onTab: (key: Tab) => void
}

export function MobileTabFab({ tab, onTab }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = TABS.find(t => t.key === tab)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleSelect(key: Tab) {
    onTab(key)
    setOpen(false)
  }

  return (
    <div ref={ref} className="tab-fab-wrap">
      {open && (
        <div className="tab-fab-menu" role="menu">
          {TABS.map(t => (
            <button
              key={t.key}
              role="menuitem"
              className={`tab-fab-option${tab === t.key ? ' active' : ''}`}
              onClick={() => handleSelect(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="tab-fab"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Section: ${current?.label ?? 'Overview'}`}
      >
        <span className="tab-fab-label">{current?.label ?? 'Overview'}</span>
        <Icons.Chev size={14} />
      </button>
    </div>
  )
}
