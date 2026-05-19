import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET — история переписки
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId: otherId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ messages: [] })

  // Только между друзьями
  const { data: fr } = await supabase.from('friend_requests').select('id')
    .eq('status', 'accepted')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .maybeSingle()
  if (!fr) return NextResponse.json({ error: 'Not friends' }, { status: 403 })

  const { data: messages } = await supabase.from('messages').select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(100)

  // Помечаем входящие как прочитанные
  await supabase.from('messages').update({ read: true })
    .eq('sender_id', otherId).eq('receiver_id', user.id).eq('read', false)

  return NextResponse.json({ messages: messages ?? [] })
}

// POST — отправить сообщение
export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId: otherId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  // Только между друзьями
  const { data: fr } = await supabase.from('friend_requests').select('id')
    .eq('status', 'accepted')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .maybeSingle()
  if (!fr) return NextResponse.json({ error: 'Not friends' }, { status: 403 })

  const { data: message } = await supabase.from('messages')
    .insert({ sender_id: user.id, receiver_id: otherId, content: content.trim() })
    .select().single()

  return NextResponse.json({ message })
}
