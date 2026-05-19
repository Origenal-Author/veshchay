export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ClanClient from './ClanClient'

export default async function ClanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clan } = await supabase.from('clans').select('*').eq('id', id).single()
  if (!clan) notFound()

  const { data: members } = await supabase.from('clan_members')
    .select('role, joined_at, user:profiles(id, username, avatar_url, rank, xp)')
    .eq('clan_id', id).order('joined_at')

  const myMembership = user ? (members ?? []).find((m: any) => m.user?.id === user.id) : null

  // Друзья текущего пользователя для кнопки "пригласить"
  let friends: any[] = []
  if (user && myMembership && ['coordinator', 'instructor'].includes(myMembership.role)) {
    const { data: frRows } = await supabase.from('friend_requests')
      .select('sender_id, receiver_id').eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    const friendIds = (frRows ?? []).map((r: any) => r.sender_id === user.id ? r.receiver_id : r.sender_id)
    const memberIds = new Set((members ?? []).map((m: any) => m.user?.id))
    const invitableFriendIds = friendIds.filter((fid: string) => !memberIds.has(fid))
    if (invitableFriendIds.length > 0) {
      const { data: fp } = await supabase.from('profiles').select('id, username, avatar_url').in('id', invitableFriendIds)
      friends = fp ?? []
    }
  }

  return (
    <ClanClient
      clan={clan}
      members={(members ?? []).map((m: any) => ({ ...m, user: Array.isArray(m.user) ? m.user[0] : m.user })) as any}
      currentUserId={user?.id ?? null}
      myRole={myMembership?.role ?? null}
      invitableFriends={friends}
    />
  )
}
