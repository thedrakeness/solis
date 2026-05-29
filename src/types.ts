export type Condition = 'clear' | 'partly' | 'cloudy' | 'rain' | 'storm' | 'snow'
export type TOD = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'dusk' | 'night'
export type Unit = 'F' | 'C'
export type Tab = 'overview' | 'hourly' | 'fiveday' | 'trends'

export interface Location {
  name: string
  region: string
  country: string
  lat: number
  lon: number
  timezone: string
  displayName: string
}

export interface HourData {
  hour: number
  isoTime: string
  temp: number
  condition: Condition
  precipProb: number
  windSpeed: number
}

export interface DayData {
  dayName: string
  dateStr: string
  isToday: boolean
  condition: Condition
  description: string
  hi: number
  lo: number
  precipProb: number
}

export interface CurrentData {
  temp: number
  feelsLike: number
  condition: Condition
  windSpeed: number
  windDir: string
  windDeg: number
  humidity: number
  precipProb: number
  aqi: number | null
  aqiLabel: string
}

export interface MonthSummary {
  month: string
  hi: number
  lo: number
  rain: number
  rainRel: number
}

export interface WeatherData {
  current: CurrentData
  hours: HourData[]
  days: DayData[]
  weeklyHighs: { label: string; value: number; isCurrent: boolean }[]
  weeklyPrecip: { label: string; value: number; isCurrent: boolean }[]
  monthlySummary: MonthSummary[]
}
