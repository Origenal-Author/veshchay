'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type WeatherType = 'night' | 'clear' | 'rain' | 'snow' | 'storm' | 'fog'

const WeatherContext = createContext<{
  weather: WeatherType
  setWeather: (w: WeatherType) => void
}>({ weather: 'night', setWeather: () => {} })

export function useWeather() {
  return useContext(WeatherContext)
}

function getDefaultWeather(): WeatherType {
  const h = new Date().getHours()
  if (h >= 6 && h < 17) return 'clear'
  if (h >= 17 && h < 21) return 'rain'
  return 'night'
}

function mapWeatherCode(code: number, isDay: number): WeatherType {
  if (!isDay) return 'night'
  if (code <= 2) return 'clear'
  if (code === 3 || code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code >= 85 && code <= 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'clear'
}

async function fetchRealWeather(): Promise<WeatherType> {
  let lat: number, lon: number
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
    )
    lat = pos.coords.latitude
    lon = pos.coords.longitude
  } catch {
    const ip = await fetch('https://ipapi.co/json/').then(r => r.json())
    lat = ip.latitude
    lon = ip.longitude
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weathercode,is_day&timezone=auto`
  const data = await fetch(url).then(r => r.json())
  return mapWeatherCode(data.current.weathercode, data.current.is_day)
}

function generateStars() {
  const layer = document.getElementById('layer-night')
  if (!layer) return
  layer.querySelectorAll('.star').forEach(el => el.remove())
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('div')
    star.className = 'star'
    const size = Math.random() * 2.5 + 0.5
    star.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*85}%;width:${size}px;height:${size}px;animation-delay:${Math.random()*4}s;animation-duration:${Math.random()*3+2}s;opacity:${Math.random()*0.7+0.1};`
    layer.appendChild(star)
  }
}

function generateRain() {
  const layer = document.getElementById('layer-rain')
  if (!layer) return
  layer.querySelectorAll('.rain-drop').forEach(el => el.remove())
  for (let i = 0; i < 100; i++) {
    const drop = document.createElement('div')
    drop.className = 'rain-drop'
    const h = Math.random() * 20 + 12
    drop.style.cssText = `left:${Math.random()*105}%;height:${h}px;animation-delay:${Math.random()*2}s;animation-duration:${Math.random()*0.5+0.4}s;opacity:${Math.random()*0.5+0.2};`
    layer.appendChild(drop)
  }
}

function generateSnow() {
  const layer = document.getElementById('layer-snow')
  if (!layer) return
  layer.querySelectorAll('.snow-flake').forEach(el => el.remove())
  for (let i = 0; i < 80; i++) {
    const flake = document.createElement('div')
    flake.className = 'snow-flake'
    const size = Math.random() * 4 + 2
    const drift = (Math.random() - 0.5) * 120
    flake.style.cssText = `left:${Math.random()*100}%;width:${size}px;height:${size}px;--drift:${drift}px;animation-delay:${Math.random()*8}s;animation-duration:${Math.random()*5+6}s;opacity:${Math.random()*0.6+0.3};`
    layer.appendChild(flake)
  }
}

function generateStorm() {
  const layer = document.getElementById('layer-storm')
  if (!layer) return
  layer.querySelectorAll('.storm-drop,.wind-streak').forEach(el => el.remove())
  for (let i = 0; i < 200; i++) {
    const drop = document.createElement('div')
    drop.className = 'storm-drop'
    const h = Math.random() * 32 + 10
    drop.style.cssText = `left:${Math.random()*130-20}%;height:${h}px;width:${Math.random()<0.25?'2px':'1px'};animation-delay:${Math.random()*1.2}s;animation-duration:${Math.random()*0.15+0.16}s;opacity:${Math.random()*0.5+0.3};`
    layer.appendChild(drop)
  }
  for (let i = 0; i < 15; i++) {
    const streak = document.createElement('div')
    streak.className = 'wind-streak'
    streak.style.cssText = `top:${Math.random()*100}%;width:${Math.random()*220+80}px;animation-delay:${Math.random()*3}s;animation-duration:${Math.random()*1.2+0.7}s;opacity:${Math.random()*0.6+0.2};`
    layer.appendChild(streak)
  }
}

let boltTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleBolt(active: { value: boolean }) {
  if (!active.value) return
  const container = document.getElementById('bolt-container')
  const flashEl = document.getElementById('storm-flash')
  if (!container || !flashEl) return

  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  const cx0 = Math.random() * 92 + 4
  const boltW = Math.random() * 120 + 80
  const boltH = Math.random() * 40 + 25
  const segments = Math.floor(Math.random() * 5) + 5
  let cx = boltW / 2, cy = 0
  let d = `M ${cx.toFixed(1)} 0`
  for (let i = 1; i <= segments; i++) {
    cx = Math.max(4, Math.min(boltW - 4, cx + (Math.random() - 0.5) * 38))
    cy = (i / segments) * 100
    d += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`
  }
  const glow = document.createElementNS(ns, 'path')
  glow.setAttribute('d', d); glow.setAttribute('stroke', 'rgba(200,100,255,0.35)'); glow.setAttribute('stroke-width', '8'); glow.setAttribute('fill', 'none'); glow.setAttribute('stroke-linecap', 'round')
  const bolt = document.createElementNS(ns, 'path')
  bolt.setAttribute('d', d); bolt.setAttribute('stroke', '#E0A0FF'); bolt.setAttribute('stroke-width', '2'); bolt.setAttribute('fill', 'none'); bolt.setAttribute('stroke-linecap', 'round')
  const core = document.createElementNS(ns, 'path')
  core.setAttribute('d', d); core.setAttribute('stroke', '#FFFFFF'); core.setAttribute('stroke-width', '0.8'); core.setAttribute('fill', 'none'); core.setAttribute('stroke-linecap', 'round')
  svg.appendChild(glow); svg.appendChild(bolt); svg.appendChild(core)
  svg.setAttribute('viewBox', `0 0 ${boltW} 100`); svg.setAttribute('preserveAspectRatio', 'none')
  svg.setAttribute('class', 'bolt-svg')
  svg.style.cssText = `left:${cx0}%;transform:translateX(-50%);top:0;width:${boltW}px;height:${boltH}vh;filter:drop-shadow(0 0 5px #BF40FF) drop-shadow(0 0 18px rgba(155,16,255,0.7));z-index:6;position:absolute;`
  container.appendChild(svg)

  const seq: [number, () => void][] = [
    [0, () => { svg.style.opacity = '1'; flashEl.style.background = 'rgba(155,16,255,0.13)' }],
    [55, () => { svg.style.opacity = '0.15'; flashEl.style.background = 'rgba(155,16,255,0)' }],
    [90, () => { svg.style.opacity = '0.85'; flashEl.style.background = 'rgba(155,16,255,0.07)' }],
    [160, () => { svg.style.opacity = '0.05'; flashEl.style.background = 'rgba(155,16,255,0)' }],
    [260, () => { svg.style.opacity = '0'; svg.remove() }],
  ]
  seq.forEach(([delay, fn]) => setTimeout(fn, delay))
  boltTimeout = setTimeout(() => scheduleBolt(active), Math.random() * 30000 + 25000)
}

function generateFog() {
  const fogLayer = document.querySelector('#layer-fog .fog-layer') as HTMLElement
  if (!fogLayer) return
  fogLayer.innerHTML = ''
  const positions = [
    { x: '10%', y: '20%', w: '60%', h: '40%', fx: '8%', fy: '4%', fs: '1.15' },
    { x: '50%', y: '40%', w: '70%', h: '50%', fx: '-6%', fy: '3%', fs: '1.08' },
    { x: '20%', y: '60%', w: '55%', h: '35%', fx: '10%', fy: '-4%', fs: '1.12' },
    { x: '70%', y: '10%', w: '50%', h: '45%', fx: '-8%', fy: '5%', fs: '1.20' },
    { x: '0%', y: '70%', w: '65%', h: '40%', fx: '6%', fy: '-3%', fs: '1.10' },
  ]
  positions.forEach((p, i) => {
    const blob = document.createElement('div')
    blob.className = 'fog-blob'
    blob.style.cssText = `left:${p.x};top:${p.y};width:${p.w};height:${p.h};--fx:${p.fx};--fy:${p.fy};--fs:${p.fs};animation-delay:${i * 1.5}s;animation-duration:${10 + i * 3}s;`
    fogLayer.appendChild(blob)
  })
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [weather, setWeatherState] = useState<WeatherType>('night')
  const stormActiveRef = { value: false }

  const setWeather = (w: WeatherType) => {
    setWeatherState(w)
    document.body.setAttribute('data-weather', w)
    stormActiveRef.value = w === 'storm'
    if (boltTimeout) clearTimeout(boltTimeout)

    if (w === 'night') generateStars()
    if (w === 'rain') generateRain()
    if (w === 'snow') generateSnow()
    if (w === 'fog') generateFog()
    if (w === 'storm') {
      generateStorm()
      boltTimeout = setTimeout(() => scheduleBolt(stormActiveRef), Math.random() * 7000 + 5000)
    }
  }

  useEffect(() => {
    const initial = getDefaultWeather()
    generateFog()
    generateStars()
    setWeather(initial)
    fetchRealWeather().then(real => { if (real !== initial) setWeather(real) }).catch(() => {})
  }, [])

  return (
    <WeatherContext.Provider value={{ weather, setWeather }}>
      <div className="weather-bg-gradient" />
      <div className="weather-layer" id="layer-night" />
      <div className="weather-layer" id="layer-clear">
        <div className="sun-container">
          <div className="sun-rays" /><div className="sun-core" /><div className="sun-glow" />
        </div>
        <div className="sun-horizon" />
      </div>
      <div className="weather-layer" id="layer-rain">
        <div className="rain-mist" />
      </div>
      <div className="weather-layer" id="layer-snow">
        <div className="snow-frost" /><div className="snow-ground" />
      </div>
      <div className="weather-layer" id="layer-storm">
        <div className="storm-clouds" />
        <div className="storm-flash" id="storm-flash" />
        <div id="bolt-container" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 4 }} />
      </div>
      <div className="weather-layer" id="layer-fog">
        <div className="fog-layer" /><div className="fog-haze" />
      </div>
      {children}
    </WeatherContext.Provider>
  )
}
