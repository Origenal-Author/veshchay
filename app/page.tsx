import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import SearchBar from '@/app/components/SearchBar'

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(40)
  if (q) query = query.ilike('title', `%${q}%`)
  const { data: videos } = await query

  const featured = !q && videos && videos.length > 0 ? videos[0] : null
  const rest = featured ? videos!.slice(1) : (videos || [])

  return (
    <div style={{ position: 'relative', zIndex: 2, paddingBottom: 80 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <Suspense>
          <SearchBar />
        </Suspense>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {user ? (
            <>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--accent2)', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.username || user.email}
              </span>
              <Link href="/videos/upload" className="btn-primary-ui">+ ВИДЕО</Link>
              <form action={logout}>
                <button type="submit" className="btn-ghost-ui">ВЫЙТИ</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost-ui">ВОЙТИ</Link>
              <Link href="/auth/register" className="btn-primary-ui">РЕГИСТРАЦИЯ</Link>
            </>
          )}
        </div>
      </header>

      {/* HERO */}
      {featured && (
        <Link href={`/videos/${featured.id}`} style={{ display: 'block', margin: '24px 32px', height: 320, border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', cursor: 'pointer', textDecoration: 'none', transition: 'border-color 0.3s' }} className="hero-banner">
          {/* Превью справа */}
          <div style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '100%', overflow: 'hidden' }}>
            <img
              src={`https://img.youtube.com/vi/${featured.youtube_id}/maxresdefault.jpg`}
              alt={featured.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
            />
            {/* Сетка */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Кнопка play */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 72, height: 72, border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--accent-glow)', background: 'rgba(0,0,0,0.4)' }}>
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path d="M8 5.14v14l11-7-11-7z" fill="currentColor" style={{ color: 'var(--accent)' }} />
                </svg>
              </div>
            </div>
          </div>

          {/* Градиент-оверлей */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--bg) 30%, transparent 70%)' }} />

          {/* Текст слева снизу */}
          <div style={{ position: 'absolute', left: 32, bottom: 32, zIndex: 2 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 0 10px var(--accent2)', marginBottom: 10 }}>
              // СИГНАЛ_ВЫБОР_РЕДАКЦИИ
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 700, lineHeight: 1.3, maxWidth: 380, marginBottom: 16, color: 'var(--text)' }}>
              {featured.title.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--subtext)', display: 'flex', gap: 16 }}>
              <span>▶ СМОТРЕТЬ</span>
              <span>//</span>
              <span>{new Date(featured.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        </Link>
      )}

      <div style={{ padding: '0 32px 100px', position: 'relative', zIndex: 2 }}>
        {/* Заголовок секции */}
        {!q && rest.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <span className="section-title">// АКТИВНЫЕ_СИГНАЛЫ</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 1 }}>
              {videos?.length} ВИДЕО
            </span>
          </div>
        )}

        {q && (
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--subtext)' }}>
              Результаты: <span style={{ color: 'var(--accent)' }}>«{q}»</span>
            </span>
            <Link href="/" style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: "'JetBrains Mono', monospace" }}>✕ сбросить</Link>
          </div>
        )}

        {rest.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {rest.map((video) => (
              <Link key={video.id} href={`/videos/${video.id}`} className="video-card">
                <div className="video-card-thumb">
                  <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} />
                  <div className="video-card-play">
                    <div className="play-icon">
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M8 5.14v14l11-7-11-7z" fill="currentColor" style={{ color: 'var(--accent)' }} />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="video-card-body">
                  <div className="video-card-title">{video.title}</div>
                  <div className="video-card-date">{new Date(video.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : !featured && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', textAlign: 'center' }}>
            {q ? (
              <>
                <p style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3, color: 'var(--subtext)', marginBottom: 16 }}>НИЧЕГО НЕ НАЙДЕНО</p>
                <Link href="/" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--accent)' }}>← все видео</Link>
              </>
            ) : (
              <>
                <p style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3, color: 'var(--subtext)', marginBottom: 24 }}>СИГНАЛ ПУСТ</p>
                {user && <Link href="/videos/upload" className="btn-primary-ui">ДОБАВИТЬ ПЕРВОЕ</Link>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
