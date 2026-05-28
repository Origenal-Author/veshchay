import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { CLOTHING, findClothing } from '@/lib/clothing'
import { spendBytes } from '@/lib/bytes'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/clothing — список всех предметов + что куплено пользователем
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let owned: string[] = []
  if (user) {
    const { data: rows } = await serviceClient
      .from('user_clothing').select('item_key').eq('user_id', user.id)
    owned = (rows ?? []).map(r => r.item_key as string)
  }

  return NextResponse.json({ catalog: CLOTHING, owned })
}

// POST /api/clothing — купить предмет: { itemKey }
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { itemKey?: string } | null
  if (!body?.itemKey) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const item = findClothing(body.itemKey)
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  // Уже куплено?
  const { data: existing } = await serviceClient
    .from('user_clothing').select('id').eq('user_id', user.id).eq('item_key', body.itemKey).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Уже куплено' }, { status: 400 })

  // Списываем БАЙТЫ (раньше было XP — теперь отдельная валюта)
  const { ok, newBytes } = await spendBytes(user.id, item.price)
  if (!ok) return NextResponse.json({ error: 'Не хватает байтов' }, { status: 400 })

  await serviceClient.from('user_clothing').insert({ user_id: user.id, item_key: body.itemKey })

  return NextResponse.json({ ok: true, newBytes })
}
