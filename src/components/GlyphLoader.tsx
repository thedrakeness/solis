// Mobile loading visual: a small astrolabe drawn in the same language as the
// night sky chart. A graduated dial and a ring of dots turn slowly in opposite
// directions, a stack of circles touching at the top swings like a pendulum, and
// bodies orbit the core. viewBox is centred on 0,0 so every layer turns about the middle.
const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}

// Every 5°, with every 6th (30°) running the full width of the dial
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5
  const [x1, y1] = polar(i % 6 === 0 ? 50.5 : 53, deg)
  const [x2, y2] = polar(55.5, deg)
  return { x1, y1, x2, y2 }
})

// Circles that all touch the dial's inner ring at the top
const STACK = [34, 29, 24].map(r => ({ cy: -38 + r, r }))

export default function GlyphLoader() {
  return (
    <svg className="glyph-loader" viewBox="-60 -60 120 120" aria-hidden="true">
      <line className="gl-meridian" x1="0" y1="-60" x2="0" y2="60" />
      <g className="gl-layer gl-dial">
        <circle r="56" />
        <circle r="50.5" />
        {TICKS.map((t, i) => <line key={i} {...t} />)}
      </g>
      <g className="gl-layer gl-dots">
        <circle r="44" />
      </g>
      <circle className="gl-ring" r="38" />
      <g className="gl-layer gl-stack">
        {STACK.map(s => <circle key={s.r} cy={s.cy} r={s.r} />)}
      </g>
      <circle className="gl-ring" r="16" />
      <g className="gl-layer gl-orbit-a">
        <circle className="gl-body" cy="-38" r="2.8" />
      </g>
      <g className="gl-layer gl-orbit-b">
        <circle cy="16" r="2.4" />
        <circle cy="16" r="4.6" />
      </g>
      <g className="gl-layer gl-orbit-c">
        <circle className="gl-body" cx="44" r="1.6" />
      </g>
      <circle r="6.5" />
      <circle className="gl-body" r="3.2" />
    </svg>
  )
}
