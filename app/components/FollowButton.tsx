'use client'

import { useState } from 'react'

interface Props {
  targetId: string
  initialFollowing: boolean
  initialCount: number
  currentUserId: string | null
}

export default function FollowButton({ targetId, initialFollowing, initialCount, currentUserId }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    if (!currentUserId) {
      window.location.href = '/auth/login'
      return
    }
    setLoading(true)

    const next = !following
    setFollowing(next)
    setCount(c => next ? c + 1 : c - 1)

    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })

    if (!res.ok) {
      setFollowing(following)
      setCount(count)
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          fontFamily: 'Orbitron,monospace',
          fontSize: 9,
          letterSpacing: 3,
          padding: '7px 16px',
          borderRadius: 6,
          border: `1px solid ${following ? '#00FF88' : 'rgba(0,255,240,0.4)'}`,
          background: following
            ? 'rgba(0,255,136,0.08)'
            : 'rgba(0,255,240,0.04)',
          color: following ? '#00FF88' : '#00FFF0',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.2s',
          boxShadow: following ? '0 0 10px rgba(0,255,136,0.2)' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {following ? '◉ МОНИТОРИНГ ВКЛ' : '○ МОНИТОРИТЬ'}
      </button>
      <div style={{
        fontFamily: 'JetBrains Mono,monospace',
        fontSize: 9,
        color: '#3A5060',
        letterSpacing: 2,
      }}>
        {count} {getLabel(count)}
      </div>
    </div>
  )
}

function getLabel(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'наблюдают'
  if (mod10 === 1) return 'наблюдает'
  if (mod10 >= 2 && mod10 <= 4) return 'наблюдают'
  return 'наблюдают'
}
