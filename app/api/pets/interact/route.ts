import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { petId, action } = await req.json()
  if (!petId || !['feed', 'pet'].includes(action))
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { data: pet } = await supabase
    .from('pets').select('*').eq('id', petId).eq('user_id', user.id).single()
  if (!pet) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (pet.stage === 'adult') return NextResponse.json({ pet, evolved: false })

  const xpGain = action === 'feed' ? 3 : 1
  const newXp = (pet.stage_xp || 0) + xpGain
  const feedCount = action === 'feed' ? (pet.feed_count ?? 0) + 1 : (pet.feed_count ?? 0)

  let newStage = pet.stage
  if (pet.stage === 'egg' && newXp >= 50) newStage = 'baby'
  else if (pet.stage === 'baby' && newXp >= 200) newStage = 'adult'

  const { data: updated } = await supabase
    .from('pets')
    .update({ stage_xp: newXp, stage: newStage, feed_count: feedCount })
    .eq('id', petId)
    .select()
    .single()

  // +1 XP игроку за кормёжку
  if (action === 'feed') {
    const { data: p } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
    if (p) {
      const { getRank } = await import('@/lib/xp')
      const nx = (p.xp ?? 0) + 1
      await supabase.from('profiles').update({ xp: nx, rank: getRank(nx) }).eq('id', user.id)
    }
  }

  return NextResponse.json({ pet: updated, evolved: newStage !== pet.stage })
}
