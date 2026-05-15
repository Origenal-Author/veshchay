import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET — список уведомлений
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] })

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return NextResponse.json({ notifications: data ?? [] })
}

// PATCH — пометить все как прочитанные
export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return NextResponse.json({ ok: true })
}

// POST — создать уведомление (внутренний вызов)
export async function POST(req: Request) {
  const supabase = await createClient()
  const { user_id, actor_id, type, entity_id, entity_title } = await req.json()

  if (!user_id || !actor_id || !type || user_id === actor_id)
    return NextResponse.json({ ok: false })

  await supabase.from('notifications').insert({ user_id, actor_id, type, entity_id, entity_title })
  return NextResponse.json({ ok: true })
}
