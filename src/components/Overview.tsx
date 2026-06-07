import type { WeatherData, Unit, Tab, Location } from '../types'
import { formatTemp, formatHour, isNightTod, todFromHour, condLabel } from '../lib/utils'
import { Icons, CondIcon } from './Icons'
import { LocationSearch } from './LocationSearch'

interface Props {
  data: WeatherData
  unit: Unit
  onGoTab: (tab: Tab) => void
  location?: Location
  onSelectLocation?: (loc: Location) => void
}

export function Overview({ data, unit, onGoTab, location, onSelectLocation }: Props) {
  const { current, hours, days } = data

  const next6 = hours.slice(0, 6)
  const week = days.slice(0, 7)

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
                {formatTemp(current.temp, unit)}<sup>°</sup>
              </div>
              <div className="ov-cond">
                <span className="ov-cond-label">{condLabel(current.condition)}</span>
                <span className="ov-cond-sep"> · </span>
                <span className="ov-cond-feels">Feels like {formatTemp(current.feelsLike, unit)}°</span>
              </div>
            </div>
            <div className="ov-icon-wrap text-[rgba(243,247,251,0.85)]">
              <CondIcon cond={current.condition} size={96} night={isNightTod(todFromHour(new Date().getHours()))} />
            </div>
          </div>
        </div>

        <div className="ov-stats">
          <div className="stat">
            <div className="stat-label">Wind</div>
            <div className="stat-val">{current.windSpeed}<small>mph</small></div>
            <div className="stat-note">{current.windSpeed > 18 ? 'Gusty' : 'Light'} — {current.windDir}</div>
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
            <div className="stat-val">{current.precipProb}<small>%</small></div>
            <div className="stat-note">Next hour</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
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
