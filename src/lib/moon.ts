const SYNODIC_DAYS = 29.530588853
// A known new moon: 2000-01-06 18:14 UTC
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

// Position in the lunar cycle: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
export function moonPhase(date = new Date()): number {
  const days = (date.getTime() - REF_NEW_MOON) / 86_400_000
  const p = (days / SYNODIC_DAYS) % 1
  return p < 0 ? p + 1 : p
}

// Fraction of the disc that is lit, 0..1
export function moonIllumination(phase: number): number {
  return (1 - Math.cos(phase * 2 * Math.PI)) / 2
}
