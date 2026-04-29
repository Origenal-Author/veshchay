import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: video } = await supabase.from('videos').select('*').eq('id', id).single()
  if (!video) notFound()

  return (
    <div style={{ position: 'relative', zIndex: 2, paddingBottom: 80 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/videos/upload" className="btn-primary-ui">+ ВИДЕО</Link>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', marginBottom: 24, border: '1px solid var(--border)', boxShadow: '0 0 40px var(--accent-glow)' }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            style={{ width: '100%', height: '100%' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 20, marginBottom: 16 }}>
          <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: 1 }}>
            {video.title}
          </h1>
          {video.description && (
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6 }}>{video.description}</p>
          )}
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--subtext)' }}>
          // {new Date(video.created_at).toLocaleDateString('ru-RU')}
        </p>

        <div style={{ marginTop: 32 }}>
          <Link href="/" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--accent)' }}>← все видео</Link>
        </div>
      </main>
    </div>
  )
}
