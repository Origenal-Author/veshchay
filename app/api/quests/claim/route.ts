import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getQuestDef } from '@/lib/quests'
import { getRank } from '@/lib/xp'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questKey } = await req.json()
  const def = getQuestDef(questKey)
  if (!def) return NextResponse.json({ error: 'Unknown quest' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00.000Z`

  const { data: dq } = await serviceClient
    .from('daily_quests').select('*')
    .eq('user_id', user.id).eq('quest_date', today).maybeSingle()

  if (!dq) return NextResponse.json({ error: 'No quests for today' }, { status: 400 })
  if (!(dq.quest_keys as string[]).includes(questKey))
    return NextResponse.json({ error: 'Not your quest today' }, { status: 400 })
  if ((dq.claimed_keys as string[]).includes(questKey))
    return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

  // Verify progress server-side
  let progress = 0
  if (questKey === 'watch_1' || questKey === 'watch_3') {
    const { count } = await supabase.from('views').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart)
    progress = count ?? 0
  } else if (questKey === 'echo_1') {
    const { count } = await supabase.from('echoes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart)
    progress = count ?? 0
  } else if (questKey === 'attack_1') {
    const { count } = await supabase.from('attacks').select('id', { count: 'exact', head: true }).eq('attacker_id', user.id).eq('success', true).gte('created_at', todayStart)
    progress = count ?? 0
  } else if (questKey === 'follow_1') {
    try {
      const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id).gte('created_at', todayStart)
      progress = count ?? 0
    } catch { progress = 0 }
  } else if (questKey === 'upload_1') {
    const { count } = await supabase.from('videos').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart)
    progress = count ?? 0
  } else if (questKey === 'feed_pet') {
    progress = dq.pet_feeds ?? 0
  }

  if (progress < def.target)
    return NextResponse.json({ error: 'Quest not completed yet' }, { status: 400 })

  // Award XP
  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  const newXp = (profile.xp ?? 0) + def.xp
  await supabase.from('profiles').update({ xp: newXp, rank: getRank(newXp) }).eq('id', user.id)

  // Mark claimed
  const newClaimed = [...(dq.claimed_keys as string[]), questKey]
  await serviceClient.from('daily_quests').update({ claimed_keys: newClaimed })
    .eq('user_id', user.id).eq('quest_date', today)

  return NextResponse.json({ ok: true, xpGained: def.xp })
}
