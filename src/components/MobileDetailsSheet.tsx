import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { CurrentData, Unit } from '../types'
import { formatTemp } from '../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  current: CurrentData
  // Wind/precip follow the scrubbed hour when one is selected
  displayed: CurrentData
  timeLabel: string
  unit: Unit
}

export function MobileDetailsSheet({ open, onClose, current, displayed, timeLabel, unit }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const rows = [
    {
      label: 'Air quality',
      value: current.aqi != null ? current.aqiLabel : 'N/A',
      note: current.aqi != null ? `${current.aqi} AQI` : 'Unavailable',
    },
    {
      label: 'Feels like',
      value: `${formatTemp(current.feelsLike, unit)}°`,
      note: null,
    },
    {
      label: 'Wind',
      value: `${displayed.windSpeed} mph`,
      note: `${displayed.windSpeed > 18 ? 'Gusty' : 'Light'} — ${current.windDir}`,
    },
    {
      label: 'Humidity',
      value: `${current.humidity}%`,
      note: current.humidity < 40 ? 'Dry' : current.humidity < 60 ? 'Comfortable' : 'Humid',
    },
    {
      label: 'Precipitation',
      value: `${displayed.precipProb}%`,
      note: timeLabel,
    },
  ]

  // Portaled to body: the page-enter animation leaves a transform on the
  // overview's wrapper, which would otherwise trap position: fixed inside it
  return createPortal(
    <>
      <div
        className={`sheet-scrim${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`bottom-sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Weather details"
        aria-hidden={!open}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">Details · {timeLabel}</span>
          <button className="sheet-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <dl className="details-list">
          {rows.map(r => (
            <div key={r.label} className="details-row">
              <dt className="details-label">{r.label}</dt>
              <dd className="details-value">
                {r.value}
                {r.note && <span className="details-note">{r.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>,
    document.body,
  )
}
