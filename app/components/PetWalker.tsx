'use client'

import { useEffect, useRef, useState } from 'react'
import PetCanvas from './PetCanvas'
import { getPetDef, type Pet, type PetType, type PetVariant } from '@/lib/pets'

// ── СКОРОСТИ И ИНТЕРВАЛЫ ──────────────────────────────────────────────────────
const MOVE_INTERVAL: Record<PetType, number> = {
  jellyfish: 1400, ghost: 900,  hologram: 600, signal: 500,
  radar: 16,       neuron: 280, plasma: 320,   crystal: 700,
}
const PET_SPEED: Record<PetType, number> = {
  jellyfish: 80, ghost: 200, hologram: 150, signal: 180,
  radar: 2,      neuron: 260, plasma: 240,  crystal: 130,
}
const CSS_TRANSITION: Record<PetType, string> = {
  jellyfish: 'left 1.3s cubic-bezier(0.45,0,0.55,1), top 1.3s cubic-bezier(0.45,0,0.55,1)',
  ghost:     'left 0.1s, top 0.1s',
  hologram:  'left 0.55s ease, top 0.55s ease',
  signal:    'left 0.45s ease, top 0.45s ease',
  radar:     'none',
  neuron:    'left 0.2s ease, top 0.2s ease',
  plasma:    'left 0.28s ease, top 0.28s ease',
  crystal:   'left 0.65s ease, top 0.65s ease',
}

// ── СПОСОБНОСТИ ───────────────────────────────────────────────────────────────
function triggerAbility(type: PetType, variant: PetVariant, px: number, py: number) {
  const isVirus = variant === 'virus'

  const tempEl = (styles: string, ms: number) => {
    const el = document.createElement('div')
    el.style.cssText = `position:fixed;pointer-events:none;z-index:99985;${styles}`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), ms)
  }

  switch (type) {
    case 'hologram':
      if (!isVirus) {
        // Призрачный дубль рядом
        tempEl(`left:${px + 30}px;top:${py}px;opacity:0.25;filter:hue-rotate(90deg);animation:fadeOut 1.5s ease forwards`, 1600)
      } else {
        // Глитч фильтр на страницу
        document.body.style.filter = 'hue-rotate(25deg) brightness(1.15)'
        setTimeout(() => document.body.style.filter = '', 400)
        setTimeout(() => { document.body.style.filter = 'hue-rotate(-15deg)' }, 600)
        setTimeout(() => document.body.style.filter = '', 900)
      }
      break

    case 'ghost':
      if (!isVirus) {
        // Страница чуть прозрачнеет
        document.body.style.opacity = '0.88'
        setTimeout(() => document.body.style.opacity = '1', 1800)
      } else {
        // Мерцание
        const flicker = [0.2, 1, 0.4, 1, 0.7, 1]
        flicker.forEach((op, i) => setTimeout(() => document.body.style.opacity = String(op), i * 120))
        setTimeout(() => document.body.style.opacity = '1', 800)
      }
      break

    case 'jellyfish':
      if (!isVirus) {
        // Лёгкое underwater искажение
        document.body.style.filter = 'blur(0.6px) saturate(1.2)'
        setTimeout(() => document.body.style.filter = '', 2000)
      } else {
        // Смещаем карточки видео
        document.querySelectorAll<HTMLElement>('a[href*="/videos"]').forEach(el => {
          const dx = (Math.random() - 0.5) * 18
          const dy = (Math.random() - 0.5) * 10
          el.style.transform = `translate(${dx}px,${dy}px)`
          setTimeout(() => el.style.transform = '', 1600)
        })
      }
      break

    case 'signal':
      if (!isVirus) {
        // Пинг-волна от позиции питомца
        tempEl(`left:${px}px;top:${py}px;width:10px;height:10px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid #00FF88;animation:radarPulse 1.4s ease-out forwards`, 1500)
        setTimeout(() =>
          tempEl(`left:${px}px;top:${py}px;width:10px;height:10px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid #00FF88;opacity:0.5;animation:radarPulse 1.4s ease-out forwards`, 1500)
        , 400)
      } else {
        // Статические помехи
        tempEl(`inset:0;background:repeating-linear-gradient(0deg,rgba(0,255,136,0.04) 0,rgba(0,255,136,0.04) 1px,transparent 1px,transparent 4px);animation:glitchFlash 0.9s ease forwards`, 1000)
      }
      break

    case 'radar':
      if (!isVirus) {
        // Сканирующая линия
        tempEl(`left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#39FF14,transparent);box-shadow:0 0 8px #39FF14;animation:scanLine 1.8s ease-in-out forwards`, 1900)
      } else {
        // Точки-помехи
        for (let i = 0; i < 18; i++) {
          const x = Math.random() * window.innerWidth
          const y = Math.random() * window.innerHeight
          tempEl(`left:${x}px;top:${y}px;width:5px;height:5px;border-radius:50%;background:#FF1744;box-shadow:0 0 6px #FF1744;animation:fadeOut 2s ease forwards`, 2100)
        }
      }
      break

    case 'neuron':
      if (!isVirus) {
        // Нейронный импульс — радиальный градиент
        tempEl(`left:${px - 150}px;top:${py - 150}px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(180,79,255,0.18),transparent 70%);animation:fadeOut 2s ease forwards`, 2100)
      } else {
        // Визуальный swap двух кнопок
        const btns = Array.from(document.querySelectorAll<HTMLElement>('button, .btn-primary-ui, .btn-ghost-ui'))
          .filter(el => { const r = el.getBoundingClientRect(); return r.width > 50 && r.width < 220 && r.height > 20 })
        if (btns.length >= 2) {
          const i1 = Math.floor(Math.random() * btns.length)
          let i2 = Math.floor(Math.random() * btns.length)
          while (i2 === i1) i2 = Math.floor(Math.random() * btns.length)
          const r1 = btns[i1].getBoundingClientRect(), r2 = btns[i2].getBoundingClientRect()
          btns[i1].style.transform = `translate(${r2.left - r1.left}px,${r2.top - r1.top}px)`
          btns[i2].style.transform = `translate(${r1.left - r2.left}px,${r1.top - r2.top}px)`
          setTimeout(() => { btns[i1].style.transform = ''; btns[i2].style.transform = '' }, 1600)
        }
      }
      break

    case 'plasma':
      if (!isVirus) {
        // Искры вокруг питомца
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2
          const d = 45 + Math.random() * 25
          tempEl(`left:${px + Math.cos(a) * d}px;top:${py + Math.sin(a) * d}px;width:5px;height:5px;border-radius:50%;background:#FFD700;box-shadow:0 0 8px #FFD700;animation:fadeOut 0.9s ease forwards`, 1000)
        }
      } else {
        // Вспышка экрана
        tempEl(`inset:0;background:rgba(255,200,0,0.1);animation:fadeOut 0.6s ease forwards`, 700)
      }
      break

    case 'crystal':
      if (!isVirus) {
        // Радужный сдвиг оттенка кратко
        document.body.style.filter = 'hue-rotate(55deg) saturate(1.3)'
        setTimeout(() => document.body.style.filter = '', 900)
      } else {
        // Сильный разворот оттенков
        const steps = [60, 120, 180, 240, 0]
        steps.forEach((h, i) => setTimeout(() => {
          document.body.style.filter = h === 0 ? '' : `hue-rotate(${h}deg)`
        }, i * 120))
      }
      break
  }
}

// ── КОМПОНЕНТ ВЫГУЛА ──────────────────────────────────────────────────────────
export default function PetWalker({ pet, onReturn }: { pet: Pet; onReturn: () => void }) {
  const def = getPetDef(pet.type)
  const isVirus = pet.variant === 'virus'
  const C = isVirus ? def.colorVirus : def.color

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [trail, setTrail] = useState<{ id: number; x: number; y: number }[]>([])
  const [abilityFlash, setAbilityFlash] = useState(false)
  const posRef = useRef({ x: 0, y: 0 })
  const velRef = useRef({ vx: 0, vy: 0 })
  const angleRef = useRef(0)
  const rafRef = useRef<number>(0)
  const trailId = useRef(0)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const W = window.innerWidth
    const H = window.innerHeight
    posRef.current = { x: W / 2, y: H / 2 }

    // Радар: requestAnimationFrame по кругу
    if (pet.type === 'radar') {
      const speed = PET_SPEED.radar
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.3
      function tick() {
        angleRef.current += speed * 0.008
        const x = cx + Math.cos(angleRef.current) * r
        const y = cy + Math.sin(angleRef.current) * r * 0.5
        posRef.current = { x, y }
        setPos({ x, y })
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Медуза: sin-волна
    if (pet.type === 'jellyfish') {
      let t = 0
      const cx = W / 2, baseY = H / 2
      function tick() {
        t += 0.015
        const x = cx + Math.sin(t * 0.7) * W * 0.3
        const y = baseY + Math.sin(t) * H * 0.2
        posRef.current = { x, y }
        setPos({ x, y })
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Призрак КОД: плавный drift
    if (pet.type === 'ghost' && !isVirus) {
      let t = 0
      const cx = W / 2, cy = H / 2
      function tick() {
        t += 0.008
        const x = cx + Math.sin(t * 1.1) * W * 0.35
        const y = cy + Math.sin(t * 0.8) * H * 0.3
        posRef.current = { x, y }
        setPos({ x, y })
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Кристалл: smooth glide с трейлом
    if (pet.type === 'crystal') {
      let t = 0
      function tick() {
        t += 0.01
        const x = W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t)))
        const y = H * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.7 + 1)))
        posRef.current = { x, y }
        setPos({ x, y })
        const id = trailId.current++
        setTrail(tr => [...tr.slice(-10), { id, x, y }])
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Остальные: отскок от стен с setInterval
    const speed = PET_SPEED[pet.type]
    velRef.current = {
      vx: (Math.random() > 0.5 ? 1 : -1) * speed,
      vy: (Math.random() > 0.5 ? 1 : -1) * speed * 0.7,
    }
    posRef.current = { x: W * 0.3 + Math.random() * W * 0.4, y: H * 0.3 + Math.random() * H * 0.4 }

    const interval = MOVE_INTERVAL[pet.type]
    const iv = setInterval(() => {
      const p = posRef.current
      const v = velRef.current

      // Нейрон: случайное направление
      if (pet.type === 'neuron') {
        v.vx = (Math.random() - 0.5) * speed * 2
        v.vy = (Math.random() - 0.5) * speed * 2
      }

      // Призрак вирус: телепортация
      if (pet.type === 'ghost' && isVirus) {
        p.x = 60 + Math.random() * (W - 120)
        p.y = 60 + Math.random() * (H - 120)
      } else {
        p.x = Math.max(50, Math.min(W - 50, p.x + v.vx * (interval / 1000)))
        p.y = Math.max(60, Math.min(H - 60, p.y + v.vy * (interval / 1000)))
        if (p.x <= 50 || p.x >= W - 50) v.vx *= -1
        if (p.y <= 60 || p.y >= H - 60) v.vy *= -1
      }

      posRef.current = { x: p.x, y: p.y }
      setPos({ x: p.x, y: p.y })

      // Трейл для КОД
      if (!isVirus && pet.type !== 'ghost') {
        const id = trailId.current++
        setTrail(tr => [...tr.slice(-6), { id, x: p.x, y: p.y }])
      }
    }, interval)

    return () => clearInterval(iv)
  }, [pet.type, isVirus])

  // Очистка RAF
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      // Убираем любые фильтры при уходе
      document.body.style.filter = ''
      document.body.style.opacity = '1'
    }
  }, [])

  // Способности: каждые 9 сек
  useEffect(() => {
    const iv = setInterval(() => {
      triggerAbility(pet.type, pet.variant, posRef.current.x, posRef.current.y)
      setAbilityFlash(true)
      setTimeout(() => setAbilityFlash(false), 600)
    }, 9000)
    return () => clearInterval(iv)
  }, [pet.type, pet.variant])

  const transition = CSS_TRANSITION[pet.type]

  return (
    <>
      {/* Трейл */}
      {trail.map((t, i) => (
        <div key={t.id} style={{
          position: 'fixed', left: t.x, top: t.y, zIndex: 9994,
          transform: 'translate(-50%, -50%)',
          opacity: ((i + 1) / trail.length) * 0.22,
          pointerEvents: 'none',
          filter: `drop-shadow(0 0 4px ${C})`,
        }}>
          <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={36} />
        </div>
      ))}

      {/* Питомец */}
      <div style={{
        position: 'fixed', left: pos.x, top: pos.y, zIndex: 9995,
        transform: 'translate(-50%, -50%)',
        transition,
        filter: `drop-shadow(0 0 ${abilityFlash ? 20 : 8}px ${C})`,
        cursor: 'default',
        pointerEvents: 'none',
      }}>
        <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={64} />
      </div>

      {/* Информация способности */}
      {abilityFlash && (
        <div style={{
          position: 'fixed', left: pos.x, top: pos.y - 50, zIndex: 9996,
          transform: 'translateX(-50%)',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: C,
          letterSpacing: 2, textShadow: `0 0 8px ${C}`,
          animation: 'floatUp 0.8s ease forwards',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {isVirus ? def.abilityVirus : def.abilityKod}
        </div>
      )}

      {/* Кнопка ВЕРНУТЬ */}
      <button
        onClick={onReturn}
        style={{
          position: 'fixed', bottom: 80, right: 24, zIndex: 9997,
          fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 3,
          padding: '10px 20px', borderRadius: 8,
          border: `1px solid ${C}`, color: C,
          background: 'rgba(6,6,18,0.92)', cursor: 'pointer',
          boxShadow: `0 0 16px rgba(${isVirus ? '255,0,110' : '0,212,255'},0.2)`,
          backdropFilter: 'blur(8px)',
          animation: 'fadeInUp 0.4s ease',
        }}
      >
        ← ВЕРНУТЬ {def.nameRu}
      </button>
    </>
  )
}
