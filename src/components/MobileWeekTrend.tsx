import type { DayData, Unit } from '../types'
import { formatTemp } from '../lib/utils'
import { smoothPath } from '../lib/charts'

interface Props {
  days: DayData[]
  unit: Unit
}

const VW = 360
const VH = 100
const PAD_X = 20
const CHART_TOP = 14
const CHART_BOTTOM = 74
const LABEL_Y = 90

const ACCENT = 'rgba(232,196,120,'

export function MobileWeekTrend({ days, unit }: Props) {
  const n = days.length
  const his = days.map(d => d.hi)
  const los = days.map(d => d.lo)
  const minT = Math.min(...los) - 3
  const maxT = Math.max(...his) + 3
  const range = maxT - minT || 1

  const xOf = (i: number) => PAD_X + (i / (n - 1)) * (VW - 2 * PAD_X)
  const yOf = (t: number) => CHART_TOP + ((maxT - t) / range) * (CHART_BOTTOM - CHART_TOP)

  const hiPts = his.map((t, i) => ({ x: xOf(i), y: yOf(t) }))
  const loPts = los.map((t, i) => ({ x: xOf(i), y: yOf(t) }))

  const hiPath = smoothPath(hiPts)
  const loPath = smoothPath(loPts)
  const bandPath = `${hiPath} L ${loPts[n - 1].x} ${loPts[n - 1].y} ${
    smoothPath([...loPts].reverse()).replace('M', 'L')
  } Z`

  return (
    <div className="mob-scrubber-chart">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="week-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={`${ACCENT}0.22)`} />
            <stop offset="100%" stopColor={`${ACCENT}0.03)`} />
          </linearGradient>
        </defs>

        {/* Band between high and low */}
        <path d={bandPath} fill="url(#week-band)" />

        {/* Low line */}
        <path
          d={loPath}
          fill="none"
          stroke={`${ACCENT}0.65)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* High line */}
        <path
          d={hiPath}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points + temp labels */}
        {days.map((d, i) => (
          <g key={i}>
            <circle cx={hiPts[i].x} cy={hiPts[i].y} r="2.5" fill="rgba(255,255,255,0.9)" />
            <text
              x={hiPts[i].x} y={hiPts[i].y - 9}
              textAnchor="middle" fill="rgba(255,255,255,0.85)"
              fontSize="10" fontFamily="'IBM Plex Mono',monospace" fontWeight="500"
            >
              {formatTemp(d.hi, unit)}°
            </text>

            <circle cx={loPts[i].x} cy={loPts[i].y} r="2.5" fill={`${ACCENT}0.9)`} />
            <text
              x={loPts[i].x} y={loPts[i].y + 13}
              textAnchor="middle" fill={`${ACCENT}0.85)`}
              fontSize="10" fontFamily="'IBM Plex Mono',monospace" fontWeight="500"
            >
              {formatTemp(d.lo, unit)}°
            </text>

            <text
              x={xOf(i)} y={LABEL_Y}
              textAnchor="middle" fill="rgba(255,255,255,0.38)"
              fontSize="8.5" fontFamily="'IBM Plex Mono',monospace" letterSpacing="0.04em"
            >
              {d.isToday ? 'TODAY' : d.dayName.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
