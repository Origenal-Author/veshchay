import { createClient } from '@/lib/supabase-server'
import { rollPet } from '@/lib/pets'
import { getMaxPets } from '@/lib/xp'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('xp').eq('id', user.id).single()

  if (!profile) {
    return NextResponse.json({ error: 'Профиль не найден' }, { status: 404 })
  }

  const { data: pets } = await supabase
    .from('pets').select('id, stage').eq('user_id', user.id).order('created_at')

  const count = pets?.length ?? 0
  const maxPets = getMaxPets(profile.xp ?? 0)

  if (count >= maxPets)
    return NextResponse.json({ error: `Лимит питомцев: ${maxPets} (повысь ранг)` }, { status: 400 })

  if (count > 0 && pets![count - 1].stage !== 'adult')
    return NextResponse.json({ error: 'Прокачай предыдущего питомца до ВЗРОСЛЫЙ' }, { status: 400 })

  const { type, variant } = rollPet()

  const { data: pet, error } = await supabase
    .from('pets')
    .insert({ user_id: user.id, type, variant, stage: 'egg', stage_xp: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pet })
}
