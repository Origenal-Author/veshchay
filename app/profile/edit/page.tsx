'use client'

import { useEffect, useState } from 'react'
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
  const [saved, setSaved] = useState(false)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || loading) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').upsert({ id: userId, username, bio, avatar_url: avatarUrl })
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

          {/* Превью аватара */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,var(--accent),var(--surface2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'var(--bg)', fontFamily: "'Orbitron',monospace", border: '2px solid var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarUrl('')} />
                : (username || '??').slice(0, 2).toUpperCase()
              }
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// ССЫЛКА НА АВАТАР (URL)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: 'none' }}
              />
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
              maxLength={300}
              rows={4}
              style={{ width: '100%', padding: '13px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 14, outline: 'none', resize: 'none' }}
            />
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', textAlign: 'right', marginTop: 4 }}>{bio.length}/300</div>
          </div>

          {saved && (
            <div style={{ padding: '10px 16px', background: 'rgba(0,255,240,0.08)', border: '1px solid rgba(0,255,240,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--accent)' }}>
              ✓ ПРОФИЛЬ СОХРАНЁН
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary-ui" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, opacity: loading ? 0.6 : 1 }}>
            {loading ? '// СОХРАНЕНИЕ...' : '▶ СОХРАНИТЬ ПРОФИЛЬ'}
          </button>
        </form>
      </div>
    </div>
  )
}
