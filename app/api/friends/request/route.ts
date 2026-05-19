import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetId } = await req.json()
  if (!targetId || targetId === user.id)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Проверяем нет ли уже запроса или дружбы
  const { data: existing } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'accepted') return NextResponse.json({ error: 'Already friends' }, { status: 400 })
    if (existing.status === 'pending') return NextResponse.json({ error: 'Request already exists' }, { status: 400 })
  }

  const { data: request } = await supabase
    .from('friend_requests')
    .insert({ sender_id: user.id, receiver_id: targetId })
    .select().single()

  // Уведомление получателю
  await supabase.from('notifications').insert({
    user_id: targetId, actor_id: user.id,
    type: 'friend_request', entity_id: request?.id,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetId } = await req.json()

  await supabase.from('friend_requests').delete()
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`)

  return NextResponse.json({ ok: true })
}
