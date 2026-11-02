import { useEffect, useRef } from 'react'

// Where the rain cloud sits. The camera's vertical FOV is fixed, so its height
// and width both scale with the window height, and it stays centred on any screen
const CLOUD = { y: 0.3, radiusY: 0.15, radiusX: 0.42 }

const FADE_MS = 1200

type Drop = { x: number; birth: number; y: number; speed: number; length: number; alpha: number }

// Reduced motion gets a settled sky, so scatter drops along their whole fall
function spawn(drop: Drop, w: number, h: number, settled: boolean) {
  const span = Math.min(w / 2, CLOUD.radiusX * h)
  const dx = (Math.random() * 2 - 1) * span
  // Starts inside the cloud, near its curved underside, so the drop emerges from it
  const edge = Math.sqrt(Math.max(0, 1 - (dx / (CLOUD.radiusX * h)) ** 2))
  drop.x = w / 2 + dx
  drop.birth = (CLOUD.y + CLOUD.radiusY * edge * (0.3 + Math.random() * 0.7)) * h
  drop.y = settled ? drop.birth + Math.random() * (h - drop.birth) : drop.birth
  drop.speed = (0.75 + Math.random() * 0.45) * h
  drop.length = 12 + Math.random() * 16
  drop.alpha = 0.3 + Math.random() * 0.5
}

function drawDrop(ctx: CanvasRenderingContext2D, d: Drop, h: number) {
  // Fades in as it leaves the cloud and out before it reaches the ground
  const out = (d.y - d.birth) / (h - d.birth)
  const fade = Math.min(1, out / 0.05, (1 - out) / 0.35)
  if (fade <= 0) return
  ctx.globalAlpha = d.alpha * fade
  ctx.beginPath()
  ctx.moveTo(d.x, d.y)
  ctx.lineTo(d.x - d.length * 0.08, d.y + d.length)
  ctx.stroke()
}

// Rain falling from the scene's clouds, drawn over the sky and behind the app
export function RainDrops({ active, heavy, still }: { active: boolean; heavy: boolean; still: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx || !active) return

    let w = 0
    let h = 0
    let drops: Drop[] = []
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      w = window.innerWidth
      h = window.innerHeight
      el.width = w * dpr
      el.height = h * dpr
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#e4ecf8'
      ctx.lineCap = 'round'
      ctx.lineWidth = 1.2
      const count = Math.round(Math.min(w, CLOUD.radiusX * h * 2) / (heavy ? 3 : 5))
      drops = Array.from({ length: count }, () => {
        const d: Drop = { x: 0, birth: 0, y: 0, speed: 0, length: 0, alpha: 0 }
        spawn(d, w, h, true)
        return d
      })
    }
    const paint = () => {
      ctx.clearRect(0, 0, w, h)
      for (const d of drops) drawDrop(ctx, d, h)
    }

    let id = 0
    let last = performance.now()
    const step = (now: number) => {
      // A long gap means the tab was away, so don't jump the drops
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      for (const d of drops) {
        d.y += d.speed * dt
        if (d.y >= h) spawn(d, w, h, false)
      }
      paint()
      id = requestAnimationFrame(step)
    }

    const refit = () => { resize(); if (still) paint() }
    refit()
    if (!still) id = requestAnimationFrame(step)
    window.addEventListener('resize', refit)
    return () => {
      window.removeEventListener('resize', refit)
      // Drops keep falling while the layer fades out
      window.setTimeout(() => cancelAnimationFrame(id), FADE_MS)
    }
  }, [active, heavy, still])

  return <canvas ref={canvas} className={`weather-rain${active ? ' on' : ''}`} />
}
