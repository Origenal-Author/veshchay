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

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>
        {q && (
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--subtext)' }}>
              Результаты: <span style={{ color: 'var(--accent)' }}>«{q}»</span>
            </span>
            <Link href="/" style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: "'JetBrains Mono', monospace" }}>✕ сбросить</Link>
          </div>
        )}

        {!q && (
          <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <span className="section-title">// АКТИВНЫЕ_СИГНАЛЫ</span>
          </div>
        )}

        {videos && videos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {videos.map((video) => (
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
        ) : (
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
      </main>
    </div>
  )
}
