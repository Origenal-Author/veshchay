import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

const RANKS = [
  { xp: 0,     rank: 'СТАТИЧЕСКИЙ ШУМ', color: '#8892B0' },
  { xp: 75,    rank: 'ПИНГ',            color: '#64B5F6' },
  { xp: 200,   rank: 'ОПЕРАТИВНИК',     color: '#00FFF0' },
  { xp: 500,   rank: 'ВЗЛОМЩИК',        color: '#00FF88' },
  { xp: 1000,  rank: 'АГЕНТ',           color: '#7AAED4' },
  { xp: 2000,  rank: 'ПРИЗРАК',         color: '#9B10FF' },
  { xp: 4000,  rank: 'НЕЙРОМАНТ',       color: '#FFB300' },
  { xp: 7500,  rank: 'ТЕНЕВОЙ АРХИТЕКТ',color: '#FF7B00' },
  { xp: 15000, rank: 'СИСТЕМНЫЙ БОГ',   color: '#FF006E' },
  { xp: 30000, rank: 'РУТОВЫЙ ДОСТУП',  color: '#FFFFFF' },
]

const SPECIAL_ROLES: Record<string, { label: string; color: string; badge: string; glow: string }> = {
  creator: { label: 'ПЕРВОСИГНАЛ',   color: '#FFD700', badge: '⚡', glow: 'rgba(255,215,0,0.3)' },
  admin:   { label: 'КУРАТОР ЭФИРА', color: '#C084FC', badge: '◈', glow: 'rgba(192,132,252,0.25)' },
}

function getRankInfo(xp: number) {
  return [...RANKS].reverse().find(r => xp >= r.xp) ?? RANKS[0]
}

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`
}

const MEDALS = ['🥇', '🥈', '🥉']

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: top } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, xp, role')
    .order('xp', { ascending: false })
    .limit(20)

  const profiles = top ?? []

  // Отделяем спецпользователей от обычного рейтинга
  const specials = profiles.filter(p => SPECIAL_ROLES[p.role ?? ''])
  const regular  = profiles.filter(p => !SPECIAL_ROLES[p.role ?? ''])

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {user && <Link href={`/profile/${user.id}`} className="btn-ghost-ui">ПРОФИЛЬ</Link>}
          <Link href="/" className="btn-ghost-ui">← ГЛАВНАЯ</Link>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>
            // РЕЙТИНГ
          </div>
          <h1 style={{ fontFamily: 'Orbitron,monospace', fontSize: 26, fontWeight: 900, letterSpacing: 4, color: 'var(--accent)', textShadow: '0 0 20px var(--accent-glow)' }}>
            ТОП АГЕНТОВ
          </h1>
        </div>

        {/* Секция: Архитекторы сети (создатели и админы) */}
        {specials.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 3, marginBottom: 10 }}>
              // АРХИТЕКТОРЫ СЕТИ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {specials.map(profile => {
                const role = SPECIAL_ROLES[profile.role ?? '']!
                const xp = profile.xp ?? 0
                const isCurrentUser = user?.id === profile.id
                return (
                  <Link key={profile.id} href={`/profile/${profile.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '48px 48px 1fr auto',
                      alignItems: 'center', gap: 16, padding: '16px 20px',
                      background: `rgba(${hexToRgb(role.color)},0.06)`,
                      border: `1px solid rgba(${hexToRgb(role.color)},0.35)`,
                      borderRadius: 10, position: 'relative', overflow: 'hidden',
                      boxShadow: `0 0 20px ${role.glow}`,
                    }}>
                      {/* Полоска слева */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: role.color, boxShadow: `0 0 10px ${role.color}` }} />

                      {/* Значок */}
                      <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, fontWeight: 900, color: role.color, textAlign: 'center', textShadow: `0 0 10px ${role.color}` }}>
                        {role.badge}
                      </div>

                      {/* Аватар */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
                        background: `linear-gradient(135deg, ${role.color}, rgba(13,13,26,0.8))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 900, color: 'var(--bg)', fontFamily: 'Orbitron,monospace',
                        border: `1.5px solid ${role.color}`,
                      }}>
                        {profile.avatar_url
                          ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (profile.username || '??').slice(0, 2).toUpperCase()
                        }
                      </div>

                      {/* Имя + роль */}
                      <div>
                        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 13, fontWeight: 700, color: role.color, letterSpacing: 1 }}>
                          @{profile.username || 'аноним'}
                          {isCurrentUser && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: role.color, marginLeft: 8, letterSpacing: 2 }}>// ТЫ</span>}
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: role.color, letterSpacing: 3, marginTop: 3, opacity: 0.8 }}>
                          {role.badge} {role.label}
                        </div>
                      </div>

                      {/* XP */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 20, fontWeight: 900, color: role.color, textShadow: `0 0 12px ${role.color}` }}>
                          {xp.toLocaleString('ru-RU')}
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#3A4A5A', letterSpacing: 2 }}>XP</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Обычный рейтинг */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {regular.map((profile, i) => {
            const xp = profile.xp ?? 0
            const rankInfo = getRankInfo(xp)
            const isCurrentUser = user?.id === profile.id
            const isTop3 = i < 3

            return (
              <Link key={profile.id} href={`/profile/${profile.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '48px 48px 1fr auto',
                  alignItems: 'center', gap: 16, padding: '14px 20px',
                  background: isCurrentUser ? `rgba(${hexToRgb(rankInfo.color)},0.08)` : isTop3 ? 'rgba(255,255,255,0.03)' : 'rgba(13,13,26,0.6)',
                  border: `1px solid ${isCurrentUser ? rankInfo.color : isTop3 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: 10, position: 'relative', overflow: 'hidden',
                }}>
                  {isTop3 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: rankInfo.color, boxShadow: `0 0 8px ${rankInfo.color}` }} />}

                  <div style={{ fontFamily: 'Orbitron,monospace', fontSize: isTop3 ? 18 : 13, fontWeight: 900, color: isTop3 ? rankInfo.color : '#3A4A5A', textAlign: 'center' }}>
                    {isTop3 ? MEDALS[i] : `#${i + 1}`}
                  </div>

                  <div style={{
                    width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
                    background: `linear-gradient(135deg, ${rankInfo.color}, rgba(13,13,26,0.8))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900, color: 'var(--bg)', fontFamily: 'Orbitron,monospace',
                    border: `1.5px solid ${isTop3 ? rankInfo.color : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (profile.username || '??').slice(0, 2).toUpperCase()
                    }
                  </div>

                  <div>
                    <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 13, fontWeight: 700, color: isCurrentUser ? rankInfo.color : 'var(--text)', letterSpacing: 1 }}>
                      @{profile.username || 'аноним'}
                      {isCurrentUser && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: rankInfo.color, marginLeft: 8, letterSpacing: 2 }}>// ТЫ</span>}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: rankInfo.color, letterSpacing: 2, marginTop: 3 }}>
                      {rankInfo.rank}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Orbitron,monospace', fontSize: isTop3 ? 20 : 16, fontWeight: 900, color: rankInfo.color, textShadow: isTop3 ? `0 0 12px ${rankInfo.color}` : 'none' }}>
                      {xp.toLocaleString('ru-RU')}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#3A4A5A', letterSpacing: 2 }}>XP</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
