import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Клиент с service role — обходит RLS полностью
const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  // Проверяем что пользователь авторизован
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const bucket = (formData.get('bucket') as string) || 'avatars'
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = bucket === 'avatars'
    ? `${user.id}/avatar.${ext}`
    : `${user.id}/${Date.now()}.${ext}`

  const bytes = await file.arrayBuffer()

  const { error } = await serviceClient.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = serviceClient.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ url: `${publicUrl}?t=${Date.now()}`, path })
}
