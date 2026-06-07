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

function skyColors(tod: TOD, cond: Condition): { top: string; mid: string; bot: string } {
  let top: string, mid: string, bot: string
  switch (tod) {
    case 'dawn':      top='#2a3f6a'; mid='#c88a6e'; bot='#f0b98c'; break
    case 'morning':   top='#3a6ba8'; mid='#5a95c9'; bot='#a9cde6'; break
    case 'midday':    top='#2a70c0'; mid='#4a92d6'; bot='#82b7e3'; break
    case 'afternoon': top='#3875b8'; mid='#7095c2'; bot='#e0b484'; break
    case 'evening':   top='#1e3658'; mid='#6f4a7a'; bot='#d58560'; break
    case 'dusk':      top='#0f2242'; mid='#3a3560'; bot='#72506a'; break
    default:          top='#020308'; mid='#070d1f'; bot='#0f1830'; break
  }
  if (cond === 'cloudy') {
    top = blend(top,'#3a4555',0.4); mid = blend(mid,'#556172',0.4); bot = blend(bot,'#6a7584',0.4)
  } else if (cond === 'rain') {
    top = blend(top,'#1f2a3a',0.55); mid = blend(mid,'#384553',0.55); bot = blend(bot,'#4b5866',0.55)
  } else if (cond === 'storm') {
    top = blend(top,'#0d131e',0.7); mid = blend(mid,'#1f2634',0.7); bot = blend(bot,'#2c3442',0.7)
  } else if (cond === 'snow') {
    top = blend(top,'#4a5a70',0.5); mid = blend(mid,'#7a8698',0.5); bot = blend(bot,'#a8b2bf',0.5)
  }
  return { top, mid, bot }
}

export function skyGradient(tod: TOD, cond: Condition): string {
  const { top, mid, bot } = skyColors(tod, cond)
  return `linear-gradient(to bottom, ${top} 0%, ${mid} 55%, ${bot} 100%)`
}

export function skyTopColor(tod: TOD, cond: Condition): string {
  return skyColors(tod, cond).top
}

export function sunPos(tod: TOD): { top: string; right: string; color: string } {
  switch (tod) {
    case 'dawn':      return { top:'55%', right:'15%', color:'#ffba8a' }
    case 'morning':   return { top:'25%', right:'20%', color:'#ffd48a' }
    case 'midday':    return { top:'10%', right:'45%', color:'#ffe7a8' }
    case 'afternoon': return { top:'30%', right:'10%', color:'#ffb98a' }
    case 'evening':   return { top:'60%', right:'8%',  color:'#ff8a5c' }
    default:          return { top:'-40%', right:'-40%', color:'#000' }
  }
}
