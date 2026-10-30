// Mobile loading visual: nested geometric glyphs, each spinning opposite to its neighbours.
// viewBox is centred on 0,0 so every layer rotates around the middle.
export default function GlyphLoader() {
  return (
    <svg className="glyph-loader" viewBox="-60 -60 120 120" aria-hidden="true">
      <g className="gl-layer gl-arcs">
        <circle r="50" />
      </g>
      <g className="gl-layer gl-hex">
        <polygon points="42,0 21,36.37 -21,36.37 -42,0 -21,-36.37 21,-36.37" />
      </g>
      <g className="gl-layer gl-oct">
        <polygon points="27.72,11.48 11.48,27.72 -11.48,27.72 -27.72,11.48 -27.72,-11.48 -11.48,-27.72 11.48,-27.72 27.72,-11.48" />
      </g>
      <g className="gl-layer gl-square">
        <polygon points="0,-17 17,0 0,17 -17,0" />
      </g>
      <g className="gl-layer gl-core">
        <circle r="9" />
      </g>
      <circle className="gl-dot" r="2.5" />
    </svg>
  )
}
