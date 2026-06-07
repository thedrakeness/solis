import { useState, useEffect } from 'react'
import type { Tab, Unit, Location } from './types'
import { todFromHour, isNightTod } from './lib/utils'
import { skyTopColor } from './lib/sky'
import { Sky } from './components/Sky'
import { Overview } from './components/Overview'
import { Hourly } from './components/Hourly'
import { FiveDay } from './components/FiveDay'
import { Trends } from './components/Trends'
import { LocationSearch } from './components/LocationSearch'
import { MobileTabFab } from './components/MobileTabFab'
import { Icons } from './components/Icons'
import { useWeather } from './hooks/useWeather'
import { DEFAULT_LOCATION, TABS, STORAGE_KEYS } from './constants'

export default function App() {
  const [tab, setTab] = useState<Tab>(
    () => (localStorage.getItem(STORAGE_KEYS.tab) as Tab) || 'overview'
  )
  const [unit, setUnit] = useState<Unit>(
    () => (localStorage.getItem(STORAGE_KEYS.unit) as Unit) || 'F'
  )
  const [location, setLocation] = useState<Location>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.location)
      return saved ? (JSON.parse(saved) as Location) : DEFAULT_LOCATION
    } catch {
      return DEFAULT_LOCATION
    }
  })
  const [menuOpen, setMenuOpen] = useState(false)

  const { weather, loading, error, reload } = useWeather(location, unit)

  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hour = time.getHours()
  const tod = todFromHour(hour)
  const night = isNightTod(tod)
  const currentCond = weather?.current.condition ?? 'clear'
  const tabTitle = TABS.find(t => t.key === tab)?.label ?? ''
  const dayStr = time.toLocaleDateString([], { weekday: 'short' }).toUpperCase()
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.tab, tab) }, [tab])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.unit, unit) }, [unit])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(location))
  }, [location])

  function handleSetLocation(loc: Location) {
    setLocation(loc)
    setMenuOpen(false)
  }

  function handleTab(key: Tab) {
    setTab(key)
    setMenuOpen(false)
  }

  return (
    <>
      <Sky tod={tod} cond={currentCond} />

      {loading && (
        <div className="center-state">
          <div className="spinner" />
          <div className="state-txt">Loading weather</div>
        </div>
      )}

      {!loading && error && (
        <div className="center-state">
          <div className="state-txt">{error}</div>
          <button className="retry-btn" onClick={reload}>Retry</button>
        </div>
      )}

      {!loading && !error && weather && (
        <div className={`app${night ? ' is-night' : ''}`}>
          {/* Mobile top bar */}
          <div className="mobile-bar" style={{ background: skyTopColor(tod, currentCond) }}>
            <div className="mobile-brand">SOLIS</div>
            <div className="mobile-loc-wrap">
              <LocationSearch currentLocation={location} onSelect={handleSetLocation} variant="overview" />
            </div>
            <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <Icons.Menu size={20} />
            </button>
          </div>

          {/* Desktop sidebar */}
          <aside className="sidebar">
            <div className="brand">SOLIS</div>
            {TABS.map(t => (
              <button
                key={t.key}
                className={`navbtn${tab === t.key ? ' active' : ''}`}
                onClick={() => handleTab(t.key)}
              >
                {t.label}
              </button>
            ))}
            <div className="sidebar-foot">
              <div>CURRENT LOCATION</div>
              <div className="coord">{location.name}</div>
              <div>{location.lat.toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'}</div>
              <div>{Math.abs(location.lon).toFixed(2)}°{location.lon >= 0 ? 'E' : 'W'}</div>
            </div>
          </aside>

          {/* Mobile slide-out menu */}
          <div className={`menu-overlay${menuOpen ? ' open' : ''}`}>
            <div className="menu-head">
              <div className="brand">SOLIS</div>
              <button className="menu-close" onClick={() => setMenuOpen(false)}>×</button>
            </div>
            <div className="menu-nav">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`navbtn${tab === t.key ? ' active' : ''}`}
                  onClick={() => handleTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="sidebar-foot mt-auto">
              <div>CURRENT LOCATION</div>
              <div className="coord">{location.name}</div>
            </div>
          </div>

          <MobileTabFab tab={tab} onTab={handleTab} />

          {/* Main content */}
          <main className="main">
            <div className="topbar">
              <div className="flex items-center gap-4 relative">
                <h1><span className="crumb">{tabTitle}</span></h1>
                <LocationSearch currentLocation={location} onSelect={handleSetLocation} variant="topbar" />
              </div>
              <div className="topbar-right">
                <div className="topbar-clock">
                  <span className="ov-meta-date">{dayStr}</span>
                  <span className="ov-meta-time">{timeStr}</span>
                </div>
                <div className="unit-toggle">
                  <button className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>°F</button>
                  <button className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>°C</button>
                </div>
              </div>
            </div>

            {tab === 'overview' && (
              <div key="ov" className="page-enter">
                <Overview
                  data={weather}
                  unit={unit}
                  onGoTab={handleTab}
                  location={location}
                  onSelectLocation={handleSetLocation}
                />
              </div>
            )}
            {tab === 'hourly' && (
              <div key="hr" className="page-enter">
                <Hourly data={weather} unit={unit} />
              </div>
            )}
            {tab === 'fiveday' && (
              <div key="fd" className="page-enter">
                <FiveDay data={weather} unit={unit} />
              </div>
            )}
            {tab === 'trends' && (
              <div key="tr" className="page-enter">
                <Trends data={weather} unit={unit} />
              </div>
            )}
          </main>
        </div>
      )}
    </>
  )
}
