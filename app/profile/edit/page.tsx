'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function EditProfilePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setUsername(data.username || '')
          setBio(data.bio || '')
          setAvatarUrl(data.avatar_url || '')
        }
      })
    })
  }, [])

  async function handleAvatarFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Только изображения'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Максимум 5MB'); return }

    setAvatarUploading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'avatars')

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) { setError(data.error || 'Ошибка загрузки'); setAvatarUploading(false); return }

    setAvatarUrl(data.url)
    setAvatarUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || loading) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    await supabase.from('profiles').upsert({ id: userId, username, bio, avatar_url: avatarUrl })

    const xpCalls = []
    if (avatarUrl.trim()) {
      xpCalls.push(fetch('/api/xp/award', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'avatar' }),
      }))
    }
    if (bio.trim()) {
      xpCalls.push(fetch('/api/xp/award', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bio', bioLength: bio.trim().length }),
      }))
    }
    await Promise.all(xpCalls).catch(() => {})

    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {userId && <Link href={`/profile/${userId}`} className="btn-ghost-ui">← ПРОФИЛЬ</Link>}
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// НАСТРОЙКИ</div>
          <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>МОЙ ПРОФИЛЬ</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Аватар — кликабельный */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={() => !avatarUploading && fileRef.current?.click()}
                style={{
                  width: 80, height: 80, cursor: 'pointer',
                  background: 'linear-gradient(135deg,var(--accent),var(--surface2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 900, color: 'var(--bg)',
                  fontFamily: "'Orbitron',monospace",
                  border: '2px solid var(--accent)',
                  overflow: 'hidden', borderRadius: 4,
                  position: 'relative',
                  opacity: avatarUploading ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarUrl('')} />
                  : (username || '??').slice(0, 2).toUpperCase()
                }
                {/* Оверлей при наведении */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  className="avatar-hover-overlay"
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ fontSize: 20 }}>{avatarUploading ? '⏳' : '📷'}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: '#fff', letterSpacing: 1, marginTop: 4 }}>
                    {avatarUploading ? 'ЗАГРУЗКА...' : 'ИЗМЕНИТЬ'}
                  </span>
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleAvatarFile(e.target.files[0])}
              />
            </div>

            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text)', letterSpacing: 1, marginBottom: 6 }}>
                {avatarUploading ? '// ЗАГРУЗКА...' : '// ФОТО ПРОФИЛЯ'}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', lineHeight: 1.7 }}>
                Кликни на аватар чтобы загрузить фото
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--subtext)', opacity: 0.5, marginTop: 2 }}>
                JPG, PNG, GIF · до 5MB
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// ИМЯ ПОЛЬЗОВАТЕЛЯ</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="твой_позывной"
              maxLength={30}
              style={{ width: '100%', padding: '13px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// О СЕБЕ</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Расскажи кто ты в этом эфире..."
              maxLength={1000}
              rows={6}
              style={{ width: '100%', padding: '13px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 120 }}
            />
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: bio.length > 950 ? '#FF006E' : 'var(--subtext)', textAlign: 'right', marginTop: 4 }}>{bio.length}/1000</div>
          </div>

          {error && (
            <div style={{ padding: '10px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E' }}>
              ⚠ {error}
            </div>
          )}

          {saved && (
            <div style={{ padding: '10px 16px', background: 'rgba(0,255,240,0.08)', border: '1px solid rgba(0,255,240,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--accent)' }}>
              ✓ ПРОФИЛЬ СОХРАНЁН
            </div>
          )}

          <button type="submit" disabled={loading || avatarUploading} className="btn-primary-ui"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, opacity: (loading || avatarUploading) ? 0.6 : 1 }}>
            {loading ? '// СОХРАНЕНИЕ...' : '▶ СОХРАНИТЬ ПРОФИЛЬ'}
          </button>
        </form>
      </div>
    </div>
  )
}
