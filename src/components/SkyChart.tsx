import { useId, useLayoutEffect, useState } from 'react'

// Where the sun or moon's disc sits on screen, in viewport px
export type BodySlot = { x: number; y: number; r: number }

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

// Same as WeatherScene: measured as if the snap scroller sat at the top, since the sky is fixed.
// The 'Hour by Hour' pill straddles the card's top edge, so the chart ends just above it.
function measureBottom() {
  const scrollY = document.querySelector('.main--snap')?.scrollTop ?? 0
  const card = document.querySelector<HTMLElement>('.mob-hero-scrubber')
  return card?.offsetHeight ? card.getBoundingClientRect().top + scrollY - 14 : window.innerHeight * 0.8
}

// Linework: a warm parchment cream by night, like ink on an old star chart; white against the day sky
const INK = { night: '#e6dcc4', day: '#ffffff' }

type Node = Pt & { kind: 'open' | 'double' | 'body' }

// A faint, still celestial chart centred on the sun or moon: a graduated dial, a ring
// of dots, a circle hanging from the dial down to the hourly card, a dotted meridian,
// horizon and construction lines from above the screen. It sits over the 3D canvas,
// so the body's disc is masked out to read as in front.
export function SkyChart({ body, masked, day }: { body: BodySlot; masked: boolean; day: boolean }) {
  const id = useId()
  const [bottom, setBottom] = useState(measureBottom)
  useLayoutEffect(() => setBottom(measureBottom()), [body])

  const W = window.innerWidth
  const H = window.innerHeight
  const c = { x: body.x, y: body.y }
  const limbIn = body.r * 1.32
  const limbOut = limbIn + 9
  const dotR = limbOut * 1.3
  const family = limbOut * 1.9
  const top = c.y - limbOut
  // Reaches the card below and runs off the top of the screen above
  const ring = Math.max(bottom - c.y, family * 1.15)

  // Full dial, every 2°; every 5th runs the full limb width
  const ticks = Array.from({ length: 180 }, (_, i) => {
    const deg = i * 2
    return { a: polar(c, limbIn, deg), b: polar(c, i % 5 === 0 ? limbOut : limbIn + 3.5, deg) }
  })
  // Spokes between the dial and the ring of dots
  const spokes = Array.from({ length: 24 }, (_, i) => ({ a: polar(c, limbOut + 4, i * 15), b: polar(c, dotR - 5, i * 15) }))
  // Circles that touch the dial at its top; the larger hangs down to the card
  const stack = [limbOut * 1.3, Math.max((bottom - top) / 2, limbOut * 1.6)].map(r => ({ r, cy: top + r }))

  // Construction lines fan out from a point well above the screen down to the card
  const apex = { x: c.x + W * 0.06, y: -H * 0.45 }
  const rays = [-2, -1, 0, 1, 2].map(k => ({ x: c.x + k * W * 0.38, y: bottom }))

  // A handful of bodies and nodes on the rings, not every crossing
  const at = (p: Pt | null, kind: Node['kind']) => (p ? { ...p, kind } : null)
  const nodes = [
    at({ x: c.x, y: top }, 'body'),
    at({ x: c.x + family, y: c.y }, 'open'),
    at(crossing(apex, rays[3], c, family, 'upper'), 'double'),
    at(polar(c, family, 200), 'body'),
    at(crossing(apex, rays[1], c, dotR, 'lower'), 'open'),
    at(crossing(apex, rays[1], c, ring, 'upper'), 'double'),
  ].filter((p): p is Node => !!p && p.x > 8 && p.x < W - 8 && p.y > TOP_CLEAR && p.y < bottom)

  // Small diamond glyphs: a row up left, a lattice down right
  const diamonds = [
    ...[0, 1, 2, 3].map(i => ({ x: 26 + i * 9, y: top + 6 })),
    ...[0, 1, 2].flatMap(i => [0, 1, 2].map(j => ({ x: W - 46 + i * 8, y: c.y + limbOut * 0.95 + j * 8 }))),
  ]

  // Full strength from the top of the screen, easing out just above the card
  const stop = (y: number) => Math.min(1, Math.max(0, y / H))
  const ink = day ? INK.day : INK.night

  return (
    <svg className="sky-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop offset={stop(bottom - 48)} stopColor="#fff" />
          <stop offset={stop(bottom)} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill={`url(#${id}-fade)`} />
          {masked && <circle cx={c.x} cy={c.y} r={body.r + 0.5} fill="#000" />}
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`} fill="none" stroke={ink} strokeWidth={day ? 1 : 0.75} strokeLinecap="round">
        <g opacity="0.07">
          <circle cx={c.x} cy={c.y} r={ring} />
          {rays.map((p, i) => <line key={i} x1={apex.x} y1={apex.y} x2={p.x} y2={p.y} />)}
        </g>
        <g opacity="0.08">
          {stack.map(s => <circle key={s.r} cx={c.x} cy={s.cy} r={s.r} />)}
        </g>
        <circle cx={c.x} cy={c.y} r={family} opacity="0.1" />
        <line x1="0" y1={c.y} x2={W} y2={c.y} opacity="0.09" />
        <line x1={c.x} y1="0" x2={c.x} y2={bottom} opacity="0.2" strokeWidth="1.3" strokeDasharray="0 6" />
        <g opacity="0.06">
          {spokes.map((t, i) => <line key={i} x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} />)}
        </g>
        <circle cx={c.x} cy={c.y} r={limbIn} opacity="0.14" />
        <circle cx={c.x} cy={c.y} r={limbOut} opacity="0.14" />
        <g opacity="0.12" strokeWidth="0.55">
          {ticks.map((t, i) => <line key={i} x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} />)}
        </g>
        <circle cx={c.x} cy={c.y} r={dotR} opacity="0.2" strokeWidth="1.5" strokeDasharray="0 7" />
        <g opacity="0.18">
          {nodes.filter(p => p.kind !== 'body').map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.2" />
              {p.kind === 'double' && <circle cx={p.x} cy={p.y} r="6.5" />}
            </g>
          ))}
        </g>
        <g opacity="0.26" fill={ink} stroke="none">
          {nodes.filter(p => p.kind === 'body').map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.4" />)}
        </g>
        <g opacity="0.2" fill={ink} stroke="none">
          {diamonds.map((d, i) => <path key={i} d={`M${d.x} ${d.y - 2.6}l2.6 2.6-2.6 2.6-2.6-2.6z`} />)}
        </g>
      </g>
    </svg>
  )
}
