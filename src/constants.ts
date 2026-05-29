import type { Condition, Location, Tab } from './types'

export const DEFAULT_LOCATION: Location = {
  name: 'New York',
  region: 'NY, US',
  country: 'United States',
  lat: 40.7128,
  lon: -74.006,
  timezone: 'America/New_York',
  displayName: 'New York, NY, US',
}

export const TABS: { key: Tab; label: string; num: string }[] = [
  { key: 'overview', label: 'Overview', num: '01' },
  { key: 'hourly',   label: 'Hourly',   num: '02' },
  { key: 'fiveday',  label: '7 Day',    num: '03' },
  { key: 'trends',   label: 'Trends',   num: '04' },
]

export const REFRESH_INTERVAL_MS = 10 * 60 * 1000

export const STORAGE_KEYS = {
  tab:      'solis:tab',
  unit:     'solis:unit',
  location: 'solis:location',
} as const

// WMO weather interpretation codes → app condition type
export const WMO_MAP: Record<number, Condition> = {
  0: 'clear',
  1: 'partly', 2: 'partly',
  3: 'cloudy',
  45: 'cloudy', 48: 'cloudy',
  51: 'rain', 53: 'rain', 55: 'rain', 56: 'rain', 57: 'rain',
  61: 'rain', 63: 'rain', 65: 'rain', 66: 'rain', 67: 'rain',
  71: 'snow', 73: 'snow', 75: 'snow', 77: 'snow',
  80: 'rain', 81: 'rain', 82: 'rain',
  85: 'snow', 86: 'snow',
  95: 'storm', 96: 'storm', 99: 'storm',
}

// Condition descriptions — seeded by day index to vary day-to-day
export const COND_DESCS: Record<Condition, string[]> = {
  clear:  ['Clear skies', 'Bright and clear all day', 'Sunny throughout'],
  partly: ['Partly cloudy', 'Mix of sun and clouds', 'Partly cloudy with a breeze'],
  cloudy: ['Overcast', 'Gray skies all day', 'Overcast with occasional breaks'],
  rain:   ['Rain showers', 'Showers likely through the day', 'Steady rain and cool temperatures'],
  storm:  ['Thunderstorms', 'Thunderstorms developing', 'Severe storms possible'],
  snow:   ['Snow showers', 'Snow tapering off', 'Light snow throughout the day'],
}
