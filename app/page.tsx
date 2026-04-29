import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <header className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid rgba(0,255,240,0.15)' }}>
        <h1 className="text-2xl font-bold tracking-widest" style={{ color: '#00FFF0', textShadow: '0 0 15px #00FFF0' }}>
          ВЕЩАЙ
        </h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm tracking-widest" style={{ color: '#FF006E' }}>
                {user.user_metadata?.username || user.email}
              </span>
              <Link href="/videos/upload" className="px-4 py-2 text-xs tracking-widest" style={{ background: '#00FFF0', color: '#0a0a0f', fontWeight: 'bold' }}>
                + ВИДЕО
              </Link>
              <form action={logout}>
                <button type="submit" className="px-4 py-2 text-xs tracking-widest" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#666' }}>
                  ВЫЙТИ
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-4 py-2 text-xs tracking-widest" style={{ border: '1px solid #00FFF0', color: '#00FFF0' }}>
                ВОЙТИ
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-xs tracking-widest" style={{ background: '#FF006E', color: '#fff', fontWeight: 'bold' }}>
                РЕГИСТРАЦИЯ
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Link key={video.id} href={`/videos/${video.id}`} className="group block">
                <div className="relative aspect-video overflow-hidden mb-3" style={{ border: '1px solid rgba(0,255,240,0.15)' }}>
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,255,240,0.1)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,240,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="#0a0a0f" className="w-5 h-5 ml-1">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-medium tracking-wide truncate" style={{ color: '#fff' }}>{video.title}</h3>
                <p className="text-xs mt-1" style={{ color: '#444' }}>{new Date(video.created_at).toLocaleDateString('ru-RU')}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-lg tracking-widest mb-4" style={{ color: '#333' }}>ВИДЕО ПОК А НЕТ</p>
            {user && (
              <Link href="/videos/upload" className="px-6 py-3 text-sm tracking-widest" style={{ border: '1px solid #00FFF0', color: '#00FFF0' }}>
                ДОБАВИТЬ ПЕРВОЕ
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
