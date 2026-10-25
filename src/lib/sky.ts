import type { TOD, Condition } from '../types'

function hexToRgb(h: string) {
  const n = h.replace('#', '')
  return { r: parseInt(n.slice(0,2),16), g: parseInt(n.slice(2,4),16), b: parseInt(n.slice(4,6),16) }
}

function blend(hex1: string, hex2: string, t: number): string {
  const a = hexToRgb(hex1), b = hexToRgb(hex2)
  const r = Math.round(a.r * (1-t) + b.r * t)
  const g = Math.round(a.g * (1-t) + b.g * t)
  const bl = Math.round(a.b * (1-t) + b.b * t)
  return `#${[r,g,bl].map(v => v.toString(16).padStart(2,'0')).join('')}`
}

// Deep, saturated palette to match the Spline scene: cobalt zenith, a lit
// horizon band, and warm magenta/ember sunsets
function skyColors(tod: TOD, cond: Condition): { top: string; mid: string; bot: string; glow: string } {
  let top: string, mid: string, bot: string, glow: string
  switch (tod) {
    case 'dawn':      top='#16163f'; mid='#7a3a72'; bot='#ff9459'; glow='#ff8a4c'; break
    case 'morning':   top='#0f2a6e'; mid='#2a6ad0'; bot='#8fc0f2'; glow='#ffd6a8'; break
    case 'midday':    top='#0b2563'; mid='#1c5fd0'; bot='#4f9bf0'; glow='#a8d4ff'; break
    case 'afternoon': top='#0d2668'; mid='#2f62c0'; bot='#f0a868'; glow='#ffbf73'; break
    case 'evening':   top='#150d38'; mid='#6e2468'; bot='#ff6236'; glow='#ff5a2a'; break
    case 'dusk':      top='#060821'; mid='#25164a'; bot='#6e2a5a'; glow='#c2406a'; break
    default:          top='#010209'; mid='#050b24'; bot='#0c1a44'; glow='#2148a0'; break
  }
  if (cond === 'cloudy') {
    top = blend(top,'#2e3848',0.4); mid = blend(mid,'#4a5568',0.4); bot = blend(bot,'#66717f',0.4); glow = blend(glow,'#8a94a3',0.5)
  } else if (cond === 'rain') {
    top = blend(top,'#161f2e',0.55); mid = blend(mid,'#2c3848',0.55); bot = blend(bot,'#43505f',0.55); glow = blend(glow,'#5a6878',0.65)
  } else if (cond === 'storm') {
    top = blend(top,'#080c16',0.7); mid = blend(mid,'#1a1f30',0.7); bot = blend(bot,'#2a2840',0.65); glow = blend(glow,'#5a4a7a',0.6)
  } else if (cond === 'snow') {
    top = blend(top,'#3e4c64',0.5); mid = blend(mid,'#717e92',0.5); bot = blend(bot,'#a8b2bf',0.5); glow = blend(glow,'#dfe6ef',0.6)
  }
  return { top, mid, bot, glow }
}

export function skyGradient(tod: TOD, cond: Condition): string {
  const { top, mid, bot, glow } = skyColors(tod, cond)
  const glowAlpha = cond === 'storm' || cond === 'rain' ? '55' : '99'
  return [
    // Lit haze band along the horizon, like the scene's Horizon Glow
    `radial-gradient(130% 42% at 50% 100%, ${glow}${glowAlpha} 0%, ${glow}33 45%, transparent 75%)`,
    `linear-gradient(to bottom, ${top} 0%, ${mid} 58%, ${bot} 100%)`,
  ].join(', ')
}

export function skyTopColor(tod: TOD, cond: Condition): string {
  return skyColors(tod, cond).top
}

export function sunPos(tod: TOD): { top: string; right: string; color: string } {
  switch (tod) {
    case 'dawn':      return { top:'55%', right:'15%', color:'#ff9a5c' }
    case 'morning':   return { top:'25%', right:'20%', color:'#ffc46a' }
    case 'midday':    return { top:'10%', right:'45%', color:'#ffd27a' }
    case 'afternoon': return { top:'30%', right:'10%', color:'#ffa85a' }
    case 'evening':   return { top:'60%', right:'8%',  color:'#ff6a3a' }
    default:          return { top:'-40%', right:'-40%', color:'#000' }
  }
}
