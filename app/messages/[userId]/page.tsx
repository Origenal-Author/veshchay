export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ChatClient from './ChatClient'

export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: otherId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Проверяем дружбу
  const { data: fr } = await supabase.from('friend_requests').select('id')
    .eq('status', 'accepted')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .maybeSingle()
  if (!fr) notFound()

  const { data: otherProfile } = await supabase
    .from('profiles').select('id, username, avatar_url, rank, xp').eq('id', otherId).single()
  if (!otherProfile) notFound()

  const { data: myProfile } = await supabase
    .from('profiles').select('xp').eq('id', user.id).single()

  const { data: messages } = await supabase.from('messages').select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true }).limit(100)

  // Помечаем как прочитанные
  await supabase.from('messages').update({ read: true })
    .eq('sender_id', otherId).eq('receiver_id', user.id).eq('read', false)

  return (
    <ChatClient
      currentUserId={user.id}
      otherId={otherId}
      otherProfile={otherProfile}
      otherXp={otherProfile.xp ?? 0}
      myXp={myProfile?.xp ?? 0}
      initialMessages={messages ?? []}
    />
  )
}
