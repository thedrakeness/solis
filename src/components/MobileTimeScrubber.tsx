import { useRef, useCallback, useEffect } from 'react'
import type { HourData, Unit } from '../types'
import { formatTemp, formatHour } from '../lib/utils'

interface Props {
  hours: HourData[]
  unit: Unit
  scrubIdx: number | null
  onScrub: (index: number | null) => void
}

const VW = 360
const VH = 100
const PAD_X = 20
const CHART_TOP = 8
const CHART_BOTTOM = 74
const LABEL_Y = 90

const ACCENT = 'rgba(232,196,120,'

export function MobileTimeScrubber({ hours, unit, scrubIdx, onScrub }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const onScrubRef = useRef(onScrub)
  useEffect(() => { onScrubRef.current = onScrub }, [onScrub])

  const n = hours.length
  const temps = hours.map(h => h.temp)
  const minT = Math.min(...temps)
  const maxT = Math.max(...temps)
  const range = maxT - minT || 1

  const xOf = (i: number) => PAD_X + (i / (n - 1)) * (VW - 2 * PAD_X)
  const yOf = (t: number) => CHART_TOP + ((maxT - t) / range) * (CHART_BOTTOM - CHART_TOP)

  const pts = hours.map((h, i) => ({ x: xOf(i), y: yOf(h.temp) }))

  let pathD = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    pathD += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }
  const fillD = `${pathD} L ${pts[n - 1].x} ${CHART_BOTTOM} L ${pts[0].x} ${CHART_BOTTOM} Z`

  const getIdx = useCallback((clientX: number) => {
    if (!svgRef.current) return 0
    const rect = svgRef.current.getBoundingClientRect()
    const chartLeft = rect.left + rect.width * (PAD_X / VW)
    const chartW = rect.width * (1 - 2 * PAD_X / VW)
    const ratio = (clientX - chartLeft) / chartW
    return Math.max(0, Math.min(n - 1, Math.round(ratio * (n - 1))))
  }, [n])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onStart = (e: TouchEvent) => { e.preventDefault(); onScrubRef.current(getIdx(e.touches[0].clientX)) }
    const onMove  = (e: TouchEvent) => { e.preventDefault(); onScrubRef.current(getIdx(e.touches[0].clientX)) }
    const onEnd   = () => onScrubRef.current(null)
    svg.addEventListener('touchstart',  onStart, { passive: false })
    svg.addEventListener('touchmove',   onMove,  { passive: false })
    svg.addEventListener('touchend',    onEnd)
    svg.addEventListener('touchcancel', onEnd)
    return () => {
      svg.removeEventListener('touchstart',  onStart)
      svg.removeEventListener('touchmove',   onMove)
      svg.removeEventListener('touchend',    onEnd)
      svg.removeEventListener('touchcancel', onEnd)
    }
  }, [getIdx])

  const active = scrubIdx !== null ? hours[scrubIdx] : null

  return (
    <div className="mob-scrubber-chart">
      {active && (
        <div className="mob-scrubber-readout">
          {scrubIdx === 0 ? 'NOW' : formatHour(active.hour)}
          &nbsp;·&nbsp;
          {formatTemp(active.temp, unit)}°
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
      >
        <defs>
          <linearGradient id="scrub-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={`${ACCENT}0.2)`} />
            <stop offset="100%" stopColor={`${ACCENT}0)`}   />
          </linearGradient>
        </defs>

        {/* Area under curve */}
        <path d={fillD} fill="url(#scrub-fill)" />

        {/* Curve */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Resting dots */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={scrubIdx === i ? 0 : 2}
            fill="rgba(255,255,255,0.4)"
          />
        ))}

        {/* Scrub indicator */}
        {scrubIdx !== null && (
          <>
            <line
              x1={pts[scrubIdx].x} y1={CHART_TOP - 2}
              x2={pts[scrubIdx].x} y2={CHART_BOTTOM}
              stroke={`${ACCENT}0.55)`}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={pts[scrubIdx].x}
              cy={pts[scrubIdx].y}
              r={4.5}
              fill={`${ACCENT}1)`}
            />
          </>
        )}

        {/* Hour labels */}
        {hours.map((h, i) => (
          <text
            key={i}
            x={xOf(i)}
            y={LABEL_Y}
            textAnchor="middle"
            fill={scrubIdx === i ? `${ACCENT}0.9)` : 'rgba(255,255,255,0.38)'}
            fontSize="8.5"
            fontFamily="'IBM Plex Mono',monospace"
            letterSpacing="0.04em"
          >
            {i === 0 ? 'NOW' : formatHour(h.hour)}
          </text>
        ))}
      </svg>
    </div>
  )

}
