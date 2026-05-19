import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ pets: [] })

  const { data: pets } = await supabase
    .from('pets').select('id, type, stage, variant').eq('user_id', userId)

  return NextResponse.json({ pets: pets ?? [] })
}
