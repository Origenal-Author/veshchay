import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ newly_unlocked: [] })
  const uid = user.id

  // Уже разблокированные
  const { data: existing } = await supabase
    .from('achievements').select('key').eq('user_id', uid)
  const has = new Set(existing?.map(a => a.key) ?? [])

  // Все данные параллельно
  const [
    { data: profile },
    { data: videos, count: videoCount },
    { count: followerCount },
    { count: puzzleCount },
    { data: pets },
    { count: todayEchoCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).single(),
    supabase.from('videos').select('id, views_count, description, created_at', { count: 'exact' }).eq('user_id', uid),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', uid),
    supabase.from('puzzle_solves').select('*', { count: 'exact', head: true }).eq('solver_id', uid),
    supabase.from('pets').select('*').eq('user_id', uid),
    supabase.from('echoes').select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .gte('created_at', new Date().toISOString().slice(0, 10)),
  ])

  // Эхо на чужих видео (первый контакт) и эхо на своих (эхо-камера)
  const ownVideoIds = videos?.map(v => v.id) ?? []
  const [firstContactData, echoChamberData] = await Promise.all([
    supabase.from('echoes').select('id').eq('user_id', uid).limit(1)
      .not('video_id', 'in', ownVideoIds.length > 0 ? `(${ownVideoIds.map(id => `"${id}"`).join(',')})` : '("")'),
    ownVideoIds.length > 0
      ? supabase.from('echoes').select('*', { count: 'exact', head: true }).in('video_id', ownVideoIds)
      : Promise.resolve({ count: 0 }),
  ])

  const totalViews = videos?.reduce((s, v) => s + (v.views_count ?? 0), 0) ?? 0
  const echoChamberCount = (echoChamberData as { count: number | null }).count ?? 0
  const hasFirstContact = (firstContactData.data?.length ?? 0) > 0

  const hour = new Date().getUTCHours()
  const isNightHour = hour >= 1 && hour <= 5

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const hasVoidVideo = videos?.some(v =>
    v.created_at < sevenDaysAgo && (v.views_count ?? 0) === 0
  ) ?? false

  const hasBlindSignal = videos?.some(v => !v.description || v.description.trim() === '') ?? false

  // Функция разблокировки
  const newlyUnlocked: string[] = []
  async function tryUnlock(key: string) {
    if (has.has(key)) return
    const { error } = await supabase.from('achievements').insert({ user_id: uid, key })
    if (!error) { has.add(key); newlyUnlocked.push(key) }
  }

  // Начало
  await tryUnlock('ONLINE')
  if ((videoCount ?? 0) >= 1) await tryUnlock('FIRST_SIGNAL')
  if (profile?.avatar_url && profile?.bio && profile?.username) await tryUnlock('IDENTITY')
  if ((followerCount ?? 0) >= 1) await tryUnlock('FIRST_WATCHER')
  if (hasFirstContact) await tryUnlock('FIRST_CONTACT')

  // Активность
  if ((profile?.login_streak ?? 0) >= 7) await tryUnlock('STREAK_7')
  if ((todayEchoCount ?? 0) >= 30) await tryUnlock('NOISE_ATTACK')
  if ((profile?.time_on_site ?? 0) >= 36000) await tryUnlock('MARATHON')
  if ((puzzleCount ?? 0) >= 5) await tryUnlock('HACKER_5')
  if ((puzzleCount ?? 0) >= 20) await tryUnlock('SERIAL_HACKER')

  // Контент
  if ((videoCount ?? 0) >= 10) await tryUnlock('ARCHIVE')
  if (totalViews >= 1000) await tryUnlock('VIRAL')
  if (echoChamberCount >= 50) await tryUnlock('ECHO_CHAMBER')
  if ((followerCount ?? 0) >= 10) await tryUnlock('NETWORK_NODE')

  // Питомцы
  if ((pets?.length ?? 0) >= 1) await tryUnlock('FIRST_PARASITE')
  if ((pets?.length ?? 0) >= 3) await tryUnlock('FULL_INCUBATOR')
  if ((pets?.reduce((m, p) => Math.max(m, p.feed_count ?? 0), 0) ?? 0) >= 10) await tryUnlock('FEEDER')
  if ((profile?.bugs_squashed ?? 0) >= 5) await tryUnlock('JANITOR')
  if (pets?.some(p => p.type === 'crystal')) await tryUnlock('LEGEND')

  // Секретные
  if (isNightHour) await tryUnlock('GHOST_SIGNAL')
  if (hasVoidVideo) await tryUnlock('VOID_BROADCAST')
  if (hasBlindSignal) await tryUnlock('BLIND_SIGNAL')
  if ((profile?.login_streak ?? 0) >= 5 && (videoCount ?? 0) === 0) await tryUnlock('INVISIBLE')

  return NextResponse.json({ newly_unlocked: newlyUnlocked })
}
