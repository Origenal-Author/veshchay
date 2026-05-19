'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Notification {
  id: string
  type: string
  actor_id: string
  entity_id: string | null
  entity_title: string | null
  read: boolean
  created_at: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}д.`
  if (h > 0) return `${h}ч.`
  if (m > 0) return `${m}м.`
  return 'только что'
}

function notifText(n: Notification, actorName: string) {
  if (n.type === 'follow') return `${actorName} начал мониторить тебя`
  if (n.type === 'echo') return `${actorName} оставил отклик на «${n.entity_title ?? 'видео'}»`
  if (n.type === 'attack') return `⚡ ${actorName} атаковал твой канал!`
  if (n.type === 'friend_request') return `${actorName} хочет законнектиться с тобой`
  if (n.type === 'friend_accept') return `${actorName} принял твой запрос на коннект`
  if (n.type === 'pet_borrow_request') return `${actorName} хочет занять твоего питомца`
  if (n.type === 'pet_borrow_accept') return `${actorName} разрешил занять питомца`
  return 'Новое уведомление'
}

function notifIcon(type: string) {
  if (type === 'follow') return '👁'
  if (type === 'echo') return '💬'
  if (type === 'attack') return '💀'
  if (type === 'friend_request') return '⬡'
  if (type === 'friend_accept') return '⬡'
  if (type === 'pet_borrow_request') return '☄'
  if (type === 'pet_borrow_accept') return '☄'
  return '📡'
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [actors, setActors] = useState<Record<string, string>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  async function respondFriend(requestId: string, action: 'accept' | 'decline', notifId: string) {
    setResponding(notifId)
    await fetch('/api/friends/respond', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    })
    setNotifications(prev => prev.map(n => n.id === notifId
      ? { ...n, type: action === 'accept' ? 'friend_accept_done' : 'friend_decline_done' }
      : n
    ))
    setResponding(null)
  }

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()
    // Полинг каждые 30 сек
    const iv = setInterval(fetchNotifications, 30000)
    return () => clearInterval(iv)
  }, [userId])

  async function fetchNotifications() {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    const notifs: Notification[] = data.notifications ?? []
    setNotifications(notifs)

    // Загружаем имена авторов
    const ids = [...new Set(notifs.map(n => n.actor_id))]
    if (ids.length === 0) return
    const { data: profiles } = await createClient()
      .from('profiles').select('id, username').in('id', ids)
    if (profiles) {
      setActors(Object.fromEntries(profiles.map(p => [p.id, p.username || 'аноним'])))
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Закрытие по клику вне панели
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!userId) return null

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Кнопка-колокольчик */}
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead() }}
        style={{
          position: 'relative', width: 36, height: 36, borderRadius: 8,
          border: `1px solid ${open ? 'rgba(0,255,240,0.4)' : 'rgba(255,255,255,0.1)'}`,
          background: open ? 'rgba(0,255,240,0.06)' : 'rgba(13,13,26,0.8)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', backdropFilter: 'blur(8px)',
        }}
        title="Уведомления"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6v3.5L2 11h12l-1.5-1.5V6C12.5 3.5 10.5 1.5 8 1.5z"
            stroke="#00FFF0" strokeWidth="1.2" fill="rgba(0,255,240,0.08)"/>
          <path d="M6.5 11.5a1.5 1.5 0 0 0 3 0" stroke="#00FFF0" strokeWidth="1.2" fill="none"/>
        </svg>
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16, borderRadius: '50%',
            background: '#FF006E', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#fff', fontWeight: 700,
            boxShadow: '0 0 8px rgba(255,0,110,0.6)',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {/* Дропдаун */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 44, left: 0, width: 300, maxHeight: '70vh',
          background: 'rgba(6,6,18,0.98)', border: '1px solid rgba(0,255,240,0.15)',
          borderRadius: 12, overflow: 'hidden', zIndex: 9000,
          boxShadow: '0 0 40px rgba(0,255,240,0.08)',
          animation: 'slideInUp 0.25s ease',
        }}>
          {/* Шапка */}
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(0,255,240,0.03)',
          }}>
            <span style={{ fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 3, color: '#00FFF0' }}>
              // СИГНАЛЫ
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#506080', letterSpacing: 1,
              }}>
                прочитать все
              </button>
            )}
          </div>

          {/* Список */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 44px)' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 2,
              }}>
                // уведомлений нет //
              </div>
            ) : notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex', gap: 10, padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: n.read ? 'transparent' : 'rgba(0,255,240,0.03)',
                transition: 'background 0.2s',
              }}>
                {/* Иконка */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {notifIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Exo 2,sans-serif', fontSize: 11, color: n.read ? '#506080' : '#C0C8D0',
                    lineHeight: 1.5,
                  }}>
                    {notifText(n, actors[n.actor_id] || '...')}
                  </div>
                  {n.type === 'pet_borrow_request' && n.entity_id && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        onClick={async () => {
                          setResponding(n.id)
                          await fetch('/api/pets/borrow', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrowId: n.entity_id, action: 'accept' }) })
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, type: 'pet_borrow_done' } : x))
                          setResponding(null)
                        }}
                        disabled={responding === n.id}
                        style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, letterSpacing: 1, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(255,179,0,0.4)', background: 'rgba(255,179,0,0.08)', color: '#FFB300', cursor: 'pointer' }}
                      >
                        {responding === n.id ? '...' : 'РАЗРЕШИТЬ'}
                      </button>
                      <button
                        onClick={async () => {
                          setResponding(n.id)
                          await fetch('/api/pets/borrow', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrowId: n.entity_id, action: 'decline' }) })
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, type: 'pet_borrow_done' } : x))
                          setResponding(null)
                        }}
                        disabled={responding === n.id}
                        style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, letterSpacing: 1, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(255,0,110,0.3)', background: 'rgba(255,0,110,0.06)', color: '#FF006E', cursor: 'pointer' }}
                      >✕</button>
                    </div>
                  )}
                  {n.type === 'friend_request' && n.entity_id && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        onClick={() => respondFriend(n.entity_id!, 'accept', n.id)}
                        disabled={responding === n.id}
                        style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, letterSpacing: 1, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(0,255,136,0.4)', background: 'rgba(0,255,136,0.08)', color: '#00FF88', cursor: 'pointer' }}
                      >
                        {responding === n.id ? '...' : 'ПРИНЯТЬ'}
                      </button>
                      <button
                        onClick={() => respondFriend(n.entity_id!, 'decline', n.id)}
                        disabled={responding === n.id}
                        style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, letterSpacing: 1, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(255,0,110,0.3)', background: 'rgba(255,0,110,0.06)', color: '#FF006E', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <div style={{
                    fontFamily: 'JetBrains Mono,monospace', fontSize: 8,
                    color: '#3A4A5A', marginTop: 3, letterSpacing: 1,
                  }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FFF0', flexShrink: 0, marginTop: 6, boxShadow: '0 0 6px #00FFF0' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
