import type { Condition, WeatherData, Location, MonthSummary } from '../types'
import { getWindDir, aqiLabel, dayName, dateStr, monthName } from './utils'
import { WMO_MAP, COND_DESCS } from '../constants'

const FORECAST_BASE  = import.meta.env.VITE_FORECAST_URL  ?? 'https://api.open-meteo.com/v1'
const GEOCODING_BASE = import.meta.env.VITE_GEOCODING_URL ?? 'https://geocoding-api.open-meteo.com/v1'
const AQI_BASE       = import.meta.env.VITE_AQI_URL       ?? 'https://air-quality-api.open-meteo.com/v1'
const ARCHIVE_BASE   = import.meta.env.VITE_ARCHIVE_URL   ?? 'https://archive-api.open-meteo.com/v1'

function wmo(code: number): Condition {
  return WMO_MAP[code] ?? 'clear'
}

function condDesc(c: Condition, seed: number): string {
  const arr = COND_DESCS[c]
  return arr[seed % arr.length]
}

export async function searchLocations(query: string): Promise<Location[]> {
  if (!query.trim()) return []
  const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  if (!data.results) return []
  return data.results.map((r: {
    name: string
    admin1?: string
    country?: string
    country_code?: string
    latitude: number
    longitude: number
    timezone: string
  }) => {
    const region = r.admin1 ? `${r.admin1}, ${r.country_code ?? r.country ?? ''}` : (r.country ?? '')
    return {
      name: r.name,
      region,
      country: r.country ?? '',
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone,
      displayName: region ? `${r.name}, ${region}` : r.name,
    }
  })
}

export async function fetchWeather(loc: Location, unitTemp: 'fahrenheit' | 'celsius'): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
    hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    temperature_unit: unitTemp,
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: loc.timezone || 'auto',
    forecast_days: '7',
  })

  const [forecastRes, aqiRes] = await Promise.allSettled([
    fetch(`${FORECAST_BASE}/forecast?${params}`),
    fetch(`${AQI_BASE}/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=us_aqi&domains=cams_global`),
  ])

  if (forecastRes.status !== 'fulfilled' || !forecastRes.value.ok) {
    throw new Error('Failed to fetch weather data')
  }

  const forecast = await forecastRes.value.json()
  let rawAqi: number | null = null
  if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
    const aqiData = await aqiRes.value.json()
    rawAqi = aqiData?.current?.us_aqi ?? null
  }

  const cur = forecast.current
  const hourly = forecast.hourly
  const daily = forecast.daily

  const nowIso: string = cur.time
  const nowIdx = (hourly.time as string[]).findIndex((t: string) => t >= nowIso)
  const startIdx = nowIdx >= 0 ? nowIdx : 0

  const hours = Array.from({ length: 48 }, (_, i) => {
    const idx = startIdx + i
    if (idx >= hourly.time.length) return null
    const isoTime: string = hourly.time[idx]
    return {
      hour: new Date(isoTime).getHours(),
      isoTime,
      temp: Math.round(hourly.temperature_2m[idx]),
      condition: wmo(hourly.weather_code[idx]),
      precipProb: (hourly.precipitation_probability[idx] as number) ?? 0,
      windSpeed: Math.round(hourly.wind_speed_10m[idx]),
    }
  }).filter(Boolean) as WeatherData['hours']

  const days = (daily.time as string[]).map((t: string, i: number) => {
    const dt = new Date(t + 'T00:00:00')
    const c = wmo(daily.weather_code[i])
    return {
      dayName: dayName(dt, i === 0),
      dateStr: dateStr(dt),
      isToday: i === 0,
      condition: c,
      description: condDesc(c, i),
      hi: Math.round(daily.temperature_2m_max[i]),
      lo: Math.round(daily.temperature_2m_min[i]),
      precipProb: (daily.precipitation_probability_max[i] as number) ?? 0,
    }
  })

  const precipProb = hours[1]?.precipProb ?? hours[0]?.precipProb ?? 0

  const current = {
    temp: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    condition: wmo(cur.weather_code),
    windSpeed: Math.round(cur.wind_speed_10m),
    windDir: getWindDir(cur.wind_direction_10m),
    windDeg: cur.wind_direction_10m,
    humidity: cur.relative_humidity_2m,
    precipProb,
    aqi: rawAqi,
    aqiLabel: rawAqi != null ? aqiLabel(rawAqi) : 'N/A',
  }

  const { weeklyHighs, weeklyPrecip, monthlySummary } = await fetchTrends(loc, unitTemp)
  return { current, hours, days, weeklyHighs, weeklyPrecip, monthlySummary }
}

async function fetchTrends(loc: Location, unitTemp: 'fahrenheit' | 'celsius'): Promise<{
  weeklyHighs: WeatherData['weeklyHighs']
  weeklyPrecip: WeatherData['weeklyPrecip']
  monthlySummary: MonthSummary[]
}> {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 84)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  try {
    const url =
      `${ARCHIVE_BASE}/archive?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&start_date=${fmt(startDate)}&end_date=${fmt(endDate)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&temperature_unit=${unitTemp}&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`

    const res = await fetch(url)
    if (!res.ok) throw new Error('historical fetch failed')
    const data = await res.json()

    const times: string[] = data.daily.time
    const maxTemps: number[] = data.daily.temperature_2m_max
    const minTemps: number[] = data.daily.temperature_2m_min
    const precips: number[] = data.daily.precipitation_sum

    const numDays = times.length
    const weeks: { maxTemps: number[]; precip: number[] }[] = []
    for (let i = numDays - 1; i >= 0; i -= 7) {
      const slice = { maxTemps: [] as number[], precip: [] as number[] }
      for (let j = 0; j < 7 && i - j >= 0; j++) {
        const idx = i - j
        if (maxTemps[idx] != null) slice.maxTemps.push(maxTemps[idx])
        if (precips[idx] != null) slice.precip.push(precips[idx])
      }
      weeks.unshift(slice)
    }

    const last12Weeks = weeks.slice(-12)
    const last8Weeks = last12Weeks.slice(-8)

    const weeklyHighs = last8Weeks.map((w, i) => ({
      label: i === last8Weeks.length - 1 ? 'THIS WK' : `WK ${i - last8Weeks.length + 1}`,
      value: w.maxTemps.length ? Math.round(w.maxTemps.reduce((a, b) => a + b, 0) / w.maxTemps.length) : 0,
      isCurrent: i === last8Weeks.length - 1,
    }))

    const weeklyPrecip = last12Weeks.map((w, i) => ({
      label: i === last12Weeks.length - 1 ? 'THIS WK' : `WK ${i - last12Weeks.length + 1}`,
      value: parseFloat(w.precip.reduce((a, b) => a + b, 0).toFixed(2)),
      isCurrent: i === last12Weeks.length - 1,
    }))

    const monthMap = new Map<string, { maxTemps: number[]; minTemps: number[]; precip: number[] }>()
    times.forEach((t, i) => {
      const d = new Date(t + 'T00:00:00')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!monthMap.has(key)) monthMap.set(key, { maxTemps: [], minTemps: [], precip: [] })
      const m = monthMap.get(key)!
      if (maxTemps[i] != null) m.maxTemps.push(maxTemps[i])
      if (minTemps[i] != null) m.minTemps.push(minTemps[i])
      if (precips[i] != null) m.precip.push(precips[i])
    })

    const monthEntries = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)

    const maxRain = Math.max(...monthEntries.map(([, m]) => m.precip.reduce((a, b) => a + b, 0)))

    const monthlySummary: MonthSummary[] = monthEntries.map(([key, m]) => {
      const [yr, mo] = key.split('-').map(Number)
      const rain = parseFloat(m.precip.reduce((a, b) => a + b, 0).toFixed(1))
      return {
        month: monthName(new Date(yr, mo, 1)),
        hi: m.maxTemps.length ? Math.round(m.maxTemps.reduce((a, b) => a + b, 0) / m.maxTemps.length) : 0,
        lo: m.minTemps.length ? Math.round(m.minTemps.reduce((a, b) => a + b, 0) / m.minTemps.length) : 0,
        rain,
        rainRel: maxRain > 0 ? rain / maxRain : 0,
      }
    })

    return { weeklyHighs, weeklyPrecip, monthlySummary }
  } catch {
    return {
      weeklyHighs: Array.from({ length: 8 }, (_, i) => ({
        label: i === 7 ? 'THIS WK' : `WK ${i - 7}`,
        value: 0,
        isCurrent: i === 7,
      })),
      weeklyPrecip: Array.from({ length: 12 }, (_, i) => ({
        label: i === 11 ? 'THIS WK' : `WK ${i - 11}`,
        value: 0,
        isCurrent: i === 11,
      })),
      monthlySummary: [],
    }
  }
}
