import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { MAX_CLAN_MEMBERS } from '@/lib/clans'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — пригласить друга в клан
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: clanId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetId } = await req.json()

  // Только координатор или инструктор могут приглашать
  const { data: myRole } = await supabase.from('clan_members').select('role')
    .eq('clan_id', clanId).eq('user_id', user.id).maybeSingle()
  if (!myRole || !['coordinator', 'instructor'].includes(myRole.role))
    return NextResponse.json({ error: 'Нет прав' }, { status: 403 })

  // Проверяем лимит участников
  const { count } = await supabase.from('clan_members')
    .select('*', { count: 'exact', head: true }).eq('clan_id', clanId)
  if ((count ?? 0) >= MAX_CLAN_MEMBERS)
    return NextResponse.json({ error: `Клан уже полон (${MAX_CLAN_MEMBERS} участников)` }, { status: 400 })

  // Проверяем что они друзья
  const { data: fr } = await supabase.from('friend_requests').select('id').eq('status', 'accepted')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`)
    .maybeSingle()
  if (!fr) return NextResponse.json({ error: 'Можно приглашать только друзей' }, { status: 403 })

  // Проверяем что ещё не в клане
  const { data: alreadyMember } = await supabase.from('clan_members')
    .select('id').eq('clan_id', clanId).eq('user_id', targetId).maybeSingle()
  if (alreadyMember) return NextResponse.json({ error: 'Уже в клане' }, { status: 400 })

  const { data: clan } = await supabase.from('clans').select('name, tag').eq('id', clanId).single()

  // Уведомление
  await supabase.from('notifications').insert({
    user_id: targetId, actor_id: user.id,
    type: 'clan_invite', entity_id: clanId,
    entity_title: `[${clan?.tag}] ${clan?.name}`,
  })

  return NextResponse.json({ ok: true })
}
