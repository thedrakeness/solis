import { useState, useEffect } from 'react'
import type { WeatherData, Unit, Tab, Location } from '../types'
import { formatTemp, formatHour, isNightTod, todFromHour, condLabel, describeConditions } from '../lib/utils'
import { Icons, CondIcon } from './Icons'
import { LocationSearch } from './LocationSearch'
import { MobileTimeScrubber } from './MobileTimeScrubber'

interface Props {
  data: WeatherData
  unit: Unit
  onGoTab: (tab: Tab) => void
  location?: Location
  onSelectLocation?: (loc: Location) => void
}

export function Overview({ data, unit, onGoTab, location, onSelectLocation }: Props) {
  const { current, hours, days } = data
  const [scrubIdx, setScrubIdx] = useState<number | null>(null)

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

  // Brief conditions description, delayed by 1s while scrubbing so it
  // only updates once the user settles on an hour.
  const [descIdx, setDescIdx] = useState<number | null>(null)
  useEffect(() => {
    if (scrubIdx === null) {
      setDescIdx(null)
      return
    }
    const timer = setTimeout(() => setDescIdx(scrubIdx), 1000)
    return () => clearTimeout(timer)
  }, [scrubIdx])

  const descSource = descIdx !== null ? next6[descIdx] : current
  const description = describeConditions(descSource.precipProb, current.humidity, descSource.windSpeed, current.windDir)
    ?? `Feels like ${formatTemp(current.feelsLike, unit)}°`

  const night = isNightTod(todFromHour(new Date().getHours()))

  return (
    <>
      <div className="ov-top">
        <div className="panel ov-current">
          {location && onSelectLocation && (
            <div className="mob-loc-inline">
              <LocationSearch currentLocation={location} onSelect={onSelectLocation} variant="overview" />
            </div>
          )}
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

        <div className="mob-air-quality panel">
          <span className="mob-aq-label">Air Quality</span>
          <span className="mob-aq-value">
            {current.aqi != null ? `${current.aqiLabel} (${current.aqi} AQI)` : 'Unavailable'}
          </span>
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

      {/* Mobile: scrubber chart + grid combined in one panel */}
      <div className="mob-next6-combined panel">
        <div className="mob-next6-chart-head">
          <span className="panel-title">Next 6 Hours</span>
        </div>
        <MobileTimeScrubber
          hours={next6}
          unit={unit}
          scrubIdx={scrubIdx}
          onScrub={setScrubIdx}
        />
        <div className="mob-next6-grid-head">
          <div>
            <div className="panel-sub">Hour-by-hour forecast</div>
          </div>
          <button className="panel-link" onClick={() => onGoTab('hourly')}>
            Hourly detail <Icons.Arrow />
          </button>
        </div>
        <div className="row-tiles hours">
          {next6.map((h, i) => {
            const isNight = h.hour < 6 || h.hour >= 20
            return (
              <div key={i} className={`tile${i === 0 ? ' now' : ''}`}>
                <div className="tile-time">{i === 0 ? 'Now' : formatHour(h.hour)}</div>
                <div className="text-[rgba(243,247,251,0.85)]">
                  <CondIcon cond={h.condition} size={28} night={isNight} />
                </div>
                <div className="tile-temp">{formatTemp(h.temp, unit)}°</div>
                {h.precipProb > 0 && <div className="tile-precip">{h.precipProb}%</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop: original Next 6 Hours panel */}
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
          {next6.map((h, i) => {
            const isNight = h.hour < 6 || h.hour >= 20
            return (
              <div key={i} className={`tile${i === 0 ? ' now' : ''}`}>
                <div className="tile-time">{i === 0 ? 'Now' : formatHour(h.hour)}</div>
                <div className="text-[rgba(243,247,251,0.85)]">
                  <CondIcon cond={h.condition} size={28} night={isNight} />
                </div>
                <div className="tile-temp">{formatTemp(h.temp, unit)}°</div>
                {h.precipProb > 0 && <div className="tile-precip">{h.precipProb}%</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="section-gap" />

      <div className="panel" style={{ padding: 0 }}>
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
          {week.map((d, i) => (
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
          ))}
        </div>
      </div>
    </>
  )
}
