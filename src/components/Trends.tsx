import type { WeatherData, Unit } from '../types'
import { formatTemp } from '../lib/utils'

interface Props {
  data: WeatherData
  unit: Unit
}

export function Trends({ data, unit }: Props) {
  const { weeklyHighs, weeklyPrecip, monthlySummary } = data
  const maxHigh = Math.max(...weeklyHighs.map(w => w.value), 1)
  const maxPrecip = Math.max(...weeklyPrecip.map(w => w.value), 0.01)

  return (
    <>
      <div className="panel trend-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Weekly Average High</div>
            <div className="panel-sub mt-1">Last 8 weeks</div>
          </div>
          <div className="panel-sub">°{unit}</div>
        </div>
        <div className="bar-chart" style={{ '--cols': 8 } as React.CSSProperties}>
          {weeklyHighs.map((w, i) => (
            <div key={i} className="bar-col">
              <div className="bar-wrap">
                <div className={`bar${w.isCurrent ? ' curr' : ''}`} style={{ height: `${(w.value / maxHigh) * 100}%` }} />
              </div>
              <div className="bar-val">{formatTemp(w.value, unit)}°</div>
              <div className="bar-label">{w.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel trend-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Weekly Precipitation</div>
            <div className="panel-sub mt-1">Last 12 weeks</div>
          </div>
          <div className="panel-sub">INCHES</div>
        </div>
        <div className="bar-chart" style={{ '--cols': 12 } as React.CSSProperties}>
          {weeklyPrecip.map((w, i) => (
            <div key={i} className="bar-col">
              <div className="bar-wrap">
                <div className={`bar${w.isCurrent ? ' curr' : ''}`} style={{ height: `${(w.value / maxPrecip) * 100}%` }} />
              </div>
              <div className="bar-val">{w.value.toFixed(1)}</div>
              <div className="bar-label">{w.label}</div>
            </div>
          ))}
        </div>
      </div>

      {monthlySummary.length > 0 && (
        <div className="panel trend-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Monthly Summary</div>
              <div className="panel-sub mt-1">Last 6 months</div>
            </div>
          </div>
          <div className="month-grid">
            {monthlySummary.map((m, i) => (
              <div key={i} className="month-card">
                <div className="month-name">{m.month}</div>
                <div className="month-temps">
                  {formatTemp(m.hi, unit)}°<span className="lo">{formatTemp(m.lo, unit)}°</span>
                </div>
                <div>
                  <div className="month-rain-track">
                    <div className="month-rain-fill" style={{ width: `${m.rainRel * 100}%` }} />
                  </div>
                  <div className="month-rain-val mt-1.5">{m.rain.toFixed(1)} IN RAIN</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
