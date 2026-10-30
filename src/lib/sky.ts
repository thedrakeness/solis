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

// Mirrors the Sky Dome gradient in the Spline scene: pale, faded mornings that
// deepen to cobalt at midday, then amber golden hour and ember/magenta sunsets
function skyColors(tod: TOD, cond: Condition): { top: string; mid: string; bot: string; glow: string } {
  let top: string, mid: string, bot: string, glow: string
  switch (tod) {
    case 'dawn':        top='#1e2258'; mid='#6a4a80'; bot='#e8966e'; glow='#e8966e'; break
    case 'sunrise':     top='#5478b4'; mid='#a894b0'; bot='#f2b48a'; glow='#ffc8a0'; break
    case 'morning':     top='#6a9ad0'; mid='#94b4d6'; bot='#d8c8b4'; glow='#ffe6c8'; break
    case 'latemorning': top='#2f6fcc'; mid='#5a98dc'; bot='#a8cbe6'; glow='#d6e8f8'; break
    case 'midday':      top='#103ea4'; mid='#2264d4'; bot='#4a8fe0'; glow='#a8d4ff'; break
    case 'afternoon':   top='#2558b4'; mid='#4a88d4'; bot='#a0c0dc'; glow='#dfe6e8'; break
    case 'golden':      top='#5c7cae'; mid='#c8a080'; bot='#ffb65c'; glow='#ffc070'; break
    case 'evening':     top='#2a1a66'; mid='#a03c84'; bot='#ff7a3c'; glow='#ff6a30'; break
    case 'dusk':        top='#0f1038'; mid='#38205e'; bot='#8a3f78'; glow='#c2406a'; break
    default:            top='#040618'; mid='#0a0f30'; bot='#141a4a'; glow='#2148a0'; break
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
    case 'dawn':        return { top:'55%', right:'15%', color:'#ff9a5c' }
    case 'sunrise':     return { top:'40%', right:'18%', color:'#ffb066' }
    case 'morning':     return { top:'25%', right:'20%', color:'#ffc46a' }
    case 'latemorning': return { top:'16%', right:'32%', color:'#ffcc72' }
    case 'midday':      return { top:'10%', right:'45%', color:'#ffd27a' }
    case 'afternoon':   return { top:'30%', right:'10%', color:'#ffa85a' }
    case 'golden':      return { top:'45%', right:'9%',  color:'#ff9248' }
    case 'evening':     return { top:'60%', right:'8%',  color:'#ff6a3a' }
    default:            return { top:'-40%', right:'-40%', color:'#000' }
  }
}
