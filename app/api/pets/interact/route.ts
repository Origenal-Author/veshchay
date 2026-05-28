import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // Питомец дорос до взрослого → +200 байтов
  if (newStage === 'adult' && pet.stage !== 'adult') {
    const { awardBytes } = await import('@/lib/bytes')
    await awardBytes(user.id, 200, 'pet_grew')
  }

  // +1 XP игроку за кормёжку + трекинг квеста
  if (action === 'feed') {
    const { data: p } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
    if (p) {
      const { getRank } = await import('@/lib/xp')
      const nx = (p.xp ?? 0) + 1
      await supabase.from('profiles').update({ xp: nx, rank: getRank(nx) }).eq('id', user.id)
    }
    // Обновляем счётчик кормёжек в дневных квестах
    const today = new Date().toISOString().split('T')[0]
    const { data: dq } = await serviceClient.from('daily_quests').select('pet_feeds')
      .eq('user_id', user.id).eq('quest_date', today).maybeSingle()
    if (dq) {
      await serviceClient.from('daily_quests')
        .update({ pet_feeds: (dq.pet_feeds ?? 0) + 1 })
        .eq('user_id', user.id).eq('quest_date', today)
    } else {
      await serviceClient.from('daily_quests')
        .insert({ user_id: user.id, quest_date: today, quest_keys: [], pet_feeds: 1 })
    }
  }

  return NextResponse.json({ pet: updated, evolved: newStage !== pet.stage })
}
