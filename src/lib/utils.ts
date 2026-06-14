import type { Condition, TOD, Unit } from '../types'

export function todFromHour(hour: number): TOD {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 10) return 'morning'
  if (hour >= 10 && hour < 14) return 'midday'
  if (hour >= 14 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'evening'
  if (hour >= 20 && hour < 21) return 'dusk'
  return 'night'
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
