import { useState } from 'react'
import type { CSSProperties } from 'react'

// Mechanical counter: each digit that changes sits on a short drum strip that
// clicks past the window, old digit out and new digit in. Warmer rolls up,
// cooler rolls down. Digits that don't change stay put, and the ones column
// leads with each column to its left following a beat behind.
export function RollingNumber({ value }: { value: string }) {
  const [roll, setRoll] = useState({ from: value, to: value, dir: 1, gen: 0 })
  if (roll.to !== value) {
    const dir = Number(value) >= Number(roll.to) ? 1 : -1
    setRoll({ from: roll.to, to: value, dir, gen: roll.gen + 1 })
  }

  const len = Math.max(roll.from.length, roll.to.length)
  const from = roll.from.padStart(len)
  const to = roll.to.padStart(len)

  return (
    <span className="roll" aria-label={value} role="text">
      {Array.from(to, (ch, i) => {
        const old = from[i]
        const col = len - 1 - i
        if (old === ch) {
          return ch === ' ' ? null : <span key={`s${col}`} className="roll-slot" aria-hidden>{ch}</span>
        }
        // Strip is laid out top to bottom; rolling up shows old then new,
        // rolling down starts on the new digit above and drops it in
        const strip = roll.dir > 0 ? [old, ch] : [ch, old]
        return (
          <span
            key={`r${col}-${roll.gen}`}
            className={`roll-slot rolling ${roll.dir > 0 ? 'up' : 'down'}`}
            style={{ '--roll-delay': `${col * 45}ms` } as CSSProperties}
            aria-hidden
          >
            <span className="roll-strip">
              <span>{strip[0] === ' ' ? ' ' : strip[0]}</span>
              <span>{strip[1] === ' ' ? ' ' : strip[1]}</span>
            </span>
            {/* Sizes the slot to the digit it lands on */}
            <span className="roll-sizer">{ch === ' ' ? '' : ch}</span>
          </span>
        )
      })}
    </span>
  )
}
