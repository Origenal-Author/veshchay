import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 0 // всегда свежие данные

export async function GET() {
  // Всего операторов
  const { count: total } = await serviceClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  // Новых за последние 24 часа
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: last24 } = await serviceClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)

  return NextResponse.json({
    total: total ?? 0,
    last24: last24 ?? 0,
  })
}
