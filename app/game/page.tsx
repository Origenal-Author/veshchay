import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GameClient from './GameClient'
import type { Pet } from '@/lib/pets'

export default async function GamePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('xp, rank, pets_unlock_at').eq('id', user.id).single()

  if (!profile) redirect('/')

  const { data: pets } = await supabase
    .from('pets').select('*').eq('user_id', user.id).order('created_at')

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link href="/profile/edit" className="btn-ghost-ui">ПРОФИЛЬ</Link>
          <Link href="/" className="btn-ghost-ui">← ГЛАВНАЯ</Link>
        </div>
      </header>
      <GameClient
        userId={user.id}
        xp={profile.xp || 0}
        initialPets={(pets ?? []) as Pet[]}
        petsUnlockAt={profile.pets_unlock_at ?? null}
      />
    </div>
  )
}
