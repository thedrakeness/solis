import type { WeatherData, Unit } from '../types'
import { formatTemp, formatHour, condDesc } from '../lib/utils'
import { Icons, CondIcon } from './Icons'
import { smoothPath } from '../lib/charts'

interface Props {
  data: WeatherData
  unit: Unit
}

export function Hourly({ data, unit }: Props) {
  const { hours } = data
  const chartHours = hours.slice(0, 8)
  const listHours = hours.slice(0, 24)

  const temps = chartHours.map(h => h.temp)
  const precips = chartHours.map(h => h.precipProb)
  const tMin = Math.min(...temps) - 3
  const tMax = Math.max(...temps) + 3
  const W = 760, H = 220, PAD_L = 30, PAD_R = 30, PAD_T = 30, PAD_B = 44
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const x = (i: number) => PAD_L + (i / (chartHours.length - 1)) * innerW
  const y = (t: number) => PAD_T + innerH - ((t - tMin) / (tMax - tMin)) * innerH

  const pts = temps.map((t, i) => ({ x: x(i), y: y(t) }))
  const pathD = smoothPath(pts)
  const fillD = pathD + ` L ${x(temps.length - 1)} ${PAD_T + innerH} L ${x(0)} ${PAD_T + innerH} Z`

  const hiIdx = temps.indexOf(Math.max(...temps))
  const loIdx = temps.indexOf(Math.min(...temps))
  const maxPrecip = Math.max(40, ...precips)
  const barW = innerW / chartHours.length * 0.55

  return (
    <>
      <div className="panel hourly-chart-wrap">
        <div className="panel-head mb-5">
          <div>
            <div className="panel-title">Next 8 Hours</div>
            <div className="panel-sub mt-1">Temperature · Precipitation</div>
          </div>
          <div className="panel-sub">
            HIGH {formatTemp(Math.max(...temps), unit)}° &nbsp;·&nbsp; LOW {formatTemp(Math.min(...temps), unit)}°
          </div>
        </div>
        <svg className="hourly-chart" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="tempFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--accent-bright)', stopOpacity: 0.45 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent-bright)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <line key={i} x1={PAD_L} x2={W - PAD_R}
              y1={PAD_T + innerH * f} y2={PAD_T + innerH * f}
              stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />
          ))}
          {chartHours.map((h, i) => {
            if (h.precipProb < 5) return null
            const barH = (h.precipProb / maxPrecip) * innerH * 0.45
            return (
              <rect key={`p${i}`}
                x={x(i) - barW / 2} y={PAD_T + innerH - barH}
                width={barW} height={barH}
                style={{ fill: 'rgba(var(--accent-rgb),0.22)' }} />
            )
          })}
          <path d={fillD} fill="url(#tempFill)" />
          <path d={pathD} fill="none" style={{ stroke: 'var(--accent-bright)' }} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx={x(hiIdx)} cy={y(temps[hiIdx])} r="3" fill="#fff" />
          <text x={x(hiIdx)} y={y(temps[hiIdx]) - 10} fill="#fff" fontSize="11" textAnchor="middle" fontFamily="IBM Plex Mono">
            {formatTemp(temps[hiIdx], unit)}°
          </text>
          <circle cx={x(loIdx)} cy={y(temps[loIdx])} r="3" style={{ fill: 'rgba(var(--accent-rgb),0.85)' }} />
          <text x={x(loIdx)} y={y(temps[loIdx]) + 18} style={{ fill: 'rgba(var(--accent-rgb),0.95)' }} fontSize="11" textAnchor="middle" fontFamily="IBM Plex Mono">
            {formatTemp(temps[loIdx], unit)}°
          </text>
          {chartHours.map((h, i) => (
            <text key={`x${i}`} x={x(i)} y={H - 4} fill="rgba(243,247,251,0.80)" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="IBM Plex Mono" letterSpacing="1">
              {i === 0 ? 'NOW' : formatHour(h.hour).replace(' ', '')}
            </text>
          ))}
          {chartHours.map((_, i) => {
            if (i === hiIdx || i === loIdx) return null
            return (
              <text key={`tl${i}`} x={x(i)} y={y(temps[i]) - 7} fill="rgba(243,247,251,0.80)" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="IBM Plex Mono">
                {formatTemp(temps[i], unit)}°
              </text>
            )
          })}
        </svg>
        <div className="chart-legend">
          <span><span className="legend-dot" style={{ background: 'var(--accent-bright)' }} /> Temperature</span>
          <span><span className="legend-dot" style={{ background: 'rgba(var(--accent-rgb),0.4)' }} /> Precipitation</span>
        </div>
      </div>

      <div className="hour-list">
        {listHours.map((h, i) => {
          const isNight = h.hour < 6 || h.hour >= 20
          return (
            <div key={i} className="hour-row">
              <div className="time">{i === 0 ? 'NOW' : formatHour(h.hour)}</div>
              <div className="temp">{formatTemp(h.temp, unit)}°</div>
              <div className="cond">
                <CondIcon cond={h.condition} size={20} night={isNight} />
                <span className="ml-2">{condDesc(h.condition)}</span>
              </div>
              <div className="wind-speed text-right text-[var(--fg-dim)] text-[11px] tracking-[0.1em]">{h.windSpeed} MPH</div>
              <div className="precip">{h.precipProb}% <Icons.Drop size={12} /></div>
              <div className="wind">
                {h.windSpeed >= 18
                  ? <span className="badge-wind">GUSTY</span>
                  : <span>—</span>
                }
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
