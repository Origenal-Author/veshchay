export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

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

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: msgs } = await supabase
    .from('messages').select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const convMap = new Map<string, any>()
  const unreadMap = new Map<string, number>()
  for (const m of msgs ?? []) {
    const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
    if (!convMap.has(otherId)) convMap.set(otherId, m)
    if (m.receiver_id === user.id && !m.read) {
      unreadMap.set(m.sender_id, (unreadMap.get(m.sender_id) ?? 0) + 1)
    }
  }

  const otherIds = [...convMap.keys()]
  const { data: profiles } = otherIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url, rank').in('id', otherIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const conversations = otherIds
    .map(id => ({ userId: id, profile: profileMap[id], lastMsg: convMap.get(id), unread: unreadMap.get(id) ?? 0 }))
    .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime())

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href={`/profile/${user.id}`} className="btn-ghost-ui">← ПРОФИЛЬ</Link>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          // ЗАШИФРОВАННЫЕ КАНАЛЫ
        </div>

        {conversations.length === 0 ? (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', textAlign: 'center', padding: '80px 0', letterSpacing: 2 }}>
            // НЕТ АКТИВНЫХ КАНАЛОВ //<br />
            <span style={{ fontSize: 10, opacity: 0.5 }}>Напиши другу с его профиля</span>
          </div>
        ) : conversations.map(c => (
          <Link key={c.userId} href={`/messages/${c.userId}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              background: 'var(--surface)', border: `1px solid ${c.unread > 0 ? 'rgba(0,255,240,0.3)' : 'var(--border)'}`,
              borderRadius: 10, transition: 'border-color 0.2s',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--accent), var(--surface2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 900, color: 'var(--bg)',
              }}>
                {c.profile?.avatar_url
                  ? <img src={c.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (c.profile?.username || '??').slice(0, 2).toUpperCase()
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>
                  @{c.profile?.username || 'аноним'}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMsg.sender_id === user.id ? 'Ты: ' : ''}{c.lastMsg.content}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--subtext)' }}>
                  {timeAgo(c.lastMsg.created_at)}
                </div>
                {c.unread > 0 && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#00FFF0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#000', fontWeight: 700,
                    boxShadow: '0 0 8px rgba(0,255,240,0.5)',
                  }}>{c.unread}</div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </main>
    </div>
  )
}
