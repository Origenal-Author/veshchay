import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import Reactions from '@/app/components/Reactions'
import Echoes from '@/app/components/Echoes'
import ViewTracker from '@/app/components/ViewTracker'
import AddToPlaylist from '@/app/components/AddToPlaylist'
import VideoPlayer from '@/app/components/VideoPlayer'
import VerifiedBadge from '@/app/components/VerifiedBadge'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: video } = await supabase.from('videos').select('*').eq('id', id).single()
  if (!video) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: author } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, xp, rank, verified')
    .eq('id', video.user_id)
    .single()

  const { count: authorVideoCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', video.user_id)

  const { count: authorFollowers } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', video.user_id)

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

      <main className="mobile-pad" style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px' }}>
        {/* Плеер */}
        <div style={{ width: '100%', aspectRatio: '16/9', marginBottom: 24, border: '1px solid var(--border)', boxShadow: '0 0 40px var(--accent-glow)', background: '#000', overflow: 'hidden' }}>
          {video.storage_path ? (
            <VideoPlayer
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.storage_path}`}
            />
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0`}
              style={{ width: '100%', height: '100%' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
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

        {/* Карточка канала */}
        {author && (
          <Link href={`/profile/${author.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              transition: 'border-color 0.2s',
            }}>
              {/* Аватар */}
              <div style={{
                width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), var(--surface2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: 'var(--bg)',
                fontFamily: "'Orbitron',monospace", overflow: 'hidden',
                border: '1.5px solid var(--accent)',
              }}>
                {author.avatar_url
                  ? <img src={author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (author.username || '??').slice(0, 2).toUpperCase()
                }
              </div>

              {/* Инфо */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>@{author.username || 'аноним'}</span>
                  {author.verified && <VerifiedBadge size={14} />}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--accent)', letterSpacing: 2, marginTop: 3 }}>
                  {author.rank || 'СТАТИЧЕСКИЙ ШУМ'}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--subtext)', marginTop: 4, letterSpacing: 1 }}>
                  {authorVideoCount ?? 0} видео · {authorFollowers ?? 0} наблюдают
                </div>
              </div>

              {/* Стрелка */}
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)', letterSpacing: 2, flexShrink: 0 }}>
                КАНАЛ →
              </div>
            </div>
          </Link>
        )}

        {/* Реакции и плейлист */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <Reactions videoId={video.id} userId={user?.id ?? null} videoOwnerId={video.user_id} />
          {user && <AddToPlaylist videoId={video.id} userId={user.id} />}
          {user && <Link href="/playlists" className="btn-ghost-ui" style={{ fontSize: 10, padding: '8px 14px' }}>МОИ ПЛЕЙЛИСТЫ</Link>}
        </div>

        {/* Трекер просмотров (XP) */}
        {user && <ViewTracker videoId={video.id} userId={user.id} />}

        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--accent)' }}>← все видео</Link>
        </div>

        {/* Отклики */}
        <Echoes videoId={video.id} userId={user?.id ?? null} videoOwnerId={video.user_id} videoTitle={video.title} />
      </main>
    </div>
  )
}
