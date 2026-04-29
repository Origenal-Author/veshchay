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
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <header style={{ borderBottom: '1px solid rgba(0,255,240,0.15)', background: 'rgba(10,10,15,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold tracking-widest shrink-0" style={{ color: '#00FFF0', textShadow: '0 0 15px #00FFF0' }}>
            ВЕЩАЙ
          </Link>

          <div className="flex-1">
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <Link href="/videos/upload" className="px-4 py-2 text-xs font-bold tracking-widest" style={{ background: '#00FFF0', color: '#0a0a0f' }}>
                  + ВИДЕО
                </Link>
                <span className="text-xs tracking-widest hidden sm:block" style={{ color: '#FF006E' }}>
                  {user.user_metadata?.username || user.email}
                </span>
                <form action={logout}>
                  <button type="submit" className="px-3 py-2 text-xs tracking-widest" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#555' }}>
                    ВЫЙТИ
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 text-xs tracking-widest" style={{ border: '1px solid #00FFF0', color: '#00FFF0' }}>
                  ВОЙТИ
                </Link>
                <Link href="/auth/register" className="px-4 py-2 text-xs font-bold tracking-widest" style={{ background: '#FF006E', color: '#fff' }}>
                  РЕГИСТРАЦИЯ
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {q && (
          <div className="mb-6 flex items-center gap-3">
            <p className="text-sm tracking-widest" style={{ color: '#666' }}>
              Результаты по: <span style={{ color: '#00FFF0' }}>«{q}»</span>
            </p>
            <Link href="/" className="text-xs" style={{ color: '#FF006E' }}>✕ сбросить</Link>
          </div>
        )}

        {videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((video) => (
              <Link key={video.id} href={`/videos/${video.id}`} className="group block">
                <div className="relative aspect-video overflow-hidden mb-3" style={{ border: '1px solid rgba(0,255,240,0.1)' }}>
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,240,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="#0a0a0f" className="w-5 h-5 ml-1">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs" style={{ background: 'rgba(0,0,0,0.8)', color: '#fff' }}>
                    ▶
                  </div>
                </div>
                <h3 className="text-sm font-medium leading-snug mb-1 line-clamp-2" style={{ color: '#e0e0e0' }}>{video.title}</h3>
                <p className="text-xs" style={{ color: '#444' }}>{new Date(video.created_at).toLocaleDateString('ru-RU')}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            {q ? (
              <>
                <p className="text-lg tracking-widest mb-2" style={{ color: '#333' }}>НИЧЕГО НЕ НАЙДЕНО</p>
                <p className="text-sm mb-6" style={{ color: '#444' }}>Попробуй другой запрос</p>
                <Link href="/" className="text-sm tracking-widest" style={{ color: '#00FFF0' }}>← все видео</Link>
              </>
            ) : (
              <>
                <p className="text-lg tracking-widest mb-6" style={{ color: '#333' }}>ВИДЕО ПОКА НЕТ</p>
                {user && (
                  <Link href="/videos/upload" className="px-6 py-3 text-sm tracking-widest" style={{ border: '1px solid #00FFF0', color: '#00FFF0' }}>
                    ДОБАВИТЬ ПЕРВОЕ
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
