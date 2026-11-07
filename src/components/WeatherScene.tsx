import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Application } from '@splinetool/runtime'
import type { Condition, TOD } from '../types'
import { moonIllumination, moonPhase } from '../lib/moon'
import { glyphBounds, isNightTod } from '../lib/utils'
import { RainDrops } from './RainDrops'

const Spline = lazy(() => import('@splinetool/react-spline'))

const SCENE_URL = 'https://prod.spline.design/UT9xI3COxa6CPtqv/scene.splinecode'

// Spline objects whose states are named after a TOD / Condition value
const TOD_OBJECTS = ['Sky Dome', 'SunRig', 'MoonRig', 'StarsTOD', 'Horizon Glow', 'SkyLight']
const COND_OBJECTS = ['Moon', 'Stars', 'Lightning']

// Clouds and the sky's grey tint stay in place; each material's opacity is bound
// to a scene variable (0–100), so they fade in and out instead of scaling from
// the origin. Conditions a layer doesn't list leave it at 0.
const SKY_LAYERS: { object: string; variable: string; alpha: Partial<Record<Condition, number>> }[] = [
  { object: 'CloudsDrift', variable: 'cloudsDriftAlpha', alpha: { clear: 100, partly: 100 } },
  { object: 'CloudsLight', variable: 'cloudsLightAlpha', alpha: { partly: 100, cloudy: 100 } },
  { object: 'CloudsGrey', variable: 'cloudsGreyAlpha', alpha: { cloudy: 100, snow: 100 } },
  { object: 'CloudsDark', variable: 'cloudsDarkAlpha', alpha: { rain: 100, storm: 100 } },
  { object: 'Sky Overcast', variable: 'overcastAlpha', alpha: { cloudy: 55, rain: 70, storm: 85, snow: 50 } },
]

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

type RGB = { r: number; g: number; b: number }
type CloudLight = { emissive: RGB }

// Overcast and sunny days share their clouds with snow and night, which stay
// grey, so they turn them white by raising the glow on each sprite's lighting
// layer. The drift clouds are left out: writing to them stops the sky rendering.
const WHITE_SPRITE = /^Cloud(Grey|Light) \d Vapor/
const WHITE_GLOW = 0.6
const cloudGlows = new WeakMap<Application, { light: CloudLight; base: RGB }[]>()

function whiteGlows(app: Application) {
  let glows = cloudGlows.get(app)
  if (!glows) {
    glows = []
    for (const obj of app.getAllObjects()) {
      if (!WHITE_SPRITE.test(obj.name)) continue
      const layers = (obj as unknown as { material: { layers: { type: string }[] } }).material.layers
      const light = layers.find(l => l.type === 'light') as unknown as CloudLight
      glows.push({ light, base: light.emissive })
    }
    cloudGlows.set(app, glows)
  }
  return glows
}

function setCloudsWhite(app: Application, white: number) {
  const mix = (from: number) => from + (WHITE_GLOW - from) * white
  // Replaced whole: the runtime blanks the layer if a single channel is written
  for (const { light, base } of whiteGlows(app)) {
    light.emissive = { r: mix(base.r), g: mix(base.g), b: mix(base.b) }
  }
}

type SceneLayer = { type: string; color: RGB; alpha: number; emissive: RGB }
const sceneLayers = (app: Application, name: string) =>
  (app.findObjectByName(name) as unknown as { material: { layers: SceneLayer[] } } | undefined)?.material.layers ?? []

// The corona's looping state swings its scale, which reads as a pulsing ring
// once the rays no longer cover it, so it only shows alongside the rays
const CORONA_ALPHA = 0.99

function setCorona(app: Application, shown: number) {
  const corona = app.findObjectByName('Sun Corona')
  const layer = sceneLayers(app, 'Sun Corona').find(l => l.type === 'color')
  if (layer) layer.alpha = CORONA_ALPHA * shown
  if (corona) corona.visible = shown > 0
}

// Each ray is a stack of copies fanned out around 'Sun Starburst' (degrees)
const RAY_FAN: Record<string, number> = {
  'Sun Starburst Wide L': 1.4,
  'Sun Starburst Wide R': -1.4,
  'Sun Starburst Wide L2': 2.8,
  'Sun Starburst Wide R2': -2.8,
}

const SUN_RIMS = [
  { r: 1, g: 0.71, b: 0.42 },
  { r: 1, g: 0.83, b: 0.55 },
  { r: 1, g: 0.9, b: 0.69 },
]

// Colour writes before the sun's first frame can leave its disc undrawn
function styleSunAfterFirstFrame(app: Application) {
  let id = requestAnimationFrame(() => { id = requestAnimationFrame(() => styleSun(app)) })
  return () => cancelAnimationFrame(id)
}

function styleSun(app: Application) {
  for (const [name, deg] of Object.entries(RAY_FAN)) {
    const ray = app.findObjectByName(name)
    if (ray) ray.rotation.z = (deg * Math.PI) / 180
  }
  const core = sceneLayers(app, 'Sun Core')
  core.filter(l => l.type === 'fresnel').forEach((l, i) => { l.color = SUN_RIMS[i] })
  for (const l of core) {
    if (l.type === 'color') l.color = { r: 1, g: 0.94, b: 0.76 }
    if (l.type === 'light') l.emissive = { r: 0.78, g: 0.63, b: 0.38 }
  }
  for (const l of sceneLayers(app, 'Sun Corona')) {
    if (l.type === 'color') l.color = { r: 1, g: 0.87, b: 0.66 }
  }
}

// Fades from wherever each layer currently is, so scrubbing mid-fade never jumps
function fadeSky(app: Application, cond: Condition, tod: TOD, duration: number, alphas: Map<string, number>, frame: { id: number }) {
  cancelAnimationFrame(frame.id)
  const layers = SKY_LAYERS.map(l => ({
    ...l,
    obj: app.findObjectByName(l.object),
    from: alphas.get(l.variable) ?? 0,
    to: l.alpha[cond] ?? 0,
  }))
  const whiteFrom = alphas.get('cloudsWhite') ?? 0
  const sunny = (cond === 'clear' || cond === 'partly') && !isNightTod(tod)
  const whiteTo = cond === 'cloudy' || sunny ? 1 : 0
  const coronaFrom = alphas.get('sunCorona') ?? 1
  const coronaTo = cond === 'clear' ? 1 : 0
  const start = performance.now()
  const step = (now: number) => {
    const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1
    const k = easeInOut(t)
    for (const l of layers) {
      const a = l.from + (l.to - l.from) * k
      alphas.set(l.variable, a)
      app.setVariable(l.variable, a)
      // Fully faded layers are hidden so they cost nothing to draw
      if (a > 0) l.obj?.show()
      else l.obj?.hide()
    }
    if (whiteFrom !== whiteTo) {
      const white = whiteFrom + (whiteTo - whiteFrom) * k
      alphas.set('cloudsWhite', white)
      setCloudsWhite(app, white)
    }
    const shown = coronaFrom + (coronaTo - coronaFrom) * k
    alphas.set('sunCorona', shown)
    setCorona(app, shown)
    if (t < 1) frame.id = requestAnimationFrame(step)
  }
  step(start)
}

function applyState(app: Application, cond: Condition, tod: TOD, duration: number) {
  for (const name of TOD_OBJECTS) app.findObjectByName(name)?.transition({ to: tod, duration })
  for (const name of COND_OBJECTS) app.findObjectByName(name)?.transition({ to: cond, duration })
  // The dawn and dusk skies still place the sun, so it's put away until it's really up
  const sunUp = tod !== 'dawn' && !isNightTod(tod)
  app.findObjectByName('Sun Flare')?.transition({ to: sunUp ? cond : 'storm', duration })
  // Cloud cover hides the sun's rays (Sun Flare) but never shrinks the sun itself
  app.findObjectByName('Sun')?.transition({ to: !sunUp ? 'storm' : cond === 'partly' || cond === 'cloudy' ? 'clear' : cond, duration })
  // The runtime can't see particle emitters, so snow sits in a group it can
  const snow = app.findObjectByName('SnowFx')
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

// The two ray layers turn at different speeds so they slowly drift across each
// other. This runs from code because the looping Spline states never advanced
// the rotation, and any such loop on these objects would overwrite it each frame.
const SPINNING_RAYS = [
  { name: 'Sun Rays', secondsPerTurn: 150 },
  { name: 'Sun Starburst B', secondsPerTurn: 230 },
]

function spinRays(app: Application) {
  const rays = SPINNING_RAYS.map(r => {
    const obj = app.findObjectByName(r.name)
    return { obj, from: obj?.rotation.z ?? 0, speed: (2 * Math.PI) / (r.secondsPerTurn * 1000) }
  })
  const start = performance.now()
  let id = 0
  const step = (now: number) => {
    for (const r of rays) if (r.obj) r.obj.rotation.z = r.from - r.speed * (now - start)
    id = requestAnimationFrame(step)
  }
  id = requestAnimationFrame(step)
  return () => cancelAnimationFrame(id)
}

// The camera's vertical FOV is fixed while the mobile hero is laid out in CSS,
// so no single scene position lands the sun or moon in the same slot on every
// phone. Instead, size and place each body (inside its rig) from the live
// layout: centred between the location picker and the top of the temperature.
const CAMERA_FOV = 45
const BODIES = [
  // rigY/rigZ: the rig's resting height and depth (sun at midday, moon at night);
  // diameter: the unscaled disc in world units; fill: share of the gap it spans;
  // disc: what must stay on screen at the ends of its arc
  { name: 'SunBody', rig: 'SunRig', rigY: 470, rigZ: -300, diameter: 96, disc: 96, baseScale: 1.9, fill: 0.4 },
  // The moon is sized by a fixed 104 reference disc, so resizing its glow leaves it unchanged
  { name: 'MoonBody', rig: 'MoonRig', rigY: 470, rigZ: -300, diameter: 104, disc: 66, baseScale: 2.4, fill: 0.7 },
]

// How far each body may travel either side of centre (world units), so it stays
// on screen at the ends of its arc; capped so on desktop it never slides behind
// the temperature
const MAX_REACH_PX = 120
const bodyReach = new WeakMap<Application, Record<string, number>>()

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
  const w = window.innerWidth
  const reach: Record<string, number> = {}
  for (const b of BODIES) {
    const body = app.findObjectByName(b.name)
    if (!body) continue
    const worldPerPx = (2 * Math.tan((CAMERA_FOV * Math.PI) / 360) * (cam.position.z - b.rigZ)) / h
    let y = 0
    let scale = b.baseScale
    // Desktop keeps the scene's authored height and size
    if (mobile) {
      y = cam.position.y + (h / 2 - (top + bottom) / 2) * worldPerPx - b.rigY
      scale = Math.max(b.baseScale, ((bottom - top) * b.fill * worldPerPx) / b.diameter)
    }
    body.position.y = y
    body.scale.x = body.scale.y = body.scale.z = scale
    const radiusPx = (b.disc * scale) / 2 / worldPerPx
    reach[b.name] = Math.max(0, Math.min(MAX_REACH_PX, w / 2 - radiusPx - 16)) * worldPerPx
  }
  bodyReach.set(app, reach)
}

// Slides the sun and moon across the sky with the time of day, centred halfway
// between rise and set. Written every frame because the rigs' own states move
// them sideways too (a small authored arc), which this cancels so the body sits
// exactly where its time puts it. Scrubbing glides rather than jumps.
function driftBodies(app: Application, arcs: { current: Record<string, number> }, glide: boolean) {
  const bodies = BODIES.map(b => ({
    name: b.name,
    body: app.findObjectByName(b.name),
    rig: app.findObjectByName(b.rig),
    at: arcs.current[b.name] ?? 0,
  }))
  let last = performance.now()
  let id = 0
  const step = (now: number) => {
    const k = glide ? Math.min(1, (now - last) / 350) : 1
    last = now
    const reach = bodyReach.get(app) ?? {}
    for (const b of bodies) {
      if (!b.body || !b.rig) continue
      b.at += ((arcs.current[b.name] ?? 0) - b.at) * k
      const scale = b.rig.scale.x
      // A rig scaled to nothing is hidden, and dividing by it would blow up
      if (Math.abs(scale) > 0.01) b.body.position.x = (b.at * (reach[b.name] ?? 0) - b.rig.position.x) / scale
    }
    id = requestAnimationFrame(step)
  }
  id = requestAnimationFrame(step)
  return () => cancelAnimationFrame(id)
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
export function WeatherScene({ tod, cond, lat, sunArc, moonArc }: {
  tod: TOD
  cond: Condition
  lat: number
  // -1 (rising, left) to 1 (setting, right); see skyArc
  sunArc: number
  moonArc: number
}) {
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

  const skyAlphas = useRef(new Map<string, number>())
  const skyFrame = useRef({ id: 0 })

  useEffect(() => {
    if (!app.current) return
    const duration = reducedMotion() ? 0 : 1200
    applyState(app.current, cond, tod, duration)
    fadeSky(app.current, cond, tod, duration, skyAlphas.current, skyFrame.current)
  }, [cond, tod, ready])

  useEffect(() => () => cancelAnimationFrame(skyFrame.current.id), [])

  useEffect(() => {
    if (app.current) applyMoonPhase(app.current, lat)
  }, [lat, ready])

  useEffect(() => {
    if (!app.current || reducedMotion()) return
    return spinRays(app.current)
  }, [ready])

  useEffect(() => {
    if (app.current) return styleSunAfterFirstFrame(app.current)
  }, [ready])

  const arcs = useRef<Record<string, number>>({})
  arcs.current = { SunBody: sunArc, MoonBody: moonArc }
  useEffect(() => {
    if (app.current) return driftBodies(app.current, arcs, !reducedMotion())
  }, [ready])

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
              fadeSky(a, cond, tod, 0, skyAlphas.current, skyFrame.current)
              placeBodies(a)
              setReady(true)
            }}
          />
        </Suspense>
      </SceneBoundary>
      <RainDrops active={ready && (cond === 'rain' || cond === 'storm')} heavy={cond === 'storm'} still={reducedMotion()} />
    </div>
  )
}
