import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import Reactions from '@/app/components/Reactions'
import Echoes from '@/app/components/Echoes'
import ViewTracker from '@/app/components/ViewTracker'
import AddToPlaylist from '@/app/components/AddToPlaylist'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: video } = await supabase.from('videos').select('*').eq('id', id).single()
  if (!video) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const CATEGORY_LABELS: Record<string, string> = {
    secret: '#СЕКРЕТНЫЙ_ФАЙЛ', sharp: '#ОСТРЫЙ_МАТЕРИАЛ',
    agent: '#ВЕЩАНИЕ_ИНОАГЕНТА', intercepted: '#ПЕРЕХВАЧЕННЫЙ_СИГНАЛ',
    noise: '#ПОМЕХИ_В_ЭФИРЕ', music: 'МУЗЫКА', games: 'ИГРЫ',
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {user && <Link href="/videos/upload" className="btn-primary-ui">+ ВИДЕО</Link>}
          {user && <Link href={`/profile/${user.id}`} className="btn-ghost-ui">ПРОФИЛЬ</Link>}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px' }}>
        {/* Плеер */}
        <div style={{ width: '100%', aspectRatio: '16/9', marginBottom: 24, border: '1px solid var(--border)', boxShadow: '0 0 40px var(--accent-glow)' }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            style={{ width: '100%', height: '100%' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Заголовок */}
        <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 20, marginBottom: 16 }}>
          {video.category && video.category !== 'general' && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 6 }}>
              {CATEGORY_LABELS[video.category] || video.category}
            </div>
          )}
          <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: 1 }}>
            {video.title}
          </h1>
          {video.description && (
            <p style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6 }}>{video.description}</p>
          )}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', marginBottom: 20 }}>
          // {new Date(video.created_at).toLocaleDateString('ru-RU')}
          {video.views_count > 0 && <span> · {video.views_count} просмотров</span>}
        </div>

        {/* Реакции и плейлист */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <Reactions videoId={video.id} userId={user?.id ?? null} />
          {user && <AddToPlaylist videoId={video.id} userId={user.id} />}
          {user && <Link href="/playlists" className="btn-ghost-ui" style={{ fontSize: 10, padding: '8px 14px' }}>МОИ ПЛЕЙЛИСТЫ</Link>}
        </div>

        {/* Трекер просмотров (XP) */}
        {user && <ViewTracker videoId={video.id} userId={user.id} />}

        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--accent)' }}>← все видео</Link>
        </div>

        {/* Отклики */}
        <Echoes videoId={video.id} userId={user?.id ?? null} />
      </main>
    </div>
  )
}
