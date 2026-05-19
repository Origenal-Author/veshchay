import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — отправить запрос на заимствование
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { petId, ownerId, durationHours } = await req.json()
  if (!petId || !ownerId || ![1, 24].includes(durationHours))
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Проверяем что они друзья
  const { data: fr } = await supabase.from('friend_requests')
    .select('id').eq('status', 'accepted')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${ownerId}),and(sender_id.eq.${ownerId},receiver_id.eq.${user.id})`)
    .maybeSingle()
  if (!fr) return NextResponse.json({ error: 'Not friends' }, { status: 403 })

  // Проверяем что питомец принадлежит владельцу и не яйцо
  const { data: pet } = await supabase.from('pets').select('*').eq('id', petId).eq('user_id', ownerId).maybeSingle()
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  if (pet.stage === 'egg') return NextResponse.json({ error: 'Нельзя занять яйцо' }, { status: 400 })

  // Проверяем нет ли уже активного запроса
  const { data: existing } = await serviceClient.from('pet_borrows')
    .select('id').eq('pet_id', petId).in('status', ['pending', 'active']).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Питомец уже занят или запрос отправлен' }, { status: 400 })

  const { data: borrow } = await serviceClient.from('pet_borrows')
    .insert({ requester_id: user.id, owner_id: ownerId, pet_id: petId, duration_hours: durationHours })
    .select().single()

  await supabase.from('notifications').insert({
    user_id: ownerId, actor_id: user.id,
    type: 'pet_borrow_request', entity_id: borrow?.id,
    entity_title: pet.type,
  })

  return NextResponse.json({ ok: true })
}

// PATCH — принять или отклонить запрос
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { borrowId, action } = await req.json() // action: 'accept' | 'decline'
  if (!borrowId || !['accept', 'decline'].includes(action))
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { data: borrow } = await serviceClient.from('pet_borrows')
    .select('*').eq('id', borrowId).eq('owner_id', user.id).eq('status', 'pending').maybeSingle()
  if (!borrow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'decline') {
    await serviceClient.from('pet_borrows').update({ status: 'declined' }).eq('id', borrowId)
    return NextResponse.json({ ok: true })
  }

  const expiresAt = new Date(Date.now() + borrow.duration_hours * 60 * 60 * 1000).toISOString()
  await serviceClient.from('pet_borrows').update({ status: 'active', expires_at: expiresAt }).eq('id', borrowId)

  await supabase.from('notifications').insert({
    user_id: borrow.requester_id, actor_id: user.id,
    type: 'pet_borrow_accept', entity_title: borrow.pet_id,
  })

  return NextResponse.json({ ok: true, expiresAt })
}

// DELETE — вернуть питомца досрочно
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { borrowId } = await req.json()
  await serviceClient.from('pet_borrows').update({ status: 'returned' })
    .eq('id', borrowId).eq('requester_id', user.id).eq('status', 'active')

  return NextResponse.json({ ok: true })
}
