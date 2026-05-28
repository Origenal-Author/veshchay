'use client'

import { useEffect, useState } from 'react'

interface Stats { total: number; last24: number }

export default function OperatorsCounter() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    let active = true
    let iv: ReturnType<typeof setInterval> | null = null

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats/operators', { cache: 'no-store' })
        if (res.status === 401 || res.status === 403) {
          if (active) {
            setForbidden(true)
            if (iv) clearInterval(iv)
          }
          return
        }
        if (!res.ok) return
        const data = await res.json()
        if (active) setStats(data)
      } catch {}
    }

    fetchStats()
    iv = setInterval(fetchStats, 30_000) // polling каждые 30 сек
    return () => { active = false; if (iv) clearInterval(iv) }
  }, [])

  if (forbidden || !stats) return null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 7500,
        padding: '8px 14px',
        background: 'rgba(6,6,18,0.85)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(0,255,240,0.25)',
        borderRadius: 6,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: 1.5,
        color: '#00FFF0',
        pointerEvents: 'auto',
        cursor: 'default',
        userSelect: 'none',
        boxShadow: hovered
          ? '0 0 16px rgba(0,255,240,0.25)'
          : '0 0 8px rgba(0,255,240,0.1)',
        transition: 'box-shadow 0.2s',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#00FF88',
          boxShadow: '0 0 6px #00FF88',
          animation: 'pulseLive 1.6s ease-in-out infinite',
        }}
      />
      <span style={{ color: '#506080' }}>// ОПЕРАТОРОВ:</span>
      <span style={{ color: '#00FFF0', fontWeight: 'bold' }}>{stats.total}</span>
      {stats.last24 > 0 && (
        <span style={{ color: '#00FF88' }}>+{stats.last24}/24ч</span>
      )}
      <style>{`
        @keyframes pulseLive {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
