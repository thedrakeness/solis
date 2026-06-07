import { useState } from 'react'
import type { Tab } from '../types'
import { TABS } from '../constants'
import { Icons } from './Icons'

interface Props {
  tab: Tab
  onTab: (key: Tab) => void
}

export function MobileTabFab({ tab, onTab }: Props) {
  const [open, setOpen] = useState(false)
  const current = TABS.find(t => t.key === tab)

  function handleSelect(key: Tab) {
    onTab(key)
    setOpen(false)
  }

  return (
    <>
      <div className="tab-fab-wrap">
        <button
          type="button"
          className="tab-fab"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Navigate — current: ${current?.label ?? 'Overview'}`}
        >
          <span className="tab-fab-label">{current?.label ?? 'Overview'}</span>
          <Icons.Chev size={14} />
        </button>
      </div>

      <div
        className={`sheet-scrim${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className={`bottom-sheet${open ? ' open' : ''}`} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">{current?.label ?? 'Overview'}</span>
          <button className="sheet-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>
        <nav className="sheet-nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`sheet-option${tab === t.key ? ' active' : ''}`}
              onClick={() => handleSelect(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
