import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { MAX_CLAN_MEMBERS } from '@/lib/clans'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — вступить в клан (принять приглашение)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: clanId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count } = await supabase.from('clan_members')
    .select('*', { count: 'exact', head: true }).eq('clan_id', clanId)
  if ((count ?? 0) >= MAX_CLAN_MEMBERS)
    return NextResponse.json({ error: 'Клан полон' }, { status: 400 })

  const { data: already } = await supabase.from('clan_members')
    .select('id').eq('clan_id', clanId).eq('user_id', user.id).maybeSingle()
  if (already) return NextResponse.json({ error: 'Уже в клане' }, { status: 400 })

  await serviceClient.from('clan_members').insert({
    clan_id: clanId, user_id: user.id, role: 'recruit',
  })

  return NextResponse.json({ ok: true })
}
