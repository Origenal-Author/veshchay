import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

const RANKS = [
  { xp: 0, rank: 'НОВОБРАНЕЦ', color: '#8892B0' },
  { xp: 50, rank: 'ОПЕРАТИВНИК', color: '#00FFF0' },
  { xp: 200, rank: 'АГЕНТ', color: '#7AAED4' },
  { xp: 500, rank: 'ПРИЗРАК', color: '#9B10FF' },
  { xp: 1000, rank: 'АРХИТЕКТОР', color: '#FFB300' },
  { xp: 2500, rank: 'ХАКЕР', color: '#FF006E' },
]

function getRankInfo(xp: number) {
  return [...RANKS].reverse().find(r => xp >= r.xp) ?? RANKS[0]
}

function getNextRank(xp: number) {
  return RANKS.find(r => xp < r.xp)
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === id

  const { data: videos } = await supabase.from('videos').select('*').eq('user_id', id).order('created_at', { ascending: false })

  const xp = profile.xp || 0
  const rankInfo = getRankInfo(xp)
  const nextRank = getNextRank(xp)
  const progress = nextRank ? Math.round((xp / nextRank.xp) * 100) : 100

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {isOwner && <Link href="/profile/edit" className="btn-primary-ui">РЕДАКТИРОВАТЬ</Link>}
          <Link href="/" className="btn-ghost-ui">← ГЛАВНАЯ</Link>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px' }}>
        {/* Шапка профиля */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 32, alignItems: 'start', marginBottom: 40, padding: 32, background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${rankInfo.color}, transparent)` }} />

          {/* Аватар */}
          <div style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${rankInfo.color}, var(--surface2))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'var(--bg)', fontFamily: "'Orbitron',monospace", border: `2px solid ${rankInfo.color}`, boxShadow: `0 0 20px ${rankInfo.color}40`, overflow: 'hidden' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profile.username || '??').slice(0, 2).toUpperCase()
            }
          </div>

          {/* Инфо */}
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: rankInfo.color, letterSpacing: 3, marginBottom: 6 }}>// {rankInfo.rank}</div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
              @{profile.username || 'аноним'}
            </h1>
            {profile.bio && <p style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>

          {/* XP */}
          <div style={{ textAlign: 'right', minWidth: 140 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 28, fontWeight: 900, color: rankInfo.color, textShadow: `0 0 20px ${rankInfo.color}` }}>
              {xp}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, marginBottom: 8 }}>XP</div>
            <div style={{ background: 'var(--surface2)', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: rankInfo.color, boxShadow: `0 0 8px ${rankInfo.color}`, transition: 'width 0.5s' }} />
            </div>
            {nextRank && (
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)' }}>
                до {nextRank.rank}: {nextRank.xp - xp} XP
              </div>
            )}
            {!nextRank && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: rankInfo.color }}>MAX RANK ✦</div>}
          </div>
        </div>

        {/* Видео пользователя */}
        {videos && videos.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              // СИГНАЛЫ ПОЛЬЗОВАТЕЛЯ ({videos.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {videos.map(v => (
                <Link key={v.id} href={`/videos/${v.id}`} className="video-card">
                  <div className="video-card-thumb">
                    <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title} />
                    <div className="video-card-play">
                      <div className="play-icon">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor" style={{ color: 'var(--accent)' }} /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="video-card-body">
                    <div className="video-card-title">{v.title}</div>
                    <div className="video-card-date">{new Date(v.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
