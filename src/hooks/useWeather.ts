import { useState, useEffect, useCallback } from 'react'
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

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeather(location, 'fahrenheit')
      setWeather(data)
    } catch (e) {
      setError('Unable to load weather data. Check your connection and try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [location, unit])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(t)
  }, [load])

  return { weather, loading, error, reload: load }
}
