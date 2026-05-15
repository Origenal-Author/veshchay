import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const bucket = (formData.get('bucket') as string) || 'avatars'
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // Создаём клиент с явным токеном пользователя — он даёт роль authenticated в RLS
  const adminClient = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
  )

  const ext = file.name.split('.').pop()
  const path = bucket === 'avatars'
    ? `${session.user.id}/avatar.${ext}`
    : `${session.user.id}/${Date.now()}.${ext}`

  const bytes = await file.arrayBuffer()

  const { error } = await adminClient.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ url: `${publicUrl}?t=${Date.now()}`, path })
}
