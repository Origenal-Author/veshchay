import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, action } = await req.json() // action: 'accept' | 'decline'
  if (!requestId || !['accept', 'decline'].includes(action))
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { data: request } = await supabase
    .from('friend_requests').select('*')
    .eq('id', requestId).eq('receiver_id', user.id).eq('status', 'pending')
    .maybeSingle()

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const status = action === 'accept' ? 'accepted' : 'declined'
  await supabase.from('friend_requests').update({ status }).eq('id', requestId)

  if (action === 'accept') {
    // Уведомление отправителю
    await supabase.from('notifications').insert({
      user_id: request.sender_id, actor_id: user.id,
      type: 'friend_accept',
    })
  }

  return NextResponse.json({ ok: true, status })
}
