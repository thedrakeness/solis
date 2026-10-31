import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Application } from '@splinetool/runtime'
import type { Condition, TOD } from '../types'
import { moonIllumination, moonPhase } from '../lib/moon'
import { glyphBounds } from '../lib/utils'

const Spline = lazy(() => import('@splinetool/react-spline'))

const SCENE_URL = 'https://prod.spline.design/UT9xI3COxa6CPtqv/scene.splinecode'

// Spline objects whose states are named after a TOD / Condition value
const TOD_OBJECTS = ['Sky Dome', 'SunRig', 'MoonRig', 'StarsTOD', 'Horizon Glow', 'SkyLight']
const COND_OBJECTS = ['Sky Overcast', 'Sun Flare', 'Moon', 'Stars', 'Lightning']

// Cloud groups stay in place; each material's opacity is bound to a scene
// variable (0–100), so clouds fade in and out instead of scaling from the origin
const CLOUD_LAYERS: { group: string; variable: string; shown: Condition[] }[] = [
  { group: 'CloudsDrift', variable: 'cloudsDriftAlpha', shown: ['clear', 'partly'] },
  { group: 'CloudsLight', variable: 'cloudsLightAlpha', shown: ['partly', 'cloudy'] },
  { group: 'CloudsGrey', variable: 'cloudsGreyAlpha', shown: ['cloudy', 'snow'] },
  { group: 'CloudsDark', variable: 'cloudsDarkAlpha', shown: ['rain', 'storm'] },
]

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// Fades from wherever each layer currently is, so scrubbing mid-fade never jumps
function fadeClouds(app: Application, cond: Condition, duration: number, alphas: Map<string, number>, frame: { id: number }) {
  cancelAnimationFrame(frame.id)
  const layers = CLOUD_LAYERS.map(l => ({
    ...l,
    obj: app.findObjectByName(l.group),
    from: alphas.get(l.variable) ?? 0,
    to: l.shown.includes(cond) ? 100 : 0,
  }))
  const start = performance.now()
  const step = (now: number) => {
    const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1
    const k = easeInOut(t)
    for (const l of layers) {
      const a = l.from + (l.to - l.from) * k
      alphas.set(l.variable, a)
      app.setVariable(l.variable, a)
      // Fully faded clouds are hidden so they cost nothing to draw
      if (a > 0) l.obj?.show()
      else l.obj?.hide()
    }
    if (t < 1) frame.id = requestAnimationFrame(step)
  }
  step(start)
}

function applyState(app: Application, cond: Condition, tod: TOD, duration: number) {
  for (const name of TOD_OBJECTS) app.findObjectByName(name)?.transition({ to: tod, duration })
  for (const name of COND_OBJECTS) app.findObjectByName(name)?.transition({ to: cond, duration })
  // Cloud cover hides the sun's rays (Sun Flare) but never shrinks the sun itself
  app.findObjectByName('Sun')?.transition({ to: cond === 'partly' || cond === 'cloudy' ? 'clear' : cond, duration })
  const rain = app.findObjectByName('Rain')
  if (rain) rain.visible = cond === 'rain' || cond === 'storm'
  const snow = app.findObjectByName('Snow')
  if (snow) snow.visible = cond === 'snow'
}

// The lit moon is a Boolean: 'Moon Core' minus 'Moon Shadow' (a disc over the dark
// side) and 'Moon Cutter' (an ellipse that hollows out a crescent). 'Moon Dark', a
// dim full sphere just behind it, shows through as the shadowed part. Both cutters
// carry states named phase-<shadow side l|r>-<percent lit>. Booleans only
// recompute on state changes, not when a position is set from code.
const PHASE_STEPS = [6, 15, 25, 35, 50, 65, 75, 85, 95, 100]
const MOON_TILT_DEG = 30

function applyMoonPhase(app: Application, lat: number) {
  const phase = moonPhase()
  const lit = moonIllumination(phase) * 100
  const step = PHASE_STEPS.reduce((a, b) => (Math.abs(b - lit) < Math.abs(a - lit) ? b : a))
  // Waxing moons are lit on the right in the northern hemisphere, so the shadow
  // sits on the left; it flips when waning and south of the equator
  const side = (phase < 0.5) === (lat >= 0) ? 'l' : 'r'
  const state = `phase-${side}-${step}`
  for (const name of ['Moon Shadow', 'Moon Cutter']) app.findObjectByName(name)?.transition({ to: state, duration: 0 })
  // Tilt the disc so the dark side sits low: bottom-right when waning, bottom-left when waxing
  const body = app.findObjectByName('MoonBody')
  if (body) body.rotation.z = ((side === 'r' ? -1 : 1) * MOON_TILT_DEG * Math.PI) / 180
}

// The camera's vertical FOV is fixed while the mobile hero is laid out in CSS,
// so no single scene position lands the sun or moon in the same slot on every
// phone. Instead, size and place each body (inside its rig) from the live
// layout: centred between the location picker and the top of the temperature.
const CAMERA_FOV = 45
const BODIES = [
  // rigY/rigZ: the rig's resting height and depth (sun at midday, moon at night);
  // diameter: the unscaled disc in world units; fill: share of the gap it spans
  { name: 'SunBody', rigY: 470, rigZ: -300, diameter: 96, baseScale: 1.9, fill: 0.4 },
  // The moon is sized by a fixed 104 reference disc, so resizing its glow leaves it unchanged
  { name: 'MoonBody', rigY: 470, rigZ: -300, diameter: 104, baseScale: 2.4, fill: 0.7 },
]

function placeBodies(app: Application) {
  const cam = app.findObjectByName('App Camera')
  if (!cam) return
  const loc = document.querySelector<HTMLElement>('.mob-snap-hero .mob-loc-inline')
  const temp = document.querySelector<HTMLElement>('.mob-overview .ov-temp')
  const mobile = !!loc?.offsetHeight && !!temp?.offsetHeight
  // Measure as if the snap scroller were at the top: the canvas is fixed, the hero scrolls
  const scrollY = document.querySelector('.main--snap')?.scrollTop ?? 0
  const top = mobile ? loc.getBoundingClientRect().bottom + scrollY : 0
  const bottom = mobile ? glyphBounds(temp, temp.firstChild?.textContent ?? '').top + scrollY : 0
  const h = window.innerHeight
  for (const b of BODIES) {
    const body = app.findObjectByName(b.name)
    if (!body) continue
    let y = 0
    let scale = b.baseScale
    // Desktop keeps the scene's authored placement
    if (mobile) {
      const worldPerPx = (2 * Math.tan((CAMERA_FOV * Math.PI) / 360) * (cam.position.z - b.rigZ)) / h
      y = cam.position.y + (h / 2 - (top + bottom) / 2) * worldPerPx - b.rigY
      scale = Math.max(b.baseScale, ((bottom - top) * b.fill * worldPerPx) / b.diameter)
    }
    body.position.y = y
    body.scale.x = body.scale.y = body.scale.z = scale
  }
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

  const cloudAlphas = useRef(new Map<string, number>())
  const cloudFrame = useRef({ id: 0 })

  useEffect(() => {
    if (!app.current) return
    const duration = reducedMotion() ? 0 : 1200
    applyState(app.current, cond, tod, duration)
    fadeClouds(app.current, cond, duration, cloudAlphas.current, cloudFrame.current)
  }, [cond, tod, ready])

  useEffect(() => () => cancelAnimationFrame(cloudFrame.current.id), [])

  useEffect(() => {
    if (app.current) applyMoonPhase(app.current, lat)
  }, [lat, ready])

  // Re-fit the sun and moon whenever the hero's layout can shift
  useEffect(() => {
    if (!ready) return
    const fit = () => { if (app.current) placeBodies(app.current) }
    const ro = new ResizeObserver(fit)
    // The hero mounts once the forecast loads and unmounts on other tabs
    let hero: Element | null = null
    const watch = () => {
      const el = document.querySelector('.mob-snap-hero')
      if (el === hero) return
      if (hero) ro.unobserve(hero)
      hero = el
      if (hero) ro.observe(hero)
      else fit()
    }
    const mo = new MutationObserver(watch)
    mo.observe(document.body, { childList: true, subtree: true })
    watch()
    fit()
    document.fonts.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => { mo.disconnect(); ro.disconnect(); window.removeEventListener('resize', fit) }
  }, [ready])

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
              fadeClouds(a, cond, 0, cloudAlphas.current, cloudFrame.current)
              placeBodies(a)
              setReady(true)
            }}
          />
        </Suspense>
      </SceneBoundary>
    </div>
  )
}
