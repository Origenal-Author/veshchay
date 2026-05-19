export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

const CATEGORY_LABELS: Record<string, string> = {
  secret: '#СЕКРЕТНЫЙ_ФАЙЛ', sharp: '#ОСТРЫЙ_МАТЕРИАЛ',
  agent: '#ВЕЩАНИЕ_ИНОАГЕНТА', intercepted: '#ПЕРЕХВАЧЕННЫЙ_СИГНАЛ',
  noise: '#ПОМЕХИ_В_ЭФИРЕ', music: 'МУЗЫКА', games: 'ИГРЫ',
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: views } = await supabase
    .from('views')
    .select('id, created_at, video_id, video:videos(id, title, youtube_id, storage_path, views_count, category, user_id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  // Дедупликация — только последний просмотр каждого видео
  const seen = new Set<string>()
  const history = (views ?? []).filter(v => {
    if (!v.video || seen.has(v.video_id)) return false
    seen.add(v.video_id)
    return true
  })

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link href={`/profile/${user.id}`} className="btn-ghost-ui">← ПРОФИЛЬ</Link>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          // ИСТОРИЯ ПРОСМОТРОВ ({history.length})
        </div>

        {history.length === 0 ? (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--subtext)', textAlign: 'center', padding: '80px 0', letterSpacing: 2 }}>
            // СИГНАЛЫ НЕ ОБНАРУЖЕНЫ
          </div>
        ) : (
          <div className="video-grid">
            {history.map(v => {
              const video = v.video as any
              const thumb = video.youtube_id
                ? `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`
                : null
              const watchedAt = new Date(v.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
              const cat = video.category && video.category !== 'general' ? CATEGORY_LABELS[video.category] : null

              return (
                <Link key={v.id} href={`/videos/${video.id}`} className="video-card" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a0a0a', overflow: 'hidden' }}>
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron',monospace", fontSize: 11, color: 'var(--accent)', letterSpacing: 2, background: 'var(--surface)' }}>
                        LOCAL FILE
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 6, right: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--accent)', background: 'rgba(0,0,0,0.75)', padding: '2px 6px', letterSpacing: 1 }}>
                      {watchedAt}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    {cat && (
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--accent2)', letterSpacing: 2, marginBottom: 4 }}>
                        {cat}
                      </div>
                    )}
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: 0.5, lineHeight: 1.3, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {video.title}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 1 }}>
                      {video.views_count ?? 0} просмотров
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
