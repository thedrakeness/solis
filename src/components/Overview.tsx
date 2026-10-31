import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { WeatherData, Unit, Tab, Location, Condition } from '../types'
import { formatTemp, formatHour, isNightTod, todFromHour, condLabel, describeConditions, glyphBounds } from '../lib/utils'
import { Icons, CondIcon } from './Icons'
import { LocationSearch } from './LocationSearch'
import { MobileTimeScrubber } from './MobileTimeScrubber'
import { MobileDetailsSheet } from './MobileDetailsSheet'

interface Props {
  data: WeatherData
  unit: Unit
  onGoTab: (tab: Tab) => void
  location?: Location
  onSelectLocation?: (loc: Location) => void
  onScrubChange?: (preview: { condition: Condition; hour: number } | null) => void
}

export function Overview({ data, unit, onGoTab, location, onSelectLocation, onScrubChange }: Props) {
  const { current, hours, days } = data
  const [scrubIdx, setScrubIdx] = useState<number | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const scrubberRef = useRef<HTMLDivElement>(null)
  const [scrubberH, setScrubberH] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = scrubberRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setScrubberH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const next6 = hours.slice(0, 6)
  const week = days.slice(0, 7)

  const displayed = scrubIdx !== null ? {
    ...current,
    temp: next6[scrubIdx].temp,
    condition: next6[scrubIdx].condition,
    windSpeed: next6[scrubIdx].windSpeed,
    precipProb: next6[scrubIdx].precipProb,
  } : current

  const scrubLabel = scrubIdx !== null
    ? (scrubIdx === 0 ? 'Now' : formatHour(next6[scrubIdx].hour))
    : null

  // Let the background scene preview the scrubbed hour
  // The pill floats halfway between the condition label and the card's top edge
  const condRef = useRef<HTMLSpanElement>(null)
  const scrubbing = scrubIdx !== null
  useLayoutEffect(() => {
    const card = scrubberRef.current
    const cond = condRef.current
    if (!scrubbing || !card || !cond) return
    const condBottom = glyphBounds(cond, cond.textContent ?? '').bottom
    card.style.setProperty('--pill-lift', `${(card.getBoundingClientRect().top - condBottom) / 2 + card.clientTop}px`)
  }, [scrubbing])

  const scrubbed = scrubIdx !== null ? next6[scrubIdx] : null
  useEffect(() => {
    onScrubChange?.(scrubbed ? { condition: scrubbed.condition, hour: scrubbed.hour } : null)
  }, [scrubbed?.condition, scrubbed?.hour, onScrubChange])
  useEffect(() => () => onScrubChange?.(null), [onScrubChange])

  const [descIdx, setDescIdx] = useState<number | null>(null)
  useEffect(() => {
    if (scrubIdx === null) { setDescIdx(null); return }
    const timer = setTimeout(() => setDescIdx(scrubIdx), 1000)
    return () => clearTimeout(timer)
  }, [scrubIdx])

  const descSource = descIdx !== null ? next6[descIdx] : current
  const description = describeConditions(descSource.precipProb, current.humidity, descSource.windSpeed, current.windDir)
    ?? `Feels like ${formatTemp(current.feelsLike, unit)}°`

  const night = isNightTod(todFromHour(new Date().getHours()))

  const hourlyTiles = next6.map((h, i) => (
    <div key={i} className={`tile${i === 0 ? ' now' : ''}`}>
      <div className="tile-time">{i === 0 ? 'Now' : formatHour(h.hour)}</div>
      <div className="tile-temp">{formatTemp(h.temp, unit)}°</div>
      {h.precipProb > 0 && <div className="tile-precip">{h.precipProb}%</div>}
    </div>
  ))

  const dayTiles = week.map((d, i) => (
    <div key={i} className={`tile day-tile${d.isToday ? ' now' : ''}`}>
      <div className="tile-time">{d.dayName}</div>
      <div className="tile-precip">
        <Icons.Drop size={10} /> {d.precipProb > 0 ? `${d.precipProb}%` : '0%'}
      </div>
      <div className="tile-icon text-[rgba(243,247,251,0.85)]">
        <CondIcon cond={d.condition} size={28} />
      </div>
      <div className="tile-temps">
        <span className="lo">{formatTemp(d.lo, unit)}°</span>
        <span className="sep">–</span>
        <span className="hi">{formatTemp(d.hi, unit)}°</span>
      </div>
    </div>
  ))

  return (
    <>
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="mob-overview">

        {/* Hero (with the hourly trend graph as its footer), hourly and 7-day
            cards share one snap-scroll group */}
        <div
          className="mob-hero-hourly-group"
          style={scrubberH != null ? { '--scrubber-h': `${scrubberH}px` } as CSSProperties : undefined}
        >
          <div className="mob-snap-hero">
            {location && onSelectLocation && (
              <div className="mob-loc-inline">
                <LocationSearch currentLocation={location} onSelect={onSelectLocation} variant="overview" />
              </div>
            )}
            <div className="mob-hero-group">
              <div className="ov-current-top">
                <div>
                  <div className="ov-temp">{formatTemp(displayed.temp, unit)}<sup>°</sup></div>
                  <div className="ov-cond">
                    <span className="ov-cond-label" ref={condRef}>{condLabel(displayed.condition)}</span>
                    <span className="ov-cond-sep"> · </span>
                    {scrubLabel
                      ? <span className="ov-cond-feels">{scrubLabel}</span>
                      : <span className="ov-cond-feels">Feels like {formatTemp(current.feelsLike, unit)}°</span>
                    }
                  </div>
                  <button
                    type="button"
                    className={`mob-details-btn${scrubbing ? ' scrub-hidden' : ''}`}
                    onClick={() => setDetailsOpen(true)}
                    aria-haspopup="dialog"
                  >
                    More details
                  </button>
                </div>
                <div className="ov-icon-wrap text-[rgba(243,247,251,0.85)]">
                  <CondIcon cond={displayed.condition} size={96} night={night} />
                </div>
              </div>
            </div>
          </div>

          {/* Sits at the bottom of the hero on landing and scrolls away with it */}
          <div className="mob-hero-scrubber" ref={scrubberRef}>
            {/* While scrubbing, grows and floats above the card showing the
                selected hour so it's clear which time the hero is previewing */}
            <div className={`mob-trend-pill${scrubLabel ? ' scrubbing' : ''}`}>
              {scrubLabel ?? 'Hour by Hour'}
            </div>
            <MobileTimeScrubber
              hours={next6}
              unit={unit}
              scrubIdx={scrubIdx}
              onScrub={setScrubIdx}
            />
          </div>

          {/* Card 2: Hour-by-hour forecast */}
          <div className="mob-snap-hourly">
            <div className="mob-snap-card-inner panel">
              <div className="mob-card-head">
                <div className="panel-title">Next 6 Hours</div>
                <div className="panel-sub">Hour by hour</div>
              </div>
              <div className="row-tiles hours">
                {hourlyTiles}
              </div>
            </div>
          </div>

          {/* Card 3: 7-day */}
          <div className="mob-snap-7day">
            <div className="mob-snap-card-inner panel">
              <div className="mob-card-head">
                <div className="panel-title">7 Day Forecast</div>
                <div className="panel-sub">High / Low</div>
              </div>
              <div className="row-tiles days">
                {dayTiles}
              </div>
            </div>
          </div>
        </div>

        <MobileDetailsSheet
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          current={current}
          displayed={displayed}
          timeLabel={scrubLabel ?? 'Now'}
          unit={unit}
        />
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="desk-overview">
        <div className="ov-top">
          <div className="panel ov-current">
            <div className="ov-current-top">
              <div>
                <div className="ov-temp">
                  {formatTemp(displayed.temp, unit)}<sup>°</sup>
                </div>
                <div className="ov-cond">
                  <span className="ov-cond-label">{condLabel(displayed.condition)}</span>
                  <span className="ov-cond-sep"> · </span>
                  {scrubLabel
                    ? <span className="ov-cond-feels">{scrubLabel}</span>
                    : <span className="ov-cond-feels">Feels like {formatTemp(current.feelsLike, unit)}°</span>
                  }
                  <span className="ov-cond-desc">{description}</span>
                </div>
              </div>
              <div className="ov-icon-wrap text-[rgba(243,247,251,0.85)]">
                <CondIcon cond={displayed.condition} size={96} night={night} />
              </div>
            </div>
          </div>

          <div className="ov-stats">
            <div className="stat">
              <div className="stat-label">Wind</div>
              <div className="stat-val">{displayed.windSpeed}<small>mph</small></div>
              <div className="stat-note">{displayed.windSpeed > 18 ? 'Gusty' : 'Light'} — {current.windDir}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Humidity</div>
              <div className="stat-val">{current.humidity}<small>%</small></div>
              <div className="stat-note">{current.humidity < 40 ? 'Dry' : current.humidity < 60 ? 'Comfortable' : 'Humid'}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Air Quality</div>
              <div className="stat-val text-[36px]">
                {current.aqi != null ? current.aqiLabel : 'N/A'}
              </div>
              <div className="stat-note">{current.aqi != null ? `${current.aqi} AQI` : 'Unavailable'}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Precipitation</div>
              <div className="stat-val">{displayed.precipProb}<small>%</small></div>
              <div className="stat-note">{scrubLabel ? scrubLabel : 'Next hour'}</div>
            </div>
          </div>
        </div>

        <div className="desk-next6 panel" style={{ padding: 0 }}>
          <div className="px-[22px] pt-[22px] pb-4 flex justify-between items-baseline">
            <div>
              <div className="panel-title">Next 6 Hours</div>
              <div className="panel-sub mt-1">Hour-by-hour forecast</div>
            </div>
            <button className="panel-link" onClick={() => onGoTab('hourly')}>
              Hourly detail <Icons.Arrow />
            </button>
          </div>
          <div className="row-tiles hours">
            {hourlyTiles}
          </div>
        </div>

        <div className="section-gap" />

        <div className="ov-7day panel" style={{ padding: 0 }}>
          <div className="px-[22px] pt-[22px] pb-4 flex justify-between items-baseline">
            <div>
              <div className="panel-title">7 Day Forecast</div>
              <div className="panel-sub mt-1">High / Low outlook</div>
            </div>
            <button className="panel-link" onClick={() => onGoTab('fiveday')}>
              Full 7-day <Icons.Arrow />
            </button>
          </div>
          <div className="row-tiles days">
            {dayTiles}
          </div>
        </div>
      </div>
    </>
  )
}
