import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getRank, calcBioXp } from '@/lib/xp'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ gained: 0 })

  const { action, profileId, bioLength, seconds } = await req.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, last_login_xp_date, time_on_site, xp_avatar_given, xp_bio_given, login_streak, bugs_squashed')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ gained: 0 })

  let gain = 0
  const updates: Record<string, unknown> = {}

  switch (action) {
    case 'login': {
      const today = new Date().toISOString().slice(0, 10)
      const prev = profile.last_login_xp_date ?? ''
      if (prev !== today) {
        gain = 5
        updates.last_login_xp_date = today
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        updates.login_streak = prev === yesterday ? (profile.login_streak ?? 0) + 1 : 1
      }
      break
    }

    case 'squash_bug': {
      updates.bugs_squashed = (profile.bugs_squashed ?? 0) + 1
      break
    }

    case 'upload': {
      const { count } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      gain = (count ?? 0) <= 1 ? 15 : 10
      break
    }

    case 'avatar': {
      if (!profile.xp_avatar_given) {
        gain = 10
        updates.xp_avatar_given = true
      }
      break
    }

    case 'bio': {
      const newBioXp = calcBioXp(bioLength ?? 0)
      const already = profile.xp_bio_given ?? 0
      if (newBioXp > already) {
        gain = newBioXp - already
        updates.xp_bio_given = newBioXp
      }
      break
    }

    case 'time': {
      const secs = seconds ?? 60
      const prev = profile.time_on_site ?? 0
      const next = prev + secs
      updates.time_on_site = next
      if (prev < 3600 && next >= 3600) gain = 20
      break
    }

    case 'puzzle': {
      if (!profileId || profileId === user.id) break
      const { data: existing } = await supabase
        .from('puzzle_solves')
        .select('solver_id')
        .eq('solver_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle()
      if (!existing) {
        await supabase.from('puzzle_solves').insert({ solver_id: user.id, profile_id: profileId })
        gain = 10
      }
      break
    }
  }

  if (gain > 0 || Object.keys(updates).length > 0) {
    const newXp = (profile.xp ?? 0) + gain
    await supabase
      .from('profiles')
      .update({ xp: newXp, rank: getRank(newXp), ...updates })
      .eq('id', user.id)
    return NextResponse.json({ gained: gain, xp: newXp, rank: getRank(newXp) })
  }

  return NextResponse.json({ gained: 0 })
}
