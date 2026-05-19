import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET — список диалогов (последнее сообщение с каждым)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ conversations: [] })

  const { data: msgs } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (!msgs || msgs.length === 0) return NextResponse.json({ conversations: [] })

  // Группируем по собеседнику — берём последнее сообщение
  const convMap = new Map<string, any>()
  for (const m of msgs) {
    const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
    if (!convMap.has(otherId)) convMap.set(otherId, m)
  }

  // Считаем непрочитанные
  const unreadMap = new Map<string, number>()
  for (const m of msgs) {
    if (m.receiver_id === user.id && !m.read) {
      const cnt = unreadMap.get(m.sender_id) ?? 0
      unreadMap.set(m.sender_id, cnt + 1)
    }
  }

  const otherIds = [...convMap.keys()]
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, avatar_url, rank').in('id', otherIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const conversations = otherIds.map(otherId => ({
    userId: otherId,
    profile: profileMap[otherId] ?? null,
    lastMessage: convMap.get(otherId),
    unread: unreadMap.get(otherId) ?? 0,
  })).sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())

  return NextResponse.json({ conversations })
}
