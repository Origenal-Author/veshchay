import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { CLOTHING, findClothing } from '@/lib/clothing'
import { getRank } from '@/lib/xp'

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
    const { data: rows } = await supabase
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
  const { data: existing } = await supabase
    .from('user_clothing').select('id').eq('user_id', user.id).eq('item_key', body.itemKey).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Уже куплено' }, { status: 400 })

  // Хватает XP?
  const { data: profile } = await supabase
    .from('profiles').select('xp').eq('id', user.id).single()
  const xp = profile?.xp ?? 0
  if (xp < item.price) return NextResponse.json({ error: 'Не хватает XP' }, { status: 400 })

  // Списываем XP и записываем покупку
  const newXp = xp - item.price
  await serviceClient.from('profiles').update({ xp: newXp, rank: getRank(newXp) }).eq('id', user.id)
  await serviceClient.from('user_clothing').insert({ user_id: user.id, item_key: body.itemKey })

  return NextResponse.json({ ok: true, newXp })
}
