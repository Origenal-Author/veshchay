import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'

async function createPlaylist(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const title = formData.get('title') as string
  await supabase.from('playlists').insert({ user_id: user.id, title })
  redirect('/playlists')
}

async function deletePlaylist(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  await supabase.from('playlists').delete().eq('id', id)
  redirect('/playlists')
}

export default async function PlaylistsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: playlists } = await supabase
    .from('playlists')
    .select('*, playlist_videos(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link href={`/profile/${user.id}`} className="btn-ghost-ui">ПРОФИЛЬ</Link>
          <form action={logout}><button type="submit" className="btn-ghost-ui">ВЫЙТИ</button></form>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// МОИ_АРХИВЫ</div>
          <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>ПЛЕЙЛИСТЫ</h1>
        </div>

        {/* Создать плейлист */}
        <form action={createPlaylist} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            name="title"
            placeholder="Название плейлиста..."
            required
            maxLength={60}
            style={{ flex: 1, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 14, outline: 'none' }}
          />
          <button type="submit" className="btn-primary-ui" style={{ padding: '12px 20px', fontSize: 11 }}>
            + СОЗДАТЬ
          </button>
        </form>

        {/* Список плейлистов */}
        {playlists && playlists.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {playlists.map((pl: any) => (
              <div key={pl.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', gap: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />
                <div style={{ flex: 1, paddingLeft: 8 }}>
                  <Link href={`/playlists/${pl.id}`} style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', letterSpacing: 1 }}>
                    {pl.title}
                  </Link>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', marginTop: 4 }}>
                    {pl.playlist_videos?.[0]?.count || 0} видео · {new Date(pl.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <Link href={`/playlists/${pl.id}`} className="btn-ghost-ui" style={{ fontSize: 10, padding: '6px 14px' }}>ОТКРЫТЬ</Link>
                <form action={deletePlaylist}>
                  <input type="hidden" name="id" value={pl.id} />
                  <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--subtext)', cursor: 'pointer', fontSize: 16, padding: '4px 8px' }}>✕</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)' }}>
            // плейлистов пока нет — создай первый
          </div>
        )}
      </main>
    </div>
  )
}
