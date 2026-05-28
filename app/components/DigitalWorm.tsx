'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onDespawn: () => void
  durationMs?: number  // сколько живёт без убийства
}

// Цифровой червь — большой sluggish паразит, ползёт извилисто по экрану.
// Появляется при долгом отсутствии или выходе из аккаунта.
// Кликом можно убить (получаешь немного XP при следующем входе — будущая идея).
export default function DigitalWorm({ onDespawn, durationMs = 30000 }: Props) {
  const [pos, setPos] = useState({ x: -120, y: 200 })
  const [angle, setAngle] = useState(0)
  const [dead, setDead] = useState(false)
  const tRef = useRef(0)
  const wavelengthRef = useRef(0)

  useEffect(() => {
    const W = typeof window !== 'undefined' ? window.innerWidth : 1200
    const H = typeof window !== 'undefined' ? window.innerHeight : 800
    const baseY = 80 + Math.random() * (H - 200)
    wavelengthRef.current = baseY

    let frame = 0
    const iv = setInterval(() => {
      if (dead) return
      tRef.current += 0.04
      frame++

      const progress = frame * 1.6  // px per tick
      const x = -120 + progress
      const y = baseY + Math.sin(tRef.current) * 80 + Math.cos(tRef.current * 0.7) * 30

      // Угол по направлению движения — производная
      const yNext = baseY + Math.sin(tRef.current + 0.04) * 80 + Math.cos((tRef.current + 0.04) * 0.7) * 30
      const dy = yNext - y
      const dx = 1.6
      const newAngle = (Math.atan2(dy, dx) * 180) / Math.PI

      setPos({ x, y })
      setAngle(newAngle)

      if (x > W + 200) {
        clearInterval(iv)
        onDespawn()
      }
    }, 30)

    // Auto-despawn по времени
    const t = setTimeout(() => {
      clearInterval(iv)
      onDespawn()
    }, durationMs)

    return () => { clearInterval(iv); clearTimeout(t) }
  }, [dead, durationMs, onDespawn])

  function squash() {
    if (dead) return
    setDead(true)
    // Сохраняем что убили в localStorage для будущего бонуса
    try { localStorage.setItem('veshchay_worm_killed', String(Date.now())) } catch { /* ignore */ }
    setTimeout(onDespawn, 800)
  }

  return (
    <div
      onClick={squash}
      title="Цифровой червь! Раздави!"
      style={{
        position: 'fixed', left: pos.x, top: pos.y, zIndex: 9998,
        transform: `rotate(${angle}deg) ${dead ? 'scale(0.2)' : 'scale(1)'}`,
        transformOrigin: 'center center',
        opacity: dead ? 0 : 1,
        transition: dead ? 'transform 0.5s ease, opacity 0.5s ease' : 'transform 0.18s ease-out',
        cursor: dead ? 'default' : 'pointer',
        pointerEvents: dead ? 'none' : 'auto',
        userSelect: 'none',
      }}
    >
      {dead ? (
        <span style={{ fontSize: 56, filter: 'drop-shadow(0 0 12px #FF006E)' }}>💥</span>
      ) : (
        <svg width="120" height="42" viewBox="0 0 120 42" style={{ filter: 'drop-shadow(0 0 12px #FF006E)' }}>
          {/* Тело — извилистое */}
          <path
            d="M5 21 Q15 12 25 21 Q35 30 45 21 Q55 12 65 21 Q75 30 85 21 Q95 12 105 21"
            stroke="#FF006E" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Сегментные кольца */}
          <circle cx="15" cy="16.5" r="2" fill="#06060f" />
          <circle cx="35" cy="25.5" r="2" fill="#06060f" />
          <circle cx="55" cy="16.5" r="2" fill="#06060f" />
          <circle cx="75" cy="25.5" r="2" fill="#06060f" />
          <circle cx="95" cy="16.5" r="2" fill="#06060f" />
          {/* Голова — слева */}
          <circle cx="108" cy="21" r="8" fill="#FF006E" filter="drop-shadow(0 0 6px #FF006E)" />
          {/* Глаза */}
          <circle cx="106" cy="18" r="1.5" fill="#ffffff" />
          <circle cx="111" cy="18" r="1.5" fill="#ffffff" />
          <circle cx="106" cy="18" r="0.6" fill="#000000" />
          <circle cx="111" cy="18" r="0.6" fill="#000000" />
          {/* Зубастый рот */}
          <path d="M104 24 L106 27 L108 24 L110 27 L112 24" stroke="#ffffff" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          {/* Хвост */}
          <path d="M5 21 L0 17 M5 21 L0 25" stroke="#FF006E" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}
