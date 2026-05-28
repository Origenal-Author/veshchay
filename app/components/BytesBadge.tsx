'use client'

import { useEffect, useState } from 'react'
import ByteIcon from './ByteIcon'

export default function BytesBadge() {
  const [bytes, setBytes] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    async function fetchBytes() {
      try {
        const res = await fetch('/api/bytes/me', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (active) setBytes(data.bytes)
      } catch {}
    }

    fetchBytes()
    const iv = setInterval(fetchBytes, 15_000) // обновление каждые 15 сек
    return () => { active = false; clearInterval(iv) }
  }, [])

  // Не показываем если пользователь не залогинен
  if (bytes === null) return null

  return (
    <div style={{
      position: 'fixed',
      top: 14,
      left: 14,
      zIndex: 7500,
      padding: '6px 12px 6px 8px',
      background: 'rgba(6,6,18,0.85)',
      backdropFilter: 'blur(6px)',
      border: '1px solid rgba(255,179,0,0.25)',
      borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12, letterSpacing: 1,
      color: '#FFB300',
      boxShadow: '0 0 12px rgba(255,179,0,0.10)',
      pointerEvents: 'auto',
      userSelect: 'none',
    }}>
      <ByteIcon size={18} />
      <span style={{ fontWeight: 'bold' }}>{bytes.toLocaleString('ru')}</span>
    </div>
  )
}
