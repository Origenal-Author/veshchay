import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ status: 'none' })

  const targetId = new URL(req.url).searchParams.get('targetId')
  if (!targetId) return NextResponse.json({ status: 'none' })

  const { data } = await supabase
    .from('friend_requests').select('id, status, sender_id, receiver_id')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`)
    .maybeSingle()

  if (!data) return NextResponse.json({ status: 'none' })
  if (data.status === 'accepted') return NextResponse.json({ status: 'friends', requestId: data.id })
  if (data.status === 'declined') return NextResponse.json({ status: 'none' })
  if (data.status === 'pending') {
    if (data.sender_id === user.id) return NextResponse.json({ status: 'pending_sent', requestId: data.id })
    return NextResponse.json({ status: 'pending_received', requestId: data.id })
  }

  return NextResponse.json({ status: 'none' })
}
