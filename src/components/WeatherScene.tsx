import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Application } from '@splinetool/runtime'
import type { Condition, TOD } from '../types'
import { moonIllumination, moonPhase } from '../lib/moon'

const Spline = lazy(() => import('@splinetool/react-spline'))

const SCENE_URL = 'https://prod.spline.design/UT9xI3COxa6CPtqv/scene.splinecode'

// Spline objects whose states are named after a TOD / Condition value
const TOD_OBJECTS = ['Sky Dome', 'SunRig', 'MoonRig', 'StarsTOD', 'Horizon Glow', 'SkyLight']
const COND_OBJECTS = ['Sky Overcast', 'Sun', 'Moon', 'Stars', 'CloudsDrift', 'CloudsLight', 'CloudsGrey', 'CloudsDark', 'Lightning']

function applyState(app: Application, cond: Condition, tod: TOD, duration: number) {
  for (const name of TOD_OBJECTS) app.findObjectByName(name)?.transition({ to: tod, duration })
  for (const name of COND_OBJECTS) app.findObjectByName(name)?.transition({ to: cond, duration })
  const rain = app.findObjectByName('Rain')
  if (rain) rain.visible = cond === 'rain' || cond === 'storm'
  const snow = app.findObjectByName('Snow')
  if (snow) snow.visible = cond === 'snow'
}

// The moon is a Boolean: 'Moon Core' minus 'Moon Shadow' (a huge disc hiding the
// dark side) and 'Moon Cutter' (an ellipse that hollows out a crescent). Both
// carry states named phase-<shadow side l|r>-<percent lit>. Booleans only
// recompute on state changes, not when a position is set from code.
const PHASE_STEPS = [6, 15, 25, 35, 50, 65, 75, 85, 95, 100]

function applyMoonPhase(app: Application, lat: number) {
  const phase = moonPhase()
  const lit = moonIllumination(phase) * 100
  const step = PHASE_STEPS.reduce((a, b) => (Math.abs(b - lit) < Math.abs(a - lit) ? b : a))
  // Waxing moons are lit on the right in the northern hemisphere, so the shadow
  // sits on the left; it flips when waning and south of the equator
  const side = (phase < 0.5) === (lat >= 0) ? 'l' : 'r'
  const state = `phase-${side}-${step}`
  for (const name of ['Moon Shadow', 'Moon Cutter']) app.findObjectByName(name)?.transition({ to: state, duration: 0 })
}

// A failed scene load must not take the app down; the CSS sky stays visible
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The scene's glow and overcast layers only render correctly on WebGPU;
// the WebGL fallback draws them as opaque grey, so keep the CSS sky there
async function hasWebGPU() {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
  if (!gpu) return false
  try { return !!(await gpu.requestAdapter()) } catch { return false }
}

// 3D sky layered over the CSS <Sky>, which stays as the fallback while loading
export function WeatherScene({ tod, cond, lat }: { tod: TOD; cond: Condition; lat: number }) {
  const app = useRef<Application | null>(null)
  const [ready, setReady] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    let live = true
    hasWebGPU().then(ok => { if (live) setSupported(ok) })
    return () => { live = false }
  }, [])

  // Lets the layout hide the hero icon the scene now stands in for
  useEffect(() => {
    document.documentElement.classList.toggle('scene-ready', ready)
    return () => document.documentElement.classList.remove('scene-ready')
  }, [ready])

  useEffect(() => {
    if (app.current) applyState(app.current, cond, tod, reducedMotion() ? 0 : 1200)
  }, [cond, tod, ready])

  useEffect(() => {
    if (app.current) applyMoonPhase(app.current, lat)
  }, [lat, ready])

  // Lightning flickers: bolt hidden, with brief flashes at random intervals
  useEffect(() => {
    const bolt = app.current?.findObjectByName('Bolt')
    if (!bolt || cond !== 'storm' || reducedMotion()) return
    bolt.visible = false
    let timer: number
    const flash = () => {
      bolt.visible = true
      setTimeout(() => { bolt.visible = false }, 90 + Math.random() * 80)
      timer = window.setTimeout(flash, 2500 + Math.random() * 4500)
    }
    timer = window.setTimeout(flash, 1200)
    return () => { clearTimeout(timer); bolt.visible = true }
  }, [cond, ready])

  if (!supported) return null

  return (
    <div className={`weather-scene${ready ? ' ready' : ''}`} aria-hidden="true">
      <SceneBoundary>
        <Suspense fallback={null}>
          <Spline
            scene={SCENE_URL}
            onLoad={(a) => {
              app.current = a
              applyState(a, cond, tod, 0)
              setReady(true)
            }}
          />
        </Suspense>
      </SceneBoundary>
    </div>
  )
}
