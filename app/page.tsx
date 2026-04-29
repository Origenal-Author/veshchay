import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0f' }}>
      <h1 className="text-6xl font-bold tracking-widest mb-4" style={{ color: '#00FFF0', textShadow: '0 0 30px #00FFF0' }}>
        ВЕЩАЙ
      </h1>

      {user ? (
        <div className="text-center space-y-4">
          <p className="tracking-widest" style={{ color: '#666' }}>
            Привет, <span style={{ color: '#FF006E' }}>{user.user_metadata?.username || user.email}</span>
          </p>
          <form action={logout}>
            <button type="submit" className="px-6 py-2 text-sm tracking-widest" style={{ border: '1px solid #FF006E', color: '#FF006E' }}>
              ВЫЙТИ
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-4 mt-4">
          <Link href="/auth/login" className="px-6 py-2 text-sm tracking-widest" style={{ background: '#00FFF0', color: '#0a0a0f', fontWeight: 'bold' }}>
            ВОЙТИ
          </Link>
          <Link href="/auth/register" className="px-6 py-2 text-sm tracking-widest" style={{ border: '1px solid #FF006E', color: '#FF006E' }}>
            РЕГИСТРАЦИЯ
          </Link>
        </div>
      )}
    </div>
  )
}
