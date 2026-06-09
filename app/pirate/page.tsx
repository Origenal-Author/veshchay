import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import SearchBar from '@/app/components/SearchBar'
import NavTabs from '@/app/components/NavTabs'
import OnlineCount from '@/app/components/OnlineCount'
import MobileMenu from '@/app/components/MobileMenu'
import LogoutButton from '@/app/components/LogoutButton'

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 30) return `${Math.floor(d / 30)} МЕС.`
  if (d > 0) return `${d} ДН.`
  if (h > 0) return `${h} ЧАС.`
  return 'ТОЛЬКО ЧТО'
}

const TAG_LABELS: Record<string, string> = {
  secret: '#СЕКРЕТНЫЙ_ФАЙЛ', sharp: '#ОСТРЫЙ_МАТЕРИАЛ',
  agent: '#ВЕЩАНИЕ_ИНОАГЕНТА', intercepted: '#ПЕРЕХВАЧЕННЫЙ_СИГНАЛ',
  noise: '#ПОМЕХИ_В_ЭФИРЕ',
}
const GENRE_LABELS: Record<string, string> = {
  music: 'МУЗЫКА', film: 'КИНО', games: 'ИГРЫ',
  streams: 'СТРИМЫ', podcasts: 'ПОДКАСТЫ', anime: 'АНИМЕ',
}
function getVideoTag(v: { content_tag?: string; category?: string }) {
  return TAG_LABELS[v.content_tag ?? ''] ?? TAG_LABELS[v.category ?? ''] ?? ''
}
function getVideoGenre(v: { genre?: string; category?: string }) {
  return GENRE_LABELS[v.genre ?? ''] ?? GENRE_LABELS[v.category ?? ''] ?? ''
}

export default async function Pirate({ searchParams }: { searchParams: Promise<{ q?: string; genre?: string }> }) {
  const { q, genre } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('videos')
    .select('*')
    .eq('video_type', 'youtube')
    .order('created_at', { ascending: false })
    .limit(40)
  if (q) query = query.ilike('title', `%${q}%`)
  if (genre) query = query.eq('genre', genre)
  const { data: videos } = await query

  const userIds = [...new Set((videos || []).map(v => v.user_id))]
  const { data: profilesData } = userIds.length
    ? await supabase.from('profiles').select('id, username').in('id', userIds)
    : { data: [] }
  const profileMap: Record<string, string> = Object.fromEntries((profilesData || []).map(p => [p.id, p.username || 'аноним']))

  const list = videos || []

  return (
    <div style={{ position: 'relative', zIndex: 2, paddingBottom: 80 }}>
      <div className="pir-scan" />

      {/* ШАПКА */}
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <Suspense><SearchBar /></Suspense>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {user ? (
            <>
              <span className="hide-mobile" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--accent2)', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.username || 'аноним'}
              </span>
              <Link href="/videos/upload" className="btn-primary-ui">+ ВИДЕО</Link>
              <Link href="/leaderboard" className="btn-ghost-ui hide-mobile">ТОП</Link>
              <Link href="/game" className="btn-ghost-ui hide-mobile">ПАРАЗИТЫ</Link>
              <Link href={`/profile/${user.id}`} className="btn-ghost-ui">ПРОФИЛЬ</Link>
              <span className="hide-mobile"><LogoutButton action={logout} className="btn-ghost-ui" /></span>
              <MobileMenu userId={user.id} />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost-ui hide-mobile">ВОЙТИ</Link>
              <Link href="/auth/register" className="btn-primary-ui hide-mobile">РЕГИСТРАЦИЯ</Link>
              <MobileMenu userId={null} />
            </>
          )}
        </div>
      </header>

      {/* ТАБЫ */}
      <NavTabs />

      {/* БАННЕР ПЕРЕХВАТА */}
      <div className="pir-banner">
        <div className="pir-radar" />
        <div>
          <h1 className="pir-title">ПИРАТСКИЙ <span className="g">СИГНАЛ</span></h1>
          <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', letterSpacing: 1 }}>
            // чужой эфир, пойманный из сети · <span style={{ color: 'var(--pirate)' }}>источник: YOUTUBE</span> · смотри без алгоритмов
          </p>
        </div>
      </div>

      {/* СТАТУС-СТРОКА */}
      <div style={{ background: 'rgba(255,45,85,0.04)', borderBottom: '1px solid rgba(255,45,85,0.1)', padding: '6px 32px', display: 'flex', alignItems: 'center', gap: 24, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,45,85,0.6)', position: 'relative', zIndex: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pirate)', boxShadow: '0 0 6px var(--pirate)' }} className="pir-blink" />
          ПЕРЕХВАЧЕНО: {list.length}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ОНЛАЙН: <Suspense fallback="..."><OnlineCount userId={user?.id ?? null} /></Suspense>
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)', opacity: 0.6 }}>// ДЕКОДЕР АКТИВЕН</span>
      </div>

      {/* СЕТКА */}
      <div className="mobile-pad" style={{ padding: '24px 32px 40px', position: 'relative', zIndex: 2 }}>
        {q && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)' }}>
              Перехват по запросу: <span style={{ color: 'var(--pirate)' }}>«{q}»</span>
            </span>
            <Link href="/pirate" style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: "'JetBrains Mono',monospace" }}>✕ сбросить</Link>
          </div>
        )}

        {list.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <span className="section-title" style={{ color: 'var(--pirate)', textShadow: '0 0 10px var(--pirate-glow)' }}>// ПОЙМАННЫЕ_ЧАСТОТЫ</span>
            </div>
            <div className="video-grid">
              {list.map(video => (
                <Link key={video.id} href={`/videos/${video.id}`} className="video-card pir-card">
                  <div className="video-card-thumb">
                    <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} />
                    <div className="pir-thumb-lines" />
                    <div className="pir-badge"><span className="d" />📡 ПЕРЕХВАЧЕНО</div>
                    <div className="pir-yt">YT</div>
                    <div className="video-card-play">
                      <div className="play-icon">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor" style={{ color: 'var(--pirate)' }}/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="video-card-body">
                    {(getVideoTag(video) || getVideoGenre(video)) && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        {getVideoTag(video) && (
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'var(--accent2)', letterSpacing: 1, opacity: 0.85 }}>
                            {getVideoTag(video)}
                          </span>
                        )}
                        {getVideoGenre(video) && (
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'var(--subtext)', letterSpacing: 1, opacity: 0.6 }}>
                            {getVideoTag(video) ? '·' : ''} {getVideoGenre(video)}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="video-card-title">{video.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg,var(--pirate),var(--subtext))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--bg)', fontFamily: "'Orbitron',monospace", flexShrink: 0 }}>
                        {(profileMap[video.user_id] || '??').slice(0, 2).toUpperCase()}
                      </div>
                      <Link href={`/profile/${video.user_id}`} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', textDecoration: 'none' }}>
                        @{profileMap[video.user_id] || 'аноним'}
                      </Link>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--pirate)', opacity: 0.8 }}>▶ ДЕКОДИРОВАТЬ</span>
                      <span>//</span>
                      <span>{timeAgo(video.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, letterSpacing: 3, color: 'var(--subtext)', marginBottom: 8 }}>ЭФИР ЧИСТ</p>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', opacity: 0.6, marginBottom: 24 }}>
              {q ? '// по запросу ничего не перехвачено' : '// ни одного перехваченного сигнала'}
            </p>
            {user && <Link href="/videos/upload" className="btn-primary-ui">ПЕРЕХВАТИТЬ С YOUTUBE →</Link>}
          </div>
        )}
      </div>
    </div>
  )
}
