import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getRank } from '@/lib/xp'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RANK_ORDER = [
  'СТАТИЧЕСКИЙ ШУМ', 'ПИНГ', 'ОПЕРАТИВНИК', 'ВЗЛОМЩИК',
  'АГЕНТ', 'ПРИЗРАК', 'НЕЙРОМАНТ', 'ТЕНЕВОЙ АРХИТЕКТ', 'СИСТЕМНЫЙ БОГ', 'РУТОВЫЙ ДОСТУП',
]

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetId, method, success } = await req.json()
  if (!targetId || targetId === user.id)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Проверяем ранг атакующего
  const { data: attacker } = await supabase
    .from('profiles').select('xp, rank').eq('id', user.id).single()
  if (!attacker || (attacker.xp ?? 0) < 500)
    return NextResponse.json({ error: 'Нужен ранг ВЗЛОМЩИК' }, { status: 403 })

  // Проверяем что не атаковали этого человека последние 24ч
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from('attacks').select('id').eq('attacker_id', user.id)
    .eq('target_id', targetId).gte('created_at', since).maybeSingle()
  if (recent)
    return NextResponse.json({ error: 'Уже атаковали сегодня' }, { status: 429 })

  // Проверяем разницу рангов (нельзя атаковать на 2+ ранга выше)
  const { data: target } = await supabase
    .from('profiles').select('rank').eq('id', targetId).single()
  if (target?.rank) {
    const attackerRankIdx = RANK_ORDER.indexOf(attacker.rank ?? 'СТАТИЧЕСКИЙ ШУМ')
    const targetRankIdx = RANK_ORDER.indexOf(target.rank)
    if (targetRankIdx - attackerRankIdx >= 2)
      return NextResponse.json({ error: 'Цель слишком высокого ранга' }, { status: 403 })
  }

  // Записываем атаку
  await supabase.from('attacks').insert({
    attacker_id: user.id, target_id: targetId, method, success,
  })

  let infectedPetId: string | null = null

  if (success) {
    // +20 XP атакующему
    const newXp = (attacker.xp ?? 0) + 20
    await supabase.from('profiles').update({ xp: newXp, rank: getRank(newXp) }).eq('id', user.id)

    // Помечаем жертву взломанной на 24ч
    const hackedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('profiles').update({ hacked_until: hackedUntil }).eq('id', targetId)

    // ── ЗАРАЖЕНИЕ ─────────────────────────────────────────────────────────
    // Если у атакующего есть вирус-питомец, заражаем случайного питомца жертвы.
    const { data: attackerVirusPets } = await supabase
      .from('pets').select('id').eq('user_id', user.id).eq('variant', 'virus').limit(1)
    if (attackerVirusPets && attackerVirusPets.length > 0) {
      const { data: victimPets } = await supabase
        .from('pets').select('id, infected_by').eq('user_id', targetId)
        .in('stage', ['baby', 'adult']).is('infected_by', null)
      if (victimPets && victimPets.length > 0) {
        const target = victimPets[Math.floor(Math.random() * victimPets.length)]
        await serviceClient.from('pets')
          .update({ infected_by: user.id, infected_at: new Date().toISOString() })
          .eq('id', target.id)
        infectedPetId = target.id
      }
    }

    // Уведомление жертве
    await supabase.from('notifications').insert({
      user_id: targetId, actor_id: user.id, type: 'attack',
      entity_title: method,
    })
  }

  return NextResponse.json({ ok: true, success, infectedPetId })
}

// GET — проверить доступность атаки
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ canAttack: false })

  const url = new URL(req.url)
  const targetId = url.searchParams.get('targetId')
  if (!targetId) return NextResponse.json({ canAttack: false })

  const { data: profile } = await supabase
    .from('profiles').select('xp, rank').eq('id', user.id).single()
  if (!profile || (profile.xp ?? 0) < 500)
    return NextResponse.json({ canAttack: false, reason: 'rank' })

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from('attacks').select('id, created_at').eq('attacker_id', user.id)
    .eq('target_id', targetId).gte('created_at', since).maybeSingle()
  if (recent)
    return NextResponse.json({ canAttack: false, reason: 'cooldown', until: new Date(new Date(recent.created_at).getTime() + 24*60*60*1000).toISOString() })

  // Проверка разницы рангов
  const RANK_ORDER = ['СТАТИЧЕСКИЙ ШУМ','ПИНГ','ОПЕРАТИВНИК','ВЗЛОМЩИК','АГЕНТ','ПРИЗРАК','НЕЙРОМАНТ','ТЕНЕВОЙ АРХИТЕКТ','СИСТЕМНЫЙ БОГ','РУТОВЫЙ ДОСТУП']
  const { data: target } = await supabase.from('profiles').select('rank').eq('id', targetId).single()
  if (target?.rank) {
    const ai = RANK_ORDER.indexOf(profile.rank ?? 'СТАТИЧЕСКИЙ ШУМ')
    const ti = RANK_ORDER.indexOf(target.rank)
    if (ti - ai >= 2) return NextResponse.json({ canAttack: false, reason: 'rank_gap' })
  }

  // Получаем вирус-питомца
  const { data: pets } = await supabase.from('pets').select('*').eq('user_id', user.id).eq('variant', 'virus')

  return NextResponse.json({ canAttack: true, virusPets: pets ?? [] })
}
