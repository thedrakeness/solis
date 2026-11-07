import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { CurrentData, SunTimes, Unit } from '../types'
import { formatClock, formatTemp } from '../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  current: CurrentData
  // Wind/precip follow the scrubbed hour when one is selected
  displayed: CurrentData
  sun: SunTimes
  timeLabel: string
  unit: Unit
}

export function MobileDetailsSheet({ open, onClose, current, displayed, sun, timeLabel, unit }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Polar days and nights have no usable pair
  const hasSunTimes = sun.sunset > sun.sunrise

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
    {
      label: 'Sunrise',
      value: hasSunTimes ? formatClock(sun.sunrise) : 'N/A',
      note: null,
    },
    {
      label: 'Sundown',
      value: hasSunTimes ? formatClock(sun.sunset) : 'N/A',
      note: null,
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
          <span className="sheet-title">Details</span>
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
