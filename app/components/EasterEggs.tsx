'use client'

import { useEffect, useRef } from 'react'

// Триггер 1: напечатать "взлом" → матричный дождь
// Триггер 2: напечатать "вещай" → глитч
// Триггер 3: 3 клика по логотипу → тема COSMOS

function triggerHacked() {
  const overlay = document.createElement('div')
  overlay.style.cssText = `position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Orbitron',monospace;`

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.4;'
  overlay.appendChild(canvas)

  const msg = document.createElement('div')
  msg.style.cssText = `position:relative;z-index:2;text-align:center;`
  msg.innerHTML = `
    <div style="font-size:clamp(24px,5vw,48px);font-weight:900;letter-spacing:8px;color:#00ff41;text-shadow:0 0 30px #00ff41,0 0 60px #00ff41;">СИСТЕМА ВЗЛОМАНА</div>
    <div style="margin-top:16px;font-size:14px;letter-spacing:4px;color:rgba(0,255,65,0.6);font-family:'JetBrains Mono',monospace;">ACCESS GRANTED // VESHCHAY_CORE</div>
    <div style="margin-top:32px;font-size:11px;color:rgba(0,255,65,0.4);font-family:'JetBrains Mono',monospace;" id="hack-counter">decrypting... 0%</div>
  `
  overlay.appendChild(msg)
  document.body.appendChild(overlay)

  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const cols = Math.floor(canvas.width / 16)
  const drops = Array(cols).fill(1)
  const chars = 'アイウエオАБВГДЕЁЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789'

  const rain = setInterval(() => {
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#00ff41'
    ctx.font = '14px monospace'
    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillText(char, i * 16, y * 16)
      if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0
      drops[i]++
    })
  }, 33)

  let pct = 0
  const counter = overlay.querySelector('#hack-counter') as HTMLElement
  const progress = setInterval(() => {
    pct = Math.min(100, pct + Math.floor(Math.random() * 7) + 1)
    if (counter) counter.textContent = `decrypting... ${pct}%`
    if (pct >= 100) clearInterval(progress)
  }, 80)

  overlay.addEventListener('click', dismiss)
  setTimeout(dismiss, 5000)

  function dismiss() {
    overlay.style.transition = 'opacity 1s'
    overlay.style.opacity = '0'
    clearInterval(rain)
    clearInterval(progress)
    setTimeout(() => { overlay.remove(); spawnGlitchParticles() }, 1000)
  }
}

function spawnGlitchParticles() {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;overflow:hidden;'
  document.body.appendChild(container)

  const colors = ['#00ff41', '#00FFF0', '#FF006E', '#9B10FF', '#FFB300', '#fff']

  function spawnOne() {
    const el = document.createElement('div')
    const w = Math.random() * 120 + 20
    const h = Math.random() * 8 + 2
    const color = colors[Math.floor(Math.random() * colors.length)]
    const x = Math.random() * (window.innerWidth - w)
    const y = Math.random() * window.innerHeight
    const duration = Math.random() * 300 + 100
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${color};opacity:${Math.random() * 0.8 + 0.2};mix-blend-mode:screen;`
    container.appendChild(el)
    setTimeout(() => el.remove(), duration)
  }

  // Spawn particles frequently for 10 seconds
  const interval = setInterval(spawnOne, 80)
  setTimeout(() => {
    clearInterval(interval)
    container.style.transition = 'opacity 0.5s'
    container.style.opacity = '0'
    setTimeout(() => container.remove(), 500)
  }, 10000)
}

function triggerGlitch() {
  const style = document.createElement('style')
  style.textContent = `@keyframes gs{0%{transform:translate(0)}20%{transform:translate(-4px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-2px,4px)}100%{transform:translate(0)}}.ga{animation:gs 0.1s steps(1) 5;}`
  document.head.appendChild(style)
  document.body.classList.add('ga')
  const flash = document.createElement('div')
  flash.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;background:rgba(0,255,240,0.07);'
  document.body.appendChild(flash)
  setTimeout(() => { document.body.classList.remove('ga'); flash.remove(); style.remove() }, 600)
}

function activateCosmos() {
  const existing = document.getElementById('cosmos-theme')
  if (existing) existing.remove()

  const style = document.createElement('style')
  style.id = 'cosmos-theme'
  style.textContent = `
    body[data-weather="cosmos"]{--bg:#000005;--surface:#05000F;--surface2:#080018;--accent:#FF00FF;--accent2:#00FFFF;--accent-glow:rgba(255,0,255,0.4);--border:rgba(255,0,255,0.15);--text:#F0E0FF;--subtext:#8060A0;--scanline:rgba(255,0,255,0.008);--logo-shadow:0 0 20px rgba(255,0,255,0.8),0 0 60px rgba(0,255,255,0.3);}
    body[data-weather="cosmos"] .weather-bg-gradient{background:radial-gradient(ellipse at 30% 40%,rgba(255,0,255,0.06) 0%,transparent 50%),radial-gradient(ellipse at 70% 60%,rgba(0,255,255,0.04) 0%,transparent 50%);}
    body[data-weather="cosmos"] #layer-night{opacity:1!important;}
  `
  document.head.appendChild(style)

  const prev = document.body.getAttribute('data-weather') || 'night'
  document.body.setAttribute('data-weather', 'cosmos')

  const toast = document.createElement('div')
  toast.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(0,0,0,0.9);border:1px solid #FF00FF;padding:12px 24px;font-family:'Orbitron',monospace;font-size:12px;letter-spacing:3px;color:#FF00FF;text-shadow:0 0 10px #FF00FF;box-shadow:0 0 30px rgba(255,0,255,0.3);white-space:nowrap;`
  toast.textContent = '🌌 COSMOS MODE — 30 СЕК'
  document.body.appendChild(toast)
  setTimeout(() => { toast.style.transition = 'opacity 0.5s'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500) }, 3000)

  setTimeout(() => { document.body.setAttribute('data-weather', prev); style.remove() }, 30000)
}

export default function EasterEggs() {
  const typedRef = useRef('')
  const logoClicksRef = useRef(0)
  const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.length !== 1) return
      typedRef.current = (typedRef.current + e.key.toLowerCase()).slice(-6)

      if (typedRef.current.includes('взлом')) {
        triggerHacked()
        typedRef.current = ''
      }
      if (typedRef.current.includes('вещай')) {
        triggerGlitch()
        typedRef.current = ''
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.site-logo')) return
      logoClicksRef.current++
      if (logoTimerRef.current) clearTimeout(logoTimerRef.current)
      logoTimerRef.current = setTimeout(() => { logoClicksRef.current = 0 }, 1500)
      if (logoClicksRef.current >= 3) {
        logoClicksRef.current = 0
        activateCosmos()
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return null
}
