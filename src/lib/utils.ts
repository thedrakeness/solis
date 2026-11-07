import type { Condition, SunTimes, TOD, Unit } from '../types'

// A rough sky for when a place's sun times aren't known
function todFromHour(hour: number): TOD {
  if (hour >= 5 && hour < 6) return 'dawn'
  if (hour >= 6 && hour < 7) return 'sunrise'
  if (hour >= 7 && hour < 9) return 'morning'
  if (hour >= 9 && hour < 11) return 'latemorning'
  if (hour >= 11 && hour < 15) return 'midday'
  if (hour >= 15 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 18) return 'golden'
  if (hour >= 18 && hour < 20) return 'evening'
  if (hour >= 20 && hour < 21) return 'dusk'
  return 'night'
}

const minutesIntoDay = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16))

// The sky for a local time at a place. Stages are anchored to that day's sunrise
// and sunset, so the sun is gone at sunset whatever the season or location.
// Polar days and nights have no usable pair, so they follow the clock.
export function todAt(iso: string, sun?: SunTimes[]): TOD {
  const day = sun?.find(d => d.sunset.startsWith(iso.slice(0, 10)))
  const rise = day ? minutesIntoDay(day.sunrise) : 0
  const set = day ? minutesIntoDay(day.sunset) : 0
  if (set <= rise) return todFromHour(Number(iso.slice(11, 13)))
  const t = minutesIntoDay(iso)
  const length = set - rise
  if (t < rise - 40) return 'night'
  if (t < rise) return 'dawn'
  if (t < rise + 45) return 'sunrise'
  if (t < rise + length * 0.2) return 'morning'
  if (t < rise + length * 0.35) return 'latemorning'
  if (t < rise + length * 0.65) return 'midday'
  if (t < set - 90) return 'afternoon'
  if (t < set - 30) return 'golden'
  if (t < set) return 'evening'
  if (t < set + 40) return 'dusk'
  return 'night'
}

// How far the sun and moon are across the sky, from -1 (just risen, far left)
// through 0 (halfway, centred) to 1 (setting, far right). Each holds at an end
// while it's down, on the side it will next appear from or just left by.
export function skyArc(iso: string, sun?: SunTimes[]): { sun: number; moon: number } {
  const i = sun?.findIndex(d => d.sunset.startsWith(iso.slice(0, 10))) ?? -1
  const day = sun?.[i]
  let rise = day ? minutesIntoDay(day.sunrise) : 0
  let set = day ? minutesIntoDay(day.sunset) : 0
  // Polar days and nights follow the clock fallback's 6am to 8pm
  const known = set > rise
  if (!known) { rise = 360; set = 1200 }
  const t = minutesIntoDay(iso)
  const across = (from: number, to: number) => Math.min(1, Math.max(-1, ((t - from) / (to - from)) * 2 - 1))
  if (t < rise) {
    const prevSet = known && sun?.[i - 1] ? minutesIntoDay(sun[i - 1].sunset) : set
    return { sun: -1, moon: across(prevSet - 1440, rise) }
  }
  if (t >= set) {
    const nextRise = known && sun?.[i + 1] ? minutesIntoDay(sun[i + 1].sunrise) : rise
    return { sun: 1, moon: across(set, nextRise + 1440) }
  }
  return { sun: across(rise, set), moon: t < (rise + set) / 2 ? 1 : -1 }
}

// The time on the clock at a place rather than on this device, in the API's format
export function localIso(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short', timeZone }).format(date).replace(' ', 'T')
}

export function isNightTod(tod: TOD): boolean {
  return tod === 'night' || tod === 'dusk'
}

export function formatTemp(f: number, unit: Unit): string {
  if (unit === 'C') return String(Math.round((f - 32) * 5 / 9))
  return String(Math.round(f))
}

export function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

// Reads the clock from the API's local time, so it stays the location's time
export function formatClock(iso: string): string {
  const [hour, period] = formatHour(Number(iso.slice(11, 13))).split(' ')
  return `${hour}:${iso.slice(14, 16)} ${period}`
}

export function formatTempUnit(f: number, unit: Unit): string {
  return `${formatTemp(f, unit)}°`
}

const WIND_DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
export function getWindDir(deg: number): string {
  return WIND_DIRS[Math.round(deg / 22.5) % 16]
}

export function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Fair'
  if (aqi <= 200) return 'Unhealthy'
  return 'Hazardous'
}

export function condDesc(c: Condition): string {
  const descs: Record<Condition, string> = {
    clear: 'Clear skies',
    partly: 'Partly cloudy',
    cloudy: 'Overcast',
    rain: 'Rain showers',
    storm: 'Thunderstorms',
    snow: 'Snow showers',
  }
  return descs[c]
}

export function condLabel(c: Condition): string {
  const labels: Record<Condition, string> = {
    clear: 'Clear',
    partly: 'Partly Cloudy',
    cloudy: 'Overcast',
    rain: 'Rain',
    storm: 'Thunderstorm',
    snow: 'Snow',
  }
  return labels[c]
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function dayName(date: Date, isToday: boolean): string {
  if (isToday) return 'Today'
  return DAY_NAMES[date.getDay()]
}

export function dateStr(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

export function monthName(date: Date): string {
  return MONTH_NAMES[date.getMonth()]
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/**
 * Apple-Weather-style brief conditions summary. Only mentions wind,
 * humidity, and precipitation when they're notable; returns null when
 * none of them are worth calling out.
 */
export function describeConditions(precipProb: number, humidity: number, windSpeed: number, windDir: string): string | null {
  const parts: string[] = []
  if (precipProb > 0) parts.push(`${precipProb}% chance of rain`)
  if (humidity >= 60) parts.push(`high humidity at ${humidity}%`)
  if (windSpeed >= 8) {
    parts.push(windSpeed > 18 ? `gusty winds up to ${windSpeed} mph` : `winds around ${windSpeed} mph from the ${windDir}`)
  }
  if (parts.length === 0) return null
  const first = parts[0][0].toUpperCase() + parts[0].slice(1)
  if (parts.length === 1) return `${first}.`
  if (parts.length === 2) return `${first} with ${parts[1]}.`
  return `${first}, ${parts[1]}, and ${parts[2]}.`
}

let measureCtx: CanvasRenderingContext2D | null = null

// Painted top and bottom of a single line of text, which sit well inside its line box
export function glyphBounds(el: HTMLElement, text: string) {
  const rect = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const ctx = measureCtx ??= document.createElement('canvas').getContext('2d')
  if (!ctx) return { top: rect.top, bottom: rect.bottom }
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const m = ctx.measureText(text)
  const lineH = parseFloat(cs.lineHeight) || rect.height
  const baseline = rect.top + (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent
  return { top: baseline - m.actualBoundingBoxAscent, bottom: baseline + m.actualBoundingBoxDescent }
}
