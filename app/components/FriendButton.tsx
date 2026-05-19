'use client'

import { useState } from 'react'

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends'

export default function FriendButton({
  targetId,
  initialStatus,
  initialRequestId,
  currentUserId,
}: {
  targetId: string
  initialStatus: FriendStatus
  initialRequestId: string | null
  currentUserId: string | null
}) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus)
  const [requestId, setRequestId] = useState<string | null>(initialRequestId)
  const [loading, setLoading] = useState(false)

  if (!currentUserId) return null

  async function sendRequest() {
    setLoading(true)
    const res = await fetch('/api/friends/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    if (res.ok) setStatus('pending_sent')
    setLoading(false)
  }

  async function cancel() {
    setLoading(true)
    await fetch('/api/friends/request', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    setStatus('none')
    setRequestId(null)
    setLoading(false)
  }

  async function respond(action: 'accept' | 'decline') {
    if (!requestId) return
    setLoading(true)
    const res = await fetch('/api/friends/respond', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    })
    if (res.ok) setStatus(action === 'accept' ? 'friends' : 'none')
    setLoading(false)
  }

  const base: React.CSSProperties = {
    fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
    letterSpacing: 2, padding: '8px 14px', borderRadius: 6,
    cursor: loading ? 'default' : 'pointer', border: 'none',
    transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
  }

  if (status === 'none') return (
    <button onClick={sendRequest} disabled={loading} style={{
      ...base,
      background: 'rgba(0,255,240,0.08)',
      border: '1px solid rgba(0,255,240,0.3)',
      color: '#00FFF0',
    }}>
      {loading ? '...' : '⬡ КОННЕКТИТЬСЯ'}
    </button>
  )

  if (status === 'pending_sent') return (
    <button onClick={cancel} disabled={loading} style={{
      ...base,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#506080',
    }}>
      {loading ? '...' : '⌛ ЗАПРОС ОТПРАВЛЕН'}
    </button>
  )

  if (status === 'pending_received') return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => respond('accept')} disabled={loading} style={{
        ...base,
        background: 'rgba(0,255,136,0.1)',
        border: '1px solid rgba(0,255,136,0.4)',
        color: '#00FF88',
      }}>
        ✓ ПРИНЯТЬ
      </button>
      <button onClick={() => respond('decline')} disabled={loading} style={{
        ...base,
        background: 'rgba(255,0,110,0.08)',
        border: '1px solid rgba(255,0,110,0.3)',
        color: '#FF006E',
      }}>
        ✕
      </button>
    </div>
  )

  if (status === 'friends') return (
    <button onClick={cancel} disabled={loading} title="Разорвать коннект" style={{
      ...base,
      background: 'rgba(0,255,136,0.06)',
      border: '1px solid rgba(0,255,136,0.25)',
      color: '#00FF88',
    }}>
      {loading ? '...' : '⬡ ЗАКОННЕКЧЕНЫ'}
    </button>
  )

  return null
}
