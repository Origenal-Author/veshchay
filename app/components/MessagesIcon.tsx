'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function MessagesIcon() {
  const [unread, setUnread] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    async function check() {
      const res = await fetch('/api/messages')
      const data = await res.json()
      const total = (data.conversations ?? []).reduce((s: number, c: any) => s + c.unread, 0)
      setUnread(total)
    }
    check()
    const iv = setInterval(check, 30000)
    return () => clearInterval(iv)
  }, [userId])

  if (!userId) return null

  return (
    <Link href="/messages" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(0,255,240,0.2)', background: 'rgba(13,13,26,0.8)', backdropFilter: 'blur(8px)', textDecoration: 'none' }} title="Сообщения">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 3h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4l-3 2V4a1 1 0 0 1 1-1z" stroke="#00FFF0" strokeWidth="1.2" fill="rgba(0,255,240,0.06)" />
      </svg>
      {unread > 0 && (
        <div style={{
          position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
          background: '#FF006E', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#fff', fontWeight: 700,
          boxShadow: '0 0 8px rgba(255,0,110,0.6)',
        }}>
          {unread > 9 ? '9+' : unread}
        </div>
      )}
    </Link>
  )
}
