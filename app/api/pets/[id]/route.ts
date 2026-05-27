import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 25-минутный cooldown перед получением нового питомца после удаления
const UNLOCK_DELAY_MS = 25 * 60 * 1000

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Проверяем, что это питомец текущего пользователя
  const { data: pet } = await supabase
    .from('pets').select('id, user_id').eq('id', id).single()
  if (!pet || pet.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Удаляем питомца
  const { error: delError } = await serviceClient.from('pets').delete().eq('id', id)
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  // Cooldown на новых питомцев
  const unlockAt = new Date(Date.now() + UNLOCK_DELAY_MS).toISOString()
  await serviceClient.from('profiles')
    .update({ pets_unlock_at: unlockAt })
    .eq('id', user.id)

  // Ачивка «Потеря друга» — выдаём, если ещё не получена
  const { data: existingAch } = await supabase
    .from('achievements').select('key')
    .eq('user_id', user.id).eq('key', 'LOST_FRIEND').maybeSingle()
  let achievementUnlocked = false
  if (!existingAch) {
    await serviceClient.from('achievements').insert({ user_id: user.id, key: 'LOST_FRIEND' })
    achievementUnlocked = true
  }

  return NextResponse.json({ ok: true, unlockAt, achievementUnlocked })
}

// PATCH — обновить имя питомца
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { name?: string | null } | null
  if (body === null) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Нормализуем имя
  const rawName = (body.name ?? '').toString().trim()
  if (rawName.length > 24) {
    return NextResponse.json({ error: 'Имя слишком длинное (макс. 24)' }, { status: 400 })
  }
  const newName: string | null = rawName.length === 0 ? null : rawName

  // Проверяем владение
  const { data: pet } = await supabase
    .from('pets').select('id, user_id').eq('id', id).single()
  if (!pet || pet.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: updated, error } = await serviceClient
    .from('pets').update({ name: newName }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pet: updated })
}
