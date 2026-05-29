import type { WeatherData, Unit } from '../types'
import { formatTemp, condLabel } from '../lib/utils'
import { CondIcon } from './Icons'
import { smoothPath } from '../lib/charts'

interface Props {
  data: WeatherData
  unit: Unit
}

export function FiveDay({ data, unit }: Props) {
  const days = data.days.slice(0, 7)

  const W = 1000, H = 160, PAD_L = 30, PAD_R = 30, PAD_T = 28, PAD_B = 42
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const allTemps = days.flatMap(d => [d.hi, d.lo])
  const tMin = Math.min(...allTemps) - 3
  const tMax = Math.max(...allTemps) + 3
  const x = (i: number) => PAD_L + (i / (days.length - 1)) * innerW
  const y = (t: number) => PAD_T + innerH - ((t - tMin) / (tMax - tMin)) * innerH

  const hiPts = days.map((d, i) => ({ x: x(i), y: y(d.hi) }))
  const loPts = days.map((d, i) => ({ x: x(i), y: y(d.lo) }))
  const hiPath = smoothPath(hiPts)
  const loPath = smoothPath(loPts)
  const areaPath =
    hiPath +
    ` L ${loPts[loPts.length - 1].x} ${loPts[loPts.length - 1].y}` +
    ' ' + smoothPath([...loPts].reverse()).slice(1) + ' Z'

  return (
    <>
      <div className="panel sparkline-panel">
        <div className="panel-head mb-2">
          <div>
            <div className="panel-title">7 Day Forecast</div>
            <div className="panel-sub mt-1">High / Low</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto">
          <defs>
            <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--accent-bright)', stopOpacity: 0.32 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent-bright)', stopOpacity: 0.02 }} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparkFill)" />
          <path d={hiPath} fill="none" style={{ stroke: 'var(--accent-bright)' }} strokeWidth="1.5" strokeLinecap="round" />
          <path d={loPath} fill="none" style={{ stroke: 'rgba(var(--accent-rgb),0.5)' }} strokeWidth="1" strokeLinecap="round" strokeDasharray="3 3" />
          {days.map((d, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(d.hi)} r="2.5" fill="#fff" />
              <text x={x(i)} y={y(d.hi) - 11} fill="#fff" fontSize="14" fontWeight="500" textAnchor="middle" fontFamily="IBM Plex Mono">
                {formatTemp(d.hi, unit)}°
              </text>
              <circle cx={x(i)} cy={y(d.lo)} r="2" style={{ fill: 'rgba(var(--accent-rgb),0.85)' }} />
              <text x={x(i)} y={y(d.lo) + 20} style={{ fill: 'rgba(var(--accent-rgb),0.95)' }} fontSize="13" fontWeight="500" textAnchor="middle" fontFamily="IBM Plex Mono">
                {formatTemp(d.lo, unit)}°
              </text>
              <text x={x(i)} y={H - 4} fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="500" letterSpacing="2" textAnchor="middle" fontFamily="IBM Plex Mono">
                {d.dayName.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="section-gap" />

      {days.map((d, i) => (
        <div key={i} className={`day-card${d.isToday ? ' today' : ''}`}>
          <div>
            <div className="dayname">{d.dayName}</div>
            <div className="daydate">{d.dateStr}</div>
          </div>
          <div className="flex justify-center text-[rgba(243,247,251,0.85)]">
            <CondIcon cond={d.condition} size={42} />
          </div>
          <div className="cond-col">
            <b>{condLabel(d.condition)}</b>
            {d.precipProb > 0 && <div className="chance">{d.precipProb}% chance of rain</div>}
          </div>
          <div className="temps-col whitespace-nowrap">
            <span className="lo">{formatTemp(d.lo, unit)}°</span>
            <span className="mx-1 text-[rgba(255,255,255,0.5)] text-[0.7em]">–</span>
            {formatTemp(d.hi, unit)}°
          </div>
        </div>
      ))}
    </>
  )
}
