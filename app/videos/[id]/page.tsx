import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (!video) notFound()

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <header className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid rgba(0,255,240,0.15)' }}>
        <Link href="/" className="text-2xl font-bold tracking-widest" style={{ color: '#00FFF0', textShadow: '0 0 15px #00FFF0' }}>
          ВЕЩАЙ
        </Link>
        <Link href="/videos/upload" className="px-4 py-2 text-xs tracking-widest" style={{ border: '1px solid #00FFF0', color: '#00FFF0' }}>
          + ВИДЕО
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="w-full aspect-video mb-6" style={{ border: '1px solid rgba(0,255,240,0.2)' }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <h1 className="text-2xl font-bold tracking-wide mb-3" style={{ color: '#fff' }}>
          {video.title}
        </h1>
        {video.description && (
          <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
            {video.description}
          </p>
        )}
        <p className="text-xs mt-4" style={{ color: '#444' }}>
          {new Date(video.created_at).toLocaleDateString('ru-RU')}
        </p>
      </main>
    </div>
  )
}
