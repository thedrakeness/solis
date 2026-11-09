import { useEffect, useState } from 'react'
import { Sky } from './Sky'
import { isNightTod, localIso, todAt } from '../lib/utils'

// Anything with both sides this long is a tablet or bigger. Phones stay under
// it on their short side, so they're never blocked, even held sideways.
const LARGE_SCREEN = '(min-width: 600px) and (min-height: 600px)'

export function useLargeScreen() {
  const [large, setLarge] = useState(() => window.matchMedia(LARGE_SCREEN).matches)
  useEffect(() => {
    const mq = window.matchMedia(LARGE_SCREEN)
    const update = () => setLarge(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return large
}

// Same day/night split as the app, on this device's clock
function useNight() {
  const check = () => isNightTod(todAt(localIso(new Date())))
  const [night, setNight] = useState(check)
  useEffect(() => {
    const t = setInterval(() => setNight(check()), 60_000)
    return () => clearInterval(t)
  }, [])
  return night
}

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

type Pt = { x: number; y: number }

const polar = (c: Pt, r: number, deg: number): Pt => ({
  x: c.x + r * Math.cos((deg * Math.PI) / 180),
  y: c.y + r * Math.sin((deg * Math.PI) / 180),
})

// Linework: a warm parchment cream by night, white against the day sky, as in the sky chart
const INK = { night: '#e6dcc4', day: '#ffffff' }

// An astrolabe drawn in the sky chart's line language, with the message in the
// clear face of its dial: a graduated limb, a ring of dots, an off-centre
// ecliptic, circles hanging from the limb, a meridian, a horizon and
// construction lines fanning down from above the screen
function Astrolabe({ night }: { night: boolean }) {
  const { w: W, h: H } = useViewport()
  const c = { x: W / 2, y: H * 0.48 }
  const face = Math.min(W, H) * 0.27
  const limbOut = face + 14
  const dotR = limbOut * 1.18
  const family = limbOut * 1.62
  const outer = Math.hypot(W, H) * 0.5

  const ticks = Array.from({ length: 180 }, (_, i) => {
    const deg = i * 2
    return { a: polar(c, face, deg), b: polar(c, i % 5 === 0 ? limbOut : face + 5, deg) }
  })
  // Circles of decreasing size that all touch the limb at its top
  const stack = [0.86, 0.7, 0.54].map(k => ({ cy: c.y - face + face * k, r: face * k }))
  const apex = { x: c.x - W * 0.04, y: -H * 0.6 }
  const rays = [-3, -2, -1, 0, 1, 2, 3].map(k => ({ x: c.x + k * W * 0.2, y: H }))
  const ecliptic = { cx: c.x, cy: c.y - face * 0.32, r: face * 1.22 }

  const nodes: (Pt & { kind: 'open' | 'double' | 'body' })[] = [
    { ...polar(c, family, -32), kind: 'double' },
    { ...polar(c, family, 152), kind: 'open' },
    { ...polar(c, dotR, 214), kind: 'body' },
    { ...polar(c, outer * 0.62, -128), kind: 'open' },
    { ...polar(c, outer * 0.62, 38), kind: 'double' },
    { x: c.x, y: c.y - limbOut, kind: 'body' },
    { x: c.x + family, y: c.y, kind: 'body' },
  ]

  const ink = night ? INK.night : INK.day
  const spin = (seconds: number, reverse = false) => ({
    transformOrigin: `${c.x}px ${c.y}px`,
    animationDuration: `${seconds}s`,
    animationDirection: reverse ? 'reverse' : 'normal',
  })

  return (
    <svg className="phone-only-chart" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        {/* Keeps the dial's face clear behind the text */}
        <mask id="phone-only-face" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="#fff" />
          <circle cx={c.x} cy={c.y} r={face - 2} fill="#000" />
        </mask>
      </defs>
      <g mask="url(#phone-only-face)" fill="none" stroke={ink} strokeWidth={night ? 0.75 : 1} strokeLinecap="round">
        <g opacity="0.08">
          <circle cx={c.x} cy={c.y} r={outer * 0.62} />
          <circle cx={c.x} cy={c.y} r={outer * 0.9} />
          {rays.map((p, i) => <line key={i} x1={apex.x} y1={apex.y} x2={p.x} y2={p.y} />)}
        </g>
        <line x1="0" y1={c.y} x2={W} y2={c.y} opacity="0.12" />
        <line x1={c.x} y1="0" x2={c.x} y2={H} opacity="0.22" strokeWidth="1.3" strokeDasharray="0 6" />
        <circle cx={c.x} cy={c.y} r={family} opacity="0.12" />
        <circle cx={ecliptic.cx} cy={ecliptic.cy} r={ecliptic.r} opacity="0.13" />
        <g opacity="0.1">
          {stack.map(s => <circle key={s.r} cx={c.x} cy={s.cy} r={s.r} />)}
        </g>
        <circle cx={c.x} cy={c.y} r={face} opacity="0.2" />
        <circle cx={c.x} cy={c.y} r={limbOut} opacity="0.18" />
        <g className="phone-only-turn" style={spin(480)} opacity="0.16" strokeWidth="0.6">
          {ticks.map((t, i) => <line key={i} x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} />)}
        </g>
        <circle className="phone-only-turn" style={spin(300, true)} cx={c.x} cy={c.y} r={dotR}
          opacity="0.24" strokeWidth="1.5" strokeDasharray="0 7" />
        <g opacity="0.22">
          {nodes.filter(p => p.kind !== 'body').map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.2" />
              {p.kind === 'double' && <circle cx={p.x} cy={p.y} r="6.5" />}
            </g>
          ))}
        </g>
        <g opacity="0.32" fill={ink} stroke="none">
          {nodes.filter(p => p.kind === 'body').map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.4" />)}
        </g>
      </g>
    </svg>
  )
}

// Shown instead of the app on tablets and computers
export function PhoneOnly() {
  const night = useNight()
  return (
    <div className="phone-only-screen">
      <Sky tod={night ? 'night' : 'midday'} cond="clear" />
      <Astrolabe night={night} />
      <main className="phone-only">
        <div className="phone-only-brand">SOLIS</div>
        <h1 className="phone-only-title">Open Solis on your phone</h1>
        <p className="phone-only-body">
          Solis is made for phone screens only. Visit <span className="phone-only-host">{window.location.host}</span> on
          your phone to see your sky.
        </p>
      </main>
    </div>
  )
}
