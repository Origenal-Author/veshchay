import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import SearchBar from '@/app/components/SearchBar'
import NavTabs from '@/app/components/NavTabs'
import OnlineCount from '@/app/components/OnlineCount'

function getInitials(title: string) {
  return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 30) return `${Math.floor(d / 30)} МЕС.`
  if (d > 0) return `${d} ДН.`
  if (h > 0) return `${h} ЧАС.`
  return 'ТОЛЬКО ЧТО'
}

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string, cat?: string }> }) {
  const { q, cat } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(40)
  if (q) query = query.ilike('title', `%${q}%`)
  if (cat) query = query.eq('category', cat)
  const { data: videos } = await query

  const featured = !q && videos && videos.length > 0 ? videos[0] : null
  const rest = featured ? videos!.slice(1) : (videos || [])

  return (
    <div style={{ position: 'relative', zIndex: 2, paddingBottom: 80 }}>

      {/* ШАПКА */}
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <Suspense><SearchBar /></Suspense>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {user ? (
            <>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--accent2)', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.username || user.email}
              </span>
              <Link href="/videos/upload" className="btn-primary-ui">+ ВИДЕО</Link>
              <Link href={`/profile/${user.id}`} className="btn-ghost-ui">ПРОФИЛЬ</Link>
              <form action={logout}><button type="submit" className="btn-ghost-ui">ВЫЙТИ</button></form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost-ui">ВОЙТИ</Link>
              <Link href="/auth/register" className="btn-primary-ui">РЕГИСТРАЦИЯ</Link>
            </>
          )}
        </div>
      </header>

      {/* ТАБЫ */}
      <NavTabs />

      {/* СТАТУС-СТРОКА */}
      <div style={{ background: 'rgba(0,255,240,0.04)', borderBottom: '1px solid rgba(0,255,240,0.08)', padding: '6px 32px', display: 'flex', alignItems: 'center', gap: 24, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(0,255,240,0.5)', position: 'relative', zIndex: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="status-dot" />ОНЛАЙН: <Suspense fallback="..."><OnlineCount userId={user?.id ?? null} /></Suspense>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="status-dot red" />ВИДЕО: {videos?.length || 0}
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)', opacity: 0.7 }}>
          // ВЕЩАЙ · СИГНАЛ АКТИВЕН
        </span>
      </div>

      {/* HERO */}
      {featured && (
        <Link href={`/videos/${featured.id}`} className="hero-banner" style={{ display: 'block', margin: '24px 32px', height: 360, border: '1px solid rgba(0,255,240,0.2)', position: 'relative', overflow: 'hidden', cursor: 'pointer', textDecoration: 'none' }}>
          {/* Фон справа с картинкой */}
          <div style={{ position: 'absolute', right: 0, top: 0, width: '65%', height: '100%' }}>
            <img src={`https://img.youtube.com/vi/${featured.youtube_id}/maxresdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,240,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,240,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 80, height: 80, border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--accent-glow)', background: 'rgba(0,0,0,0.4)' }}>
                <svg viewBox="0 0 24 24" fill="none" width="26" height="26"><path d="M8 5.14v14l11-7-11-7z" fill="#00FFF0"/></svg>
              </div>
            </div>
          </div>
          {/* Градиент-оверлей */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,6,18,0.97) 30%,transparent 72%)' }} />
          {/* Текст */}
          <div style={{ position: 'absolute', left: 32, bottom: 32, zIndex: 2 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 0 10px rgba(255,0,110,0.6)', marginBottom: 10 }}>
              // СИГНАЛ_ВЫБОР_РЕДАКЦИИ
            </div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 700, lineHeight: 1.3, maxWidth: 420, marginBottom: 16, color: 'var(--text)', textShadow: '0 0 30px rgba(0,255,240,0.2)' }}>
              {featured.title.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', display: 'flex', gap: 20 }}>
              <span>▶ СМОТРЕТЬ</span>
              <span>//</span>
              <span>📅 {timeAgo(featured.created_at)}</span>
            </div>
          </div>
        </Link>
      )}

      {/* СЕТКА ВИДЕО */}
      <div style={{ padding: '0 32px 40px', position: 'relative', zIndex: 2 }}>
        {q && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)' }}>
              Результаты: <span style={{ color: 'var(--accent)' }}>«{q}»</span>
            </span>
            <Link href="/" style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: "'JetBrains Mono',monospace" }}>✕ сбросить</Link>
          </div>
        )}

        {rest.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <span className="section-title">// АКТИВНЫЕ_СИГНАЛЫ</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 1 }}>СМОТРЕТЬ ВСЕ [→]</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {rest.map((video) => (
                <Link key={video.id} href={`/videos/${video.id}`} className="video-card">
                  <div className="video-card-thumb">
                    <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} />
                    <div className="video-card-play">
                      <div className="play-icon">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor" style={{ color: 'var(--accent)' }}/></svg>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(6,6,18,0.9)', color: 'var(--accent)', fontSize: 10, fontFamily: "'JetBrains Mono',monospace", padding: '2px 6px', border: '1px solid rgba(0,255,240,0.2)' }}>▶</div>
                  </div>
                  <div className="video-card-body">
                    <div className="video-card-title">{video.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg,var(--accent),var(--subtext))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--bg)', fontFamily: "'Orbitron',monospace", flexShrink: 0 }}>
                        {getInitials(video.title)}
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)' }}>@вещай</span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--accent)', opacity: 0.7 }}>▶ СМОТРЕТЬ</span>
                      <span>//</span>
                      <span>{timeAgo(video.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {rest.length === 0 && !featured && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, letterSpacing: 3, color: 'var(--subtext)', marginBottom: 24 }}>СИГНАЛ ПУСТ</p>
            {user && <Link href="/videos/upload" className="btn-primary-ui">ДОБАВИТЬ ПЕРВОЕ</Link>}
          </div>
        )}
      </div>

      {/* ПРОМО БАННЕР */}
      <div style={{ margin: '0 32px 40px', padding: '20px 28px', background: 'var(--surface)', border: '1px solid rgba(0,255,240,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg,var(--accent),var(--accent2))', boxShadow: '0 0 10px var(--accent)' }} />
        <div style={{ paddingLeft: 8 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 15, fontWeight: 700, letterSpacing: 2, marginBottom: 6, color: 'var(--accent)', textShadow: '0 0 15px rgba(0,255,240,0.4)' }}>ПЕРЕДАЙ СИГНАЛ</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)' }}>// Загружай видео. Без цензуры. Без алгоритмов. Только сигнал.</div>
        </div>
        <Link href={user ? '/videos/upload' : '/auth/register'} className="btn-primary-ui" style={{ fontSize: 11, padding: '10px 24px' }}>
          НАЧАТЬ →
        </Link>
      </div>

    </div>
  )
}
