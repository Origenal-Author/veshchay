import { createClient } from '@/lib/supabase-server'
import { rollPet } from '@/lib/pets'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('xp').eq('id', user.id).single()

  if (!profile || (profile.xp || 0) < 500) {
    return NextResponse.json({ error: 'Ранг слишком низкий' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('pets').select('id').eq('user_id', user.id).maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Питомец уже есть' }, { status: 400 })
  }

  const { type, variant } = rollPet()

  const { data: pet, error } = await supabase
    .from('pets')
    .insert({ user_id: user.id, type, variant, stage: 'egg', stage_xp: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pet })
}
