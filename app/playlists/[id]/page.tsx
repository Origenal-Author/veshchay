import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: playlist } = await supabase.from('playlists').select('*, playlist_videos(*, videos(*))').eq('id', id).single()
  if (!playlist) notFound()

  const videos = (playlist.playlist_videos || []).map((pv: any) => pv.videos).filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/playlists" className="btn-ghost-ui">← ПЛЕЙЛИСТЫ</Link>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// ПЛЕЙЛИСТ</div>
          <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>{playlist.title}</h1>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', marginTop: 8 }}>{videos.length} видео</div>
        </div>

        {videos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {videos.map((v: any) => (
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
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', padding: '40px 0', textAlign: 'center' }}>
            // плейлист пуст — добавь видео с кнопки на странице видео
          </div>
        )}
      </main>
    </div>
  )
}
