import { useState, useEffect, useCallback, useRef } from 'react'
import type { Location, Unit, WeatherData } from '../types'
import { fetchWeather } from '../lib/api'
import { REFRESH_INTERVAL_MS } from '../constants'

interface UseWeatherResult {
  weather: WeatherData | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useWeather(location: Location, unit: Unit): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only the newest request may report back, so a slow response for the
  // previous location can't overwrite the one the user just picked
  const latest = useRef(0)

  const load = useCallback(async () => {
    const request = ++latest.current
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeather(location, unit === 'F' ? 'fahrenheit' : 'celsius')
      if (request === latest.current) setWeather(data)
    } catch (e) {
      if (request === latest.current) setError('Unable to load weather data. Check your connection and try again.')
      console.error(e)
    } finally {
      if (request === latest.current) setLoading(false)
    }
  }, [location, unit])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(t)
  }, [load])

  return { weather, loading, error, reload: load }
}
