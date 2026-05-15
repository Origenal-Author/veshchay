import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetId } = await req.json()
  if (!targetId || targetId === user.id)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetId)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete()
      .eq('follower_id', user.id).eq('following_id', targetId)
    return NextResponse.json({ following: false })
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
    // Уведомление и +5 XP владельцу профиля
    await Promise.all([
      supabase.from('notifications').insert({ user_id: targetId, actor_id: user.id, type: 'follow' }),
      (async () => {
        const { data: t } = await supabase.from('profiles').select('xp').eq('id', targetId).single()
        if (t) {
          const { getRank } = await import('@/lib/xp')
          const nx = (t.xp ?? 0) + 5
          await supabase.from('profiles').update({ xp: nx, rank: getRank(nx) }).eq('id', targetId)
        }
      })(),
    ])
    return NextResponse.json({ following: true })
  }
}
