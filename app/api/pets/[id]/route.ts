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

// POST — лечить заражённого питомца (вызывается после успешной мини-игры)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { action?: string } | null
  if (body?.action !== 'heal') return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Проверяем владение питомцем и факт заражения
  const { data: pet } = await supabase
    .from('pets').select('id, user_id, infected_by').eq('id', id).single()
  if (!pet || pet.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!pet.infected_by)
    return NextResponse.json({ error: 'Not infected' }, { status: 400 })

  // Сбрасываем заражение
  const { data: updated, error } = await serviceClient
    .from('pets').update({ infected_by: null, infected_at: null }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // +15 XP за успешное лечение
  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
  if (profile) {
    const { getRank } = await import('@/lib/xp')
    const nx = (profile.xp ?? 0) + 15
    await supabase.from('profiles').update({ xp: nx, rank: getRank(nx) }).eq('id', user.id)
  }

  return NextResponse.json({ pet: updated, xpGain: 15 })
}

// PATCH — обновить питомца: имя или надетая одежда
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { name?: string | null; equipped?: string[] } | null
  if (body === null) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Проверяем владение
  const { data: pet } = await supabase
    .from('pets').select('id, user_id').eq('id', id).single()
  if (!pet || pet.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}

  // Имя
  if ('name' in body) {
    const rawName = (body.name ?? '').toString().trim()
    if (rawName.length > 24) {
      return NextResponse.json({ error: 'Имя слишком длинное (макс. 24)' }, { status: 400 })
    }
    updates.name = rawName.length === 0 ? null : rawName
  }

  // Одежда — проверяем, что все ключи куплены пользователем
  if ('equipped' in body && Array.isArray(body.equipped)) {
    const equipped = body.equipped.slice(0, 4)  // максимум 4 слота
    if (equipped.length > 0) {
      // Используем serviceClient — RLS на user_clothing блокирует authenticated
      const { data: owned } = await serviceClient
        .from('user_clothing').select('item_key').eq('user_id', user.id)
      const ownedSet = new Set((owned ?? []).map(r => r.item_key as string))
      for (const key of equipped) {
        if (!ownedSet.has(key)) {
          return NextResponse.json({ error: `Не куплено: ${key}` }, { status: 400 })
        }
      }
    }
    updates.equipped = equipped
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data: updated, error } = await serviceClient
    .from('pets').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pet: updated })
}
