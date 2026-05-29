import { useMemo } from 'react'
import type { TOD, Condition } from '../types'
import { skyGradient, sunPos } from '../lib/sky'
import { isNightTod } from '../lib/utils'

interface Drop { left: number; delay: number; dur: number; h: number }
interface Flake { left: number; delay: number; dur: number; size: number }

export function Sky({ tod, cond }: { tod: TOD; cond: Condition }) {
  const bg = skyGradient(tod, cond)
  const night = isNightTod(tod)
  const hasSun = !night && cond !== 'storm'
  const sp = sunPos(tod)

  const classNames = ['sky', night ? 'night' : '', hasSun ? 'has-sun' : '', cond].filter(Boolean).join(' ')

  const drops = useMemo<Drop[]>(() => {
    if (cond !== 'rain' && cond !== 'storm') return []
    const n = cond === 'storm' ? 90 : 60
    return Array.from({ length: n }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * -1.2,
      dur: 0.6 + Math.random() * 0.5,
      h: 10 + Math.random() * 14,
    }))
  }, [cond])

  const flakes = useMemo<Flake[]>(() => {
    if (cond !== 'snow') return []
    return Array.from({ length: 70 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * -10,
      dur: 6 + Math.random() * 6,
      size: 2 + Math.random() * 2.5,
    }))
  }, [cond])

  return (
    <div className={classNames} style={{ background: bg }}>
      <div className="sun-halo" style={{
        top: sp.top,
        right: sp.right,
        background: `radial-gradient(closest-side, ${sp.color}, transparent 70%)`,
      }} />
      <div className="stars" />
      <div className="rain">
        {drops.map((d, i) => (
          <div key={i} className="rain-drop" style={{
            left: d.left + '%',
            animationDuration: d.dur + 's',
            animationDelay: d.delay + 's',
            height: d.h + 'px',
          }} />
        ))}
      </div>
      <div className="snow">
        {flakes.map((f, i) => (
          <div key={i} className="snow-flake" style={{
            left: f.left + '%',
            animationDuration: f.dur + 's',
            animationDelay: f.delay + 's',
            width: f.size + 'px',
            height: f.size + 'px',
          }} />
        ))}
      </div>
      <div className="lightning" />
    </div>
  )
}
