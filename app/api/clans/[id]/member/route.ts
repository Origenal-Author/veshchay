import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH — изменить роль участника
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: clanId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId, role } = await req.json()
  const validRoles = ['instructor', 'mediator', 'recruit']
  if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  // Только координатор может менять роли
  const { data: myRole } = await supabase.from('clan_members').select('role')
    .eq('clan_id', clanId).eq('user_id', user.id).maybeSingle()
  if (myRole?.role !== 'coordinator') return NextResponse.json({ error: 'Нет прав' }, { status: 403 })

  // Нельзя назначить двух инструкторов или двух посредников
  if (['instructor', 'mediator'].includes(role)) {
    const { count } = await supabase.from('clan_members')
      .select('*', { count: 'exact', head: true })
      .eq('clan_id', clanId).eq('role', role)
    if ((count ?? 0) >= 1) return NextResponse.json({ error: `Роль ${role} уже занята` }, { status: 400 })
  }

  await serviceClient.from('clan_members').update({ role })
    .eq('clan_id', clanId).eq('user_id', memberId)

  return NextResponse.json({ ok: true })
}

// DELETE — кикнуть участника
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: clanId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await req.json()

  const { data: myRole } = await supabase.from('clan_members').select('role')
    .eq('clan_id', clanId).eq('user_id', user.id).maybeSingle()
  if (!['coordinator', 'instructor'].includes(myRole?.role ?? ''))
    return NextResponse.json({ error: 'Нет прав' }, { status: 403 })

  await serviceClient.from('clan_members').delete()
    .eq('clan_id', clanId).eq('user_id', memberId).neq('role', 'coordinator')

  return NextResponse.json({ ok: true })
}
