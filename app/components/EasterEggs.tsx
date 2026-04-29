'use client'

import { useEffect, useRef } from 'react'

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

function triggerHacked() {
  const overlay = document.createElement('div')
  overlay.style.cssText = `position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Orbitron',monospace;`

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.4;'
  overlay.appendChild(canvas)

  const msg = document.createElement('div')
  msg.style.cssText = `position:relative;z-index:2;text-align:center;`
  msg.innerHTML = `
    <div style="font-size:clamp(24px,5vw,48px);font-weight:900;letter-spacing:8px;color:#00ff41;text-shadow:0 0 30px #00ff41,0 0 60px #00ff41;animation:glitchFlicker 0.15s infinite;">СИСТЕМА ВЗЛОМАНА</div>
    <div style="margin-top:16px;font-size:14px;letter-spacing:4px;color:rgba(0,255,65,0.6);font-family:'JetBrains Mono',monospace;">ACCESS GRANTED // VESHCHAY_CORE</div>
    <div style="margin-top:32px;font-size:11px;color:rgba(0,255,65,0.4);font-family:'JetBrains Mono',monospace;" id="hack-counter">decrypting... 0%</div>
  `
  overlay.appendChild(msg)

  const style = document.createElement('style')
  style.textContent = `@keyframes glitchFlicker{0%{transform:skewX(0deg)}20%{transform:skewX(-2deg) translateX(2px)}40%{transform:skewX(1deg) translateX(-1px)}60%{transform:skewX(0deg)}80%{transform:skewX(2deg)}100%{transform:skewX(0deg)}}`
  document.head.appendChild(style)
  document.body.appendChild(overlay)

  // Matrix rain
  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const cols = Math.floor(canvas.width / 16)
  const drops = Array(cols).fill(1)
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

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

  // Progress counter
  let pct = 0
  const counter = overlay.querySelector('#hack-counter') as HTMLElement
  const progress = setInterval(() => {
    pct += Math.floor(Math.random() * 7) + 1
    if (pct >= 100) { pct = 100; clearInterval(progress) }
    if (counter) counter.textContent = `decrypting... ${pct}%`
  }, 80)

  // Fade out after 5s
  setTimeout(() => {
    overlay.style.transition = 'opacity 1s'
    overlay.style.opacity = '0'
    clearInterval(rain)
    clearInterval(progress)
    setTimeout(() => { overlay.remove(); style.remove() }, 1000)
  }, 5000)
}

function triggerGlitch() {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes glitchH{0%{clip-path:inset(0 0 95% 0)}10%{clip-path:inset(20% 0 60% 0)}20%{clip-path:inset(50% 0 30% 0)}30%{clip-path:inset(80% 0 5% 0)}40%{clip-path:inset(10% 0 85% 0)}50%{clip-path:inset(40% 0 40% 0)}100%{clip-path:inset(0 0 0 0)}}
    @keyframes glitchShift{0%{transform:translate(0)}20%{transform:translate(-4px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-2px,4px)}80%{transform:translate(2px,-1px)}100%{transform:translate(0)}}
    .glitch-active{animation:glitchShift 0.1s steps(1) 5;}
    .glitch-active::before{content:'';position:fixed;inset:0;background:rgba(255,0,110,0.08);z-index:9998;pointer-events:none;animation:glitchH 0.5s steps(1) 1;}
  `
  document.head.appendChild(style)
  document.body.classList.add('glitch-active')

  // Flash overlay
  const flash = document.createElement('div')
  flash.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;background:rgba(0,255,240,0.05);'
  document.body.appendChild(flash)

  setTimeout(() => {
    document.body.classList.remove('glitch-active')
    flash.remove()
    style.remove()
  }, 600)
}

export default function EasterEggs() {
  const konamiRef = useRef<string[]>([])
  const typedRef = useRef('')
  const logoClicksRef = useRef(0)
  const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Konami code
      konamiRef.current = [...konamiRef.current, e.key].slice(-KONAMI.length)
      if (konamiRef.current.join(',') === KONAMI.join(',')) {
        triggerHacked()
        konamiRef.current = []
      }

      // Typed "вещай"
      if (e.key.length === 1) {
        typedRef.current = (typedRef.current + e.key).slice(-6).toLowerCase()
        if (typedRef.current.includes('вещай')) {
          triggerGlitch()
          typedRef.current = ''
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const logo = document.querySelector('.site-logo')
    if (!logo) return

    function onLogoClick() {
      logoClicksRef.current++
      if (logoTimerRef.current) clearTimeout(logoTimerRef.current)
      logoTimerRef.current = setTimeout(() => { logoClicksRef.current = 0 }, 1500)

      if (logoClicksRef.current >= 5) {
        logoClicksRef.current = 0
        activateCosmosTheme()
      }
    }

    logo.addEventListener('click', onLogoClick)
    return () => logo.removeEventListener('click', onLogoClick)
  }, [])

  return null
}

function activateCosmosTheme() {
  // Inject cosmos CSS variables temporarily
  const style = document.createElement('style')
  style.id = 'cosmos-theme'
  style.textContent = `
    body[data-weather="cosmos"] {
      --bg:#000005;--surface:#05000F;--surface2:#080018;
      --accent:#FF00FF;--accent2:#00FFFF;
      --accent-glow:rgba(255,0,255,0.4);--border:rgba(255,0,255,0.15);
      --text:#F0E0FF;--subtext:#8060A0;--scanline:rgba(255,0,255,0.008);
      --logo-shadow:0 0 20px rgba(255,0,255,0.8),0 0 60px rgba(0,255,255,0.3);
    }
    body[data-weather="cosmos"] .weather-bg-gradient{
      background:
        radial-gradient(ellipse at 30% 40%,rgba(255,0,255,0.06) 0%,transparent 50%),
        radial-gradient(ellipse at 70% 60%,rgba(0,255,255,0.04) 0%,transparent 50%),
        radial-gradient(ellipse at 50% 20%,rgba(100,0,200,0.08) 0%,transparent 40%);
    }
    body[data-weather="cosmos"] #layer-night{opacity:1!important;}
  `
  document.head.appendChild(style)
  document.body.setAttribute('data-weather', 'cosmos')

  // Show secret message
  const toast = document.createElement('div')
  toast.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(0,0,0,0.9);border:1px solid #FF00FF;padding:12px 24px;font-family:'Orbitron',monospace;font-size:12px;letter-spacing:3px;color:#FF00FF;text-shadow:0 0 10px #FF00FF;box-shadow:0 0 30px rgba(255,0,255,0.3);white-space:nowrap;`
  toast.textContent = '🌌 COSMOS MODE UNLOCKED'
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s'
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 500)
  }, 3000)

  // Revert after 30s
  setTimeout(() => {
    document.body.setAttribute('data-weather', 'night')
    style.remove()
  }, 30000)
}
