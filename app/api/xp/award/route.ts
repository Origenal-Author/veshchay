import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getRank, calcBioXp } from '@/lib/xp'

const STREAK_BONUSES: Record<number, number> = { 3: 15, 7: 30, 14: 60 }
const VIEW_MILESTONES: Record<number, number> = { 10: 15, 100: 40, 1000: 100 }

// Вспомогательная функция: дать XP любому пользователю по ID
async function awardXpToUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, gain: number) {
  const { data } = await supabase.from('profiles').select('xp').eq('id', userId).single()
  if (!data) return
  const newXp = (data.xp ?? 0) + gain
  await supabase.from('profiles').update({ xp: newXp, rank: getRank(newXp) }).eq('id', userId)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ gained: 0 })

  const { action, profileId, bioLength, seconds, videoId, targetUserId } = await req.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, last_login_xp_date, time_on_site, xp_avatar_given, xp_bio_given, login_streak, bugs_squashed, xp_playlist_created')
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
        const newStreak = prev === yesterday ? (profile.login_streak ?? 0) + 1 : 1
        updates.login_streak = newStreak
        // Бонус за стрик
        const streakBonus = STREAK_BONUSES[newStreak] ?? 0
        gain += streakBonus
      }
      break
    }

    case 'squash_bug': {
      updates.bugs_squashed = (profile.bugs_squashed ?? 0) + 1
      gain = 3
      break
    }

    case 'upload': {
      const { count } = await supabase
        .from('videos').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      gain = (count ?? 0) <= 1 ? 15 : 10
      break
    }

    case 'avatar': {
      if (!profile.xp_avatar_given) { gain = 10; updates.xp_avatar_given = true }
      break
    }

    case 'bio': {
      const newBioXp = calcBioXp(bioLength ?? 0)
      const already = profile.xp_bio_given ?? 0
      if (newBioXp > already) { gain = newBioXp - already; updates.xp_bio_given = newBioXp }
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
      const { data: existing } = await supabase.from('puzzle_solves')
        .select('solver_id').eq('solver_id', user.id).eq('profile_id', profileId).maybeSingle()
      if (!existing) {
        await supabase.from('puzzle_solves').insert({ solver_id: user.id, profile_id: profileId })
        gain = 10
      }
      break
    }

    case 'playlist_created': {
      if (!profile.xp_playlist_created) { gain = 10; updates.xp_playlist_created = true }
      break
    }

    case 'feed_pet': {
      gain = 1
      break
    }

    // Вызывается от имени ЦЕЛЕВОГО пользователя — например владелец видео получает XP за реакцию
    case 'got_follower': {
      gain = 5
      break
    }

    case 'got_boost': {
      if (!videoId) break
      // Проверяем что вызывающий пользователь действительно поставил boost
      const { data: sig } = await supabase.from('signals')
        .select('type').eq('video_id', videoId).eq('user_id', user.id).maybeSingle()
      if (!sig || sig.type !== 'boost') break
      // Находим владельца видео и даём ему +2 XP
      const { data: vid } = await supabase.from('videos').select('user_id').eq('id', videoId).single()
      if (!vid || vid.user_id === user.id) break
      const { data: owner } = await supabase.from('profiles').select('xp').eq('id', vid.user_id).single()
      if (!owner) break
      const nx = (owner.xp ?? 0) + 2
      await supabase.from('profiles').update({ xp: nx, rank: getRank(nx) }).eq('id', vid.user_id)
      return NextResponse.json({ gained: 2 })
    }

    case 'views_milestone': {
      if (!videoId) break
      const { data: vid } = await supabase
        .from('videos').select('user_id, views_count, view_milestones_given').eq('id', videoId).single()
      if (!vid || vid.user_id !== user.id) break
      const views = vid.views_count ?? 0
      const given: number[] = vid.view_milestones_given ?? []
      const milestoneGain: number[] = []

      for (const [threshold, xp] of Object.entries(VIEW_MILESTONES)) {
        const t = Number(threshold)
        if (views >= t && !given.includes(t)) {
          gain += xp
          milestoneGain.push(t)
        }
      }
      if (milestoneGain.length > 0) {
        await supabase.from('videos')
          .update({ view_milestones_given: [...given, ...milestoneGain] })
          .eq('id', videoId)
      }
      break
    }
  }

  if (gain > 0 || Object.keys(updates).length > 0) {
    const newXp = (profile.xp ?? 0) + gain
    await supabase.from('profiles')
      .update({ xp: newXp, rank: getRank(newXp), ...updates })
      .eq('id', user.id)
    return NextResponse.json({ gained: gain, xp: newXp, rank: getRank(newXp) })
  }

  return NextResponse.json({ gained: 0 })
}

// Внутренний POST для начисления XP другому пользователю (используется в follow, reactions)
export { awardXpToUser }
