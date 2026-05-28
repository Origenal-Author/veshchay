import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ bytes: null })

  const { data } = await supabase
    .from('profiles').select('bytes').eq('id', user.id).single()

  return NextResponse.json({ bytes: data?.bytes ?? 0 })
}
