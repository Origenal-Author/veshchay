import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST — создать эффект взлома
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { victimId, effectType, effectData } = await req.json()
  if (!victimId || !effectType) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Проверяем что атака была успешной
  const { data: attack } = await supabase
    .from('attacks')
    .select('id')
    .eq('attacker_id', user.id)
    .eq('target_id', victimId)
    .eq('success', true)
    .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // последние 30 минут
    .maybeSingle()

  if (!attack) return NextResponse.json({ error: 'Нет активной сессии взлома' }, { status: 403 })

  const { data: attackerProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа

  const enrichedData = { ...(effectData ?? {}), attackerName: attackerProfile?.username || 'аноним' }

  const { data, error } = await supabase
    .from('hack_effects')
    .insert({ attacker_id: user.id, victim_id: victimId, effect_type: effectType, effect_data: enrichedData, expires_at: expiresAt })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ effect: data })
}

// GET — получить активные эффекты для текущего пользователя (жертвы)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ effects: [] })

  const { data } = await supabase
    .from('hack_effects')
    .select('*')
    .eq('victim_id', user.id)
    .is('cleaned_at', null)
    .gt('expires_at', new Date().toISOString())

  return NextResponse.json({ effects: data ?? [] })
}

// PATCH — очистить эффект (жертва)
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const { effectId } = await req.json()
  await supabase
    .from('hack_effects')
    .update({ cleaned_at: new Date().toISOString() })
    .eq('id', effectId)
    .eq('victim_id', user.id)

  return NextResponse.json({ ok: true })
}
