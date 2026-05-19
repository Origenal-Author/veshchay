import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — данные клана
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: clan } = await supabase.from('clans').select('*').eq('id', id).single()
  if (!clan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: members } = await supabase.from('clan_members')
    .select('role, joined_at, user:profiles(id, username, avatar_url, rank, xp)')
    .eq('clan_id', id)
    .order('joined_at')

  return NextResponse.json({ clan, members: members ?? [] })
}

// DELETE — покинуть клан
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase.from('clan_members').select('role')
    .eq('clan_id', id).eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 400 })

  if (member.role === 'coordinator') {
    // Координатор удаляет весь клан
    await serviceClient.from('clan_members').delete().eq('clan_id', id)
    await serviceClient.from('clans').delete().eq('id', id)
    return NextResponse.json({ ok: true, disbanded: true })
  }

  await supabase.from('clan_members').delete().eq('clan_id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
