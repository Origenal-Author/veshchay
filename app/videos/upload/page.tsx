'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { extractYoutubeId } from '@/lib/youtube'

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const id = extractYoutubeId(e.target.value)
    setPreview(id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '')
  }

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
    if (!user) { router.push('/auth/login'); return }

    const { data, error: dbError } = await supabase
      .from('videos')
      .insert({ title, description, youtube_id: youtubeId, user_id: user.id })
      .select('id')
      .single()

    if (dbError) { setError(dbError.message); setLoading(false); return }
    router.push(`/videos/${data.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>

      {/* ШАПКА */}
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" className="btn-ghost-ui">← НАЗАД</Link>
        </div>
      </header>

      {/* КОНТЕНТ */}
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

        {/* ЛЕВАЯ КОЛОНКА — ФОРМА */}
        <div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// НОВЫЙ_СИГНАЛ</div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>ДОБАВИТЬ ВИДЕО</h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// НАЗВАНИЕ</label>
              <input
                name="title"
                type="text"
                placeholder="Введи название видео..."
                required
                style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              />
            </div>

            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// ССЫЛКА YOUTUBE</label>
              <input
                name="url"
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                required
                onChange={handleUrlChange}
                style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// ОПИСАНИЕ <span style={{ opacity: 0.5 }}>(НЕОБЯЗАТЕЛЬНО)</span></label>
              <textarea
                name="description"
                placeholder="Расскажи о видео..."
                rows={4}
                style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 14, outline: 'none', resize: 'none' }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E' }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-ui"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '// ПУБЛИКАЦИЯ...' : '▶ ОПУБЛИКОВАТЬ СИГНАЛ'}
            </button>

          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА — ПРЕВЬЮ */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, marginBottom: 12 }}>// ПРЕДПРОСМОТР</div>

          <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ aspectRatio: '16/9', position: 'relative', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {preview ? (
                <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ backgroundImage: 'linear-gradient(rgba(0,255,240,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,240,0.03) 1px,transparent 1px)', backgroundSize: '30px 30px', position: 'absolute', inset: 0 }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 60, height: 60, border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor" style={{ color: 'var(--border)' }}/></svg>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 2 }}>ВСТАВЬ ССЫЛКУ</div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 1 }}>
                {preview ? '✓ ВИДЕО НАЙДЕНО' : '// ОЖИДАНИЕ ССЫЛКИ...'}
              </div>
            </div>
          </div>

          {/* Подсказка */}
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(0,255,240,0.04)', border: '1px solid rgba(0,255,240,0.1)', borderLeft: '2px solid var(--accent)' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', lineHeight: 1.7 }}>
              <div style={{ color: 'var(--accent)', marginBottom: 6 }}>// КАК ДОБАВИТЬ ВИДЕО:</div>
              <div>1. Открой видео на YouTube</div>
              <div>2. Скопируй ссылку из адресной строки</div>
              <div>3. Вставь её в поле выше</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
