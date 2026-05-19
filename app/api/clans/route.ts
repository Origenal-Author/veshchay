import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getMaxClans, MIN_FRIENDS_TO_CREATE, MAX_CLAN_MEMBERS } from '@/lib/clans'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — создать клан
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, tag, description, emblemSymbols, emblemColor } = await req.json()
  if (!name?.trim() || !tag?.trim() || !emblemSymbols?.length)
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 })
  if (tag.length !== 3)
    return NextResponse.json({ error: 'Тег должен быть 3 символа' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Проверяем лимит кланов
  const maxClans = getMaxClans(profile.xp ?? 0)
  const { count: clanCount } = await supabase.from('clan_members')
    .select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('role', 'coordinator')
  if ((clanCount ?? 0) >= maxClans)
    return NextResponse.json({ error: `Достигнут лимит кланов (${maxClans})` }, { status: 400 })

  // Проверяем минимум 6 друзей
  const { count: friendCount } = await supabase.from('friend_requests')
    .select('*', { count: 'exact', head: true })
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
  if ((friendCount ?? 0) < MIN_FRIENDS_TO_CREATE)
    return NextResponse.json({ error: `Нужно минимум ${MIN_FRIENDS_TO_CREATE} друзей для создания клана` }, { status: 400 })

  // Проверяем уникальность имени и тега
  const { data: existing } = await supabase.from('clans')
    .select('id').or(`name.eq.${name.trim()},tag.eq.${tag.toUpperCase().trim()}`).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Клан с таким именем или тегом уже существует' }, { status: 400 })

  // Создаём клан
  const { data: clan } = await serviceClient.from('clans').insert({
    name: name.trim(),
    tag: tag.toUpperCase().trim(),
    description: description?.trim() || null,
    emblem_symbols: emblemSymbols.slice(0, 3),
    emblem_color: emblemColor || '#00FFF0',
    owner_id: user.id,
  }).select().single()

  if (!clan) return NextResponse.json({ error: 'Ошибка создания клана' }, { status: 500 })

  // Добавляем создателя как КООРДИНАТОРА
  await serviceClient.from('clan_members').insert({
    clan_id: clan.id, user_id: user.id, role: 'coordinator',
  })

  return NextResponse.json({ clan })
}

// GET — список кланов текущего пользователя
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ clans: [] })

  const { data: memberships } = await supabase.from('clan_members')
    .select('role, clan:clans(id, name, tag, emblem_symbols, emblem_color)')
    .eq('user_id', user.id)

  return NextResponse.json({ clans: memberships ?? [] })
}
