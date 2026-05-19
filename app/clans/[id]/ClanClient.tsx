'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CLAN_ROLES, type ClanRole } from '@/lib/clans'
import ClanEmblem from '@/app/components/ClanEmblem'

type Member = { role: string; joined_at: string; user: { id: string; username: string | null; avatar_url: string | null; rank: string | null; xp: number } }

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}

const ROLE_ORDER = ['coordinator', 'instructor', 'mediator', 'recruit']

export default function ClanClient({ clan, members, currentUserId, myRole, invitableFriends }: {
  clan: any; members: Member[]; currentUserId: string | null
  myRole: string | null; invitableFriends: any[]
}) {
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const C = clan.emblem_color || '#00FFF0'
  const sorted = [...members].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))

  async function invite(friendId: string) {
    setLoading(friendId)
    await fetch(`/api/clans/${clan.id}/invite`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: friendId }),
    })
    setLoading(null)
    setShowInvite(false)
  }

  async function changeRole(memberId: string, role: string) {
    setLoading(memberId)
    await fetch(`/api/clans/${clan.id}/member`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, role }),
    })
    setLoading(null)
    router.refresh()
  }

  async function kick(memberId: string) {
    setLoading(memberId)
    await fetch(`/api/clans/${clan.id}/member`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    setLoading(null)
    router.refresh()
  }

  async function leave() {
    setLoading('leave')
    const res = await fetch(`/api/clans/${clan.id}`, { method: 'DELETE' })
    const data = await res.json()
    router.push(data.disbanded ? '/' : `/profile/${currentUserId}`)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {currentUserId && <Link href={`/profile/${currentUserId}`} className="btn-ghost-ui">← ПРОФИЛЬ</Link>}
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>

        {/* Шапка клана */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 28, padding: 28, marginBottom: 32,
          background: 'var(--surface)', border: `1px solid rgba(${hexToRgb(C)},0.25)`,
          borderRadius: 14, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C}, transparent)` }} />

          {/* Эмблема */}
          <ClanEmblem symbols={clan.emblem_symbols ?? []} color={C} size={90} />

          {/* Инфо */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C, letterSpacing: 3, marginBottom: 4 }}>
              [{clan.tag}]
            </div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: 1, marginBottom: 6 }}>
              {clan.name}
            </h1>
            {clan.description && (
              <p style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
                {clan.description}
              </p>
            )}
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'var(--subtext)', marginTop: 8, letterSpacing: 1 }}>
              {members.length} / 24 участников
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {myRole && ['coordinator', 'instructor'].includes(myRole) && (
              <button onClick={() => setShowInvite(true)} style={{
                fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2,
                padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid rgba(${hexToRgb(C)},0.4)`,
                background: `rgba(${hexToRgb(C)},0.08)`, color: C,
              }}>+ ЗАВЕРБОВАТЬ</button>
            )}
            {myRole && (
              <button onClick={leave} disabled={loading === 'leave'} style={{
                fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2,
                padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid rgba(255,0,110,0.3)',
                background: 'rgba(255,0,110,0.06)', color: '#FF006E',
              }}>
                {myRole === 'coordinator' ? '☠ РАСПУСТИТЬ' : '← ПОКИНУТЬ'}
              </button>
            )}
          </div>
        </div>

        {/* Список участников */}
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          // СОСТАВ ОРГАНИЗАЦИИ
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map(m => (
            <div key={m.user.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              background: 'var(--surface)', border: `1px solid ${m.role === 'coordinator' ? `rgba(${hexToRgb(C)},0.3)` : 'var(--border)'}`,
              borderRadius: 10,
            }}>
              <Link href={`/profile/${m.user.id}`}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent), var(--surface2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 900, color: 'var(--bg)',
                }}>
                  {m.user.avatar_url
                    ? <img src={m.user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (m.user.username || '??').slice(0, 2).toUpperCase()
                  }
                </div>
              </Link>
              <div style={{ flex: 1 }}>
                <Link href={`/profile/${m.user.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>
                    @{m.user.username || 'аноним'}
                  </div>
                </Link>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: 'var(--subtext)', marginTop: 2 }}>
                  {m.user.rank} · {m.user.xp} XP
                </div>
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono,monospace', fontSize: 8, letterSpacing: 2,
                color: m.role === 'coordinator' ? C : m.role === 'instructor' ? '#FF7B00' : m.role === 'mediator' ? '#C084FC' : 'var(--subtext)',
                border: `1px solid ${m.role === 'coordinator' ? `rgba(${hexToRgb(C)},0.4)` : 'rgba(255,255,255,0.08)'}`,
                padding: '3px 10px', borderRadius: 4,
              }}>
                {CLAN_ROLES[m.role as ClanRole] ?? m.role}
              </div>

              {/* Управление (только для координатора) */}
              {myRole === 'coordinator' && m.user.id !== currentUserId && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {m.role === 'recruit' && (
                    <>
                      <button onClick={() => changeRole(m.user.id, 'instructor')} disabled={!!loading} title="Назначить ИНСТРУКТОРОМ" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,123,0,0.3)', background: 'transparent', color: '#FF7B00', fontSize: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace' }}>И</button>
                      <button onClick={() => changeRole(m.user.id, 'mediator')} disabled={!!loading} title="Назначить ПОСРЕДНИКОМ" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(192,132,252,0.3)', background: 'transparent', color: '#C084FC', fontSize: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace' }}>П</button>
                    </>
                  )}
                  {['instructor', 'mediator'].includes(m.role) && (
                    <button onClick={() => changeRole(m.user.id, 'recruit')} disabled={!!loading} title="Понизить до рекрута" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--subtext)', fontSize: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace' }}>↓</button>
                  )}
                  <button onClick={() => kick(m.user.id)} disabled={!!loading} title="Исключить" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,0,110,0.3)', background: 'transparent', color: '#FF006E', fontSize: 10, cursor: 'pointer' }}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Модалка приглашения */}
        {showInvite && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowInvite(false)}>
            <div style={{ background: 'rgba(6,6,18,0.98)', border: `1px solid rgba(${hexToRgb(C)},0.2)`, borderRadius: 14, padding: 24, width: 320, maxHeight: '70vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 11, letterSpacing: 3, color: C, marginBottom: 16 }}>// ЗАВЕРБОВАТЬ АГЕНТА</div>
              {invitableFriends.length === 0 ? (
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--subtext)', textAlign: 'center', padding: '20px 0' }}>Нет доступных друзей</div>
              ) : invitableFriends.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron,monospace', fontSize: 10, color: 'var(--accent)' }}>
                    {f.avatar_url ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (f.username || '??').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontFamily: 'Orbitron,monospace', fontSize: 10, color: 'var(--text)' }}>@{f.username}</div>
                  <button onClick={() => invite(f.id)} disabled={loading === f.id} style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid rgba(${hexToRgb(C)},0.4)`, background: `rgba(${hexToRgb(C)},0.08)`, color: C, fontFamily: 'JetBrains Mono,monospace', fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
                    {loading === f.id ? '...' : 'ЗВАТЬ'}
                  </button>
                </div>
              ))}
              <button onClick={() => setShowInvite(false)} style={{ width: '100%', marginTop: 12, padding: '8px 0', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--subtext)', borderRadius: 6, cursor: 'pointer' }}>ЗАКРЫТЬ</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
