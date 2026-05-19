import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { pickTodayQuests, getQuestDef } from '@/lib/quests'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00.000Z`

  let { data: dq } = await serviceClient
    .from('daily_quests')
    .select('*')
    .eq('user_id', user.id)
    .eq('quest_date', today)
    .maybeSingle()

  if (!dq || !dq.quest_keys || dq.quest_keys.length === 0) {
    const questKeys = pickTodayQuests(user.id, today)
    if (!dq) {
      const { data: created } = await serviceClient
        .from('daily_quests')
        .insert({ user_id: user.id, quest_date: today, quest_keys: questKeys })
        .select()
        .single()
      dq = created
    } else {
      await serviceClient.from('daily_quests')
        .update({ quest_keys: questKeys })
        .eq('user_id', user.id).eq('quest_date', today)
      dq = { ...dq, quest_keys: questKeys }
    }
  }

  if (!dq) return NextResponse.json({ error: 'Failed to load quests' }, { status: 500 })

  const [viewsRes, echoesRes, attacksRes, videosRes] = await Promise.all([
    supabase.from('views').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart),
    supabase.from('echoes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart),
    supabase.from('attacks').select('id', { count: 'exact', head: true }).eq('attacker_id', user.id).eq('success', true).gte('created_at', todayStart),
    supabase.from('videos').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart),
  ])

  const counts: Record<string, number> = {
    watch_1:  viewsRes.count ?? 0,
    watch_3:  viewsRes.count ?? 0,
    echo_1:   echoesRes.count ?? 0,
    feed_pet: dq.pet_feeds ?? 0,
    attack_1: attacksRes.count ?? 0,
    follow_1: 0, // tracked separately below
    upload_1: videosRes.count ?? 0,
  }

  // follows — try with created_at filter
  try {
    const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true })
      .eq('follower_id', user.id).gte('created_at', todayStart)
    counts.follow_1 = count ?? 0
  } catch { /* column might not exist */ }

  const questKeys = dq.quest_keys as string[]
  const claimedKeys = (dq.claimed_keys ?? []) as string[]

  const quests = questKeys.map(key => {
    const def = getQuestDef(key)!
    const progress = Math.min(counts[key] ?? 0, def.target)
    return {
      key, title: def.title, desc: def.desc,
      target: def.target, xp: def.xp, icon: def.icon,
      progress,
      completed: progress >= def.target,
      claimed: claimedKeys.includes(key),
    }
  })

  return NextResponse.json({ quests })
}
