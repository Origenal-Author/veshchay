'use client'

import { useEffect, useState } from 'react'
import { ACHIEVEMENTS } from '@/lib/achievements'

interface ToastItem { key: string; id: number }

let toastId = 0

export function dispatchAchievements(keys: string[]) {
  keys.forEach(key => {
    window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { key } }))
  })
}

export async function checkAchievements() {
  try {
    const res = await fetch('/api/achievements/check', { method: 'POST' })
    const data = await res.json()
    if (data.newly_unlocked?.length > 0) dispatchAchievements(data.newly_unlocked)
  } catch { /* ignore */ }
}

export default function AchievementToast() {
  const [queue, setQueue] = useState<ToastItem[]>([])

  useEffect(() => {
    function handle(e: Event) {
      const key = (e as CustomEvent).detail?.key
      if (!key) return
      const id = toastId++
      setQueue(q => [...q, { key, id }])
      setTimeout(() => setQueue(q => q.filter(t => t.id !== id)), 5000)
    }
    window.addEventListener('achievement-unlocked', handle)
    return () => window.removeEventListener('achievement-unlocked', handle)
  }, [])

  if (queue.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99998,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {queue.map(({ key, id }) => {
        const def = ACHIEVEMENTS.find(a => a.key === key)
        if (!def) return null
        return (
          <div
            key={id}
            style={{
              background: 'rgba(6,6,18,0.97)',
              border: '1px solid rgba(0,255,240,0.4)',
              borderLeft: '3px solid #00FFF0',
              borderRadius: 10,
              padding: '12px 16px',
              minWidth: 280, maxWidth: 340,
              boxShadow: '0 0 30px rgba(0,255,240,0.2)',
              animation: 'slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div style={{
              fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
              color: '#00FFF0', letterSpacing: 3, marginBottom: 6,
            }}>
              ✦ АЧИВКА РАЗБЛОКИРОВАНА
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>{def.icon}</span>
              <div>
                <div style={{
                  fontFamily: 'Orbitron,monospace', fontSize: 11,
                  letterSpacing: 2, color: '#E0E8F0', fontWeight: 700,
                }}>
                  {def.name}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono,monospace', fontSize: 10,
                  color: '#506080', marginTop: 3, letterSpacing: 1,
                }}>
                  {def.description}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
