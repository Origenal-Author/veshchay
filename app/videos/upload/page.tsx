'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { extractYoutubeId } from '@/lib/youtube'

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement).value
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value
    const url = (form.elements.namedItem('url') as HTMLInputElement).value

    const youtubeId = extractYoutubeId(url)
    if (!youtubeId) {
      setError('Неверная ссылка YouTube')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error: dbError } = await supabase
      .from('videos')
      .insert({ title, description, youtube_id: youtubeId, user_id: user.id })
      .select('id')
      .single()

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.push(`/videos/${data.id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-lg px-8 py-10" style={{
        background: 'rgba(10,10,20,0.9)',
        border: '1px solid #00FFF0',
        boxShadow: '0 0 40px rgba(0,255,240,0.1)',
      }}>
        <h2 className="text-2xl font-bold tracking-widest mb-8 text-center" style={{ color: '#00FFF0' }}>
          ДОБАВИТЬ ВИДЕО
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="title"
            type="text"
            placeholder="НАЗВАНИЕ"
            required
            className="w-full px-4 py-3 text-sm tracking-widest outline-none"
            style={{ background: 'rgba(0,255,240,0.05)', border: '1px solid rgba(0,255,240,0.3)', color: '#fff' }}
          />
          <textarea
            name="description"
            placeholder="ОПИСАНИЕ (необязательно)"
            rows={3}
            className="w-full px-4 py-3 text-sm tracking-widest outline-none resize-none"
            style={{ background: 'rgba(0,255,240,0.05)', border: '1px solid rgba(0,255,240,0.3)', color: '#fff' }}
          />
          <input
            name="url"
            type="text"
            placeholder="ССЫЛКА YOUTUBE"
            required
            className="w-full px-4 py-3 text-sm tracking-widest outline-none"
            style={{ background: 'rgba(0,255,240,0.05)', border: '1px solid rgba(0,255,240,0.3)', color: '#fff' }}
          />

          {error && <p className="text-sm text-center" style={{ color: '#FF006E' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold tracking-widest"
            style={{ background: loading ? 'rgba(0,255,240,0.1)' : '#00FFF0', color: '#0a0a0f' }}
          >
            {loading ? 'ЗАГРУЗКА...' : 'ОПУБЛИКОВАТЬ'}
          </button>
        </form>
      </div>
    </div>
  )
}
