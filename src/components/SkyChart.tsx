import { useId, useLayoutEffect, useState } from 'react'
import { glyphBounds } from '../lib/utils'

// Where the moon's lit disc sits on screen, in viewport px
export type MoonSlot = { x: number; y: number; r: number }

type Pt = { x: number; y: number }

// Where the line through a and b meets the circle; the upper or lower crossing
function crossing(a: Pt, b: Pt, c: Pt, r: number, side: 'upper' | 'lower'): Pt | null {
  const dx = b.x - a.x, dy = b.y - a.y
  const fx = a.x - c.x, fy = a.y - c.y
  const A = dx * dx + dy * dy
  const B = 2 * (fx * dx + fy * dy)
  const C = fx * fx + fy * fy - r * r
  const disc = B * B - 4 * A * C
  if (disc < 0) return null
  const pts = [-1, 1].map(s => {
    const t = (-B + s * Math.sqrt(disc)) / (2 * A)
    return { x: a.x + t * dx, y: a.y + t * dy }
  })
  pts.sort((p, q) => p.y - q.y)
  return side === 'upper' ? pts[0] : pts[1]
}

// Nodes stay below the location picker so they never sit against its text
const TOP_CLEAR = 72

const polar = (c: Pt, r: number, deg: number): Pt => ({
  x: c.x + r * Math.cos((deg * Math.PI) / 180),
  y: c.y + r * Math.sin((deg * Math.PI) / 180),
})

// Same as WeatherScene: measured as if the snap scroller sat at the top, since the sky is fixed
function measureFade() {
  const scrollY = document.querySelector('.main--snap')?.scrollTop ?? 0
  const temp = document.querySelector<HTMLElement>('.mob-overview .ov-temp')
  const card = document.querySelector<HTMLElement>('.mob-hero-scrubber')
  const tempTop = temp?.offsetHeight ? glyphBounds(temp, temp.firstChild?.textContent ?? '').top + scrollY : null
  const cardTop = card?.offsetHeight ? card.getBoundingClientRect().top + scrollY : null
  return { tempTop, cardTop }
}

// Linework colour: a warm parchment cream, like ink on an old star chart
const INK = '#e6dcc4'

type Node = Pt & { kind: 'open' | 'double' | 'body' }

// A faint celestial chart centred on the moon: a graduated dial, a ring of dots,
// evenly spaced and top-tangent circles, a dotted meridian, horizon, spokes and
// construction lines from above the screen. It sits over the 3D canvas (stars
// and moon share it), so the moon's disc is masked out to read as in front.
export function SkyChart({ moon }: { moon: MoonSlot }) {
  const id = useId()
  const [fade, setFade] = useState(measureFade)
  useLayoutEffect(() => setFade(measureFade()), [moon])

  const W = window.innerWidth
  const H = window.innerHeight
  const c = { x: moon.x, y: moon.y }
  const limbIn = moon.r * 1.32
  const limbOut = limbIn + 9
  const dotR = limbOut * 1.3
  const family = [1.6, 1.9, 2.2].map(k => limbOut * k)
  const ring1 = Math.max(W * 0.58, family[2] * 1.15)
  const ring2 = Math.max(W * 0.98, ring1 * 1.6)
  const top = c.y - limbOut

  // Full dial, every 2°; every 5th runs the full limb width
  const ticks = Array.from({ length: 180 }, (_, i) => {
    const deg = i * 2
    return { a: polar(c, limbIn, deg), b: polar(c, i % 5 === 0 ? limbOut : limbIn + 3.5, deg) }
  })
  // Spokes between the dial and the ring of dots
  const spokes = Array.from({ length: 24 }, (_, i) => ({ a: polar(c, limbOut + 4, i * 15), b: polar(c, dotR - 5, i * 15) }))
  // Circles growing downward that all touch the dial at its top
  const stack = [1.12, 1.28, 1.44, 1.6].map(k => ({ r: limbOut * k, cy: top + limbOut * k }))

  // Construction lines fan out from a point well above the screen
  const apex = { x: c.x + W * 0.06, y: -H * 0.45 }
  const rays = [-3, -2, -1, 0, 1, 2, 3].map(k => ({ x: c.x + k * W * 0.32, y: H }))

  // A handful of bodies and nodes on the rings, not every crossing
  const at = (p: Pt | null, kind: Node['kind']) => (p ? { ...p, kind } : null)
  const nodes = [
    at({ x: c.x, y: top }, 'body'),
    at({ x: c.x + family[0], y: c.y }, 'open'),
    at(crossing(apex, rays[4], c, family[0], 'upper'), 'double'),
    at(polar(c, family[1], 200), 'body'),
    at(polar(c, family[2], -32), 'body'),
    at(crossing(apex, rays[2], c, dotR, 'lower'), 'open'),
    at(crossing(apex, rays[1], c, ring1, 'lower'), 'double'),
  ].filter((p): p is Node => !!p && p.x > 8 && p.x < W - 8 && p.y > TOP_CLEAR)

  // Small diamond glyphs: a row up left, a lattice down right
  const diamonds = [
    ...[0, 1, 2, 3].map(i => ({ x: 26 + i * 9, y: top + 6 })),
    ...[0, 1, 2].flatMap(i => [0, 1, 2].map(j => ({ x: W - 46 + i * 8, y: c.y + limbOut * 0.95 + j * 8 }))),
  ]

  // Full strength down to the limb, faint behind the temperature, gone before the card
  const solidTo = Math.min(c.y + limbOut, H)
  const faintAt = fade.tempTop ?? c.y + limbOut * 1.8
  const goneAt = Math.max(faintAt + 40, (fade.cardTop ?? H * 0.8) - 24)
  const stop = (y: number) => Math.min(1, Math.max(0, y / H))
  const turn = { transformOrigin: `${c.x}px ${c.y}px` }

  return (
    <svg className="sky-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop offset={stop(solidTo)} stopColor="#fff" />
          <stop offset={stop(faintAt)} stopColor="#fff" stopOpacity="0.35" />
          <stop offset={stop(goneAt)} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill={`url(#${id}-fade)`} />
          <circle cx={c.x} cy={c.y} r={moon.r + 0.5} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`} fill="none" stroke={INK} strokeWidth="0.75" strokeLinecap="round">
        <g opacity="0.07">
          <circle cx={c.x} cy={c.y} r={ring1} />
          <circle cx={c.x} cy={c.y} r={ring2} />
          {rays.map((p, i) => <line key={i} x1={apex.x} y1={apex.y} x2={p.x} y2={p.y} />)}
        </g>
        <g opacity="0.08">
          {stack.map(s => <circle key={s.r} cx={c.x} cy={s.cy} r={s.r} />)}
        </g>
        {family.map((r, i) => <circle key={r} cx={c.x} cy={c.y} r={r} opacity={0.1 - i * 0.02} />)}
        <line x1="0" y1={c.y} x2={W} y2={c.y} opacity="0.09" />
        <line x1={c.x} y1="0" x2={c.x} y2={H} opacity="0.2" strokeWidth="1.3" strokeDasharray="0 6" />
        <g opacity="0.06">
          {spokes.map((t, i) => <line key={i} x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} />)}
        </g>
        <g className="sky-chart-turn" style={turn}>
          <circle cx={c.x} cy={c.y} r={limbIn} opacity="0.14" />
          <circle cx={c.x} cy={c.y} r={limbOut} opacity="0.14" />
          <g opacity="0.12" strokeWidth="0.55">
            {ticks.map((t, i) => <line key={i} x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} />)}
          </g>
        </g>
        <circle className="sky-chart-turn sky-chart-turn--back" style={turn} cx={c.x} cy={c.y} r={dotR} opacity="0.2" strokeWidth="1.5" strokeDasharray="0 7" />
        <g opacity="0.18">
          {nodes.filter(p => p.kind !== 'body').map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.2" />
              {p.kind === 'double' && <circle cx={p.x} cy={p.y} r="6.5" />}
            </g>
          ))}
        </g>
        <g opacity="0.26" fill={INK} stroke="none">
          {nodes.filter(p => p.kind === 'body').map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.4" />)}
        </g>
        <g opacity="0.2" fill={INK} stroke="none">
          {diamonds.map((d, i) => <path key={i} d={`M${d.x} ${d.y - 2.6}l2.6 2.6-2.6 2.6-2.6-2.6z`} />)}
        </g>
      </g>
    </svg>
  )
}
