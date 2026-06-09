'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setEmail(user.email || '')
      const { data: profile } = await supabase.from('profiles').select('public_email').eq('id', user.id).single()
      setShowEmail(!!profile?.public_email)
      setLoading(false)
    })()
  }, [router])

  async function toggleEmail() {
    if (saving) return
    const next = !showEmail
    setShowEmail(next); setSaved(false); setError(''); setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error } = await supabase.from('profiles')
      .update({ public_email: next ? (user.email || null) : null })
      .eq('id', user.id)
    setSaving(false)
    if (error) { setError(error.message); setShowEmail(!next); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link href="/profile/edit" className="btn-ghost-ui">ПРОФИЛЬ</Link>
          <Link href="/" className="btn-ghost-ui">← ГЛАВНАЯ</Link>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// КОНФИГУРАЦИЯ_СИСТЕМЫ</div>
          <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>НАСТРОЙКИ</h1>
        </div>

        {loading ? (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', letterSpacing: 2 }}>// ЗАГРУЗКА...</div>
        ) : (
          <>
            {/* РАЗДЕЛ: ПРИВАТНОСТЬ */}
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              // ПРИВАТНОСТЬ
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: 1, marginBottom: 6 }}>
                  ПОКАЗЫВАТЬ EMAIL В ПРОФИЛЕ
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', lineHeight: 1.6 }}>
                  По умолчанию почта скрыта от всех. Включи, если хочешь, чтобы другие видели твой email в профиле (например для связи / соцсетей).
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: showEmail ? 'var(--accent)' : 'var(--subtext)', marginTop: 10, letterSpacing: 1 }}>
                  {showEmail ? `✉ виден: ${email}` : '✕ скрыт'}
                </div>
              </div>

              {/* ПЕРЕКЛЮЧАТЕЛЬ */}
              <button
                onClick={toggleEmail}
                disabled={saving}
                aria-pressed={showEmail}
                style={{
                  flexShrink: 0, width: 52, height: 28, borderRadius: 14, cursor: saving ? 'default' : 'pointer',
                  border: `1px solid ${showEmail ? 'var(--accent)' : 'var(--border)'}`,
                  background: showEmail ? 'rgba(0,255,240,0.15)' : 'var(--surface2)',
                  boxShadow: showEmail ? '0 0 12px var(--accent-glow)' : 'none',
                  position: 'relative', transition: 'all 0.2s', opacity: saving ? 0.6 : 1, padding: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: showEmail ? 26 : 2, width: 22, height: 22, borderRadius: '50%',
                  background: showEmail ? 'var(--accent)' : 'var(--subtext)',
                  boxShadow: showEmail ? '0 0 8px var(--accent)' : 'none', transition: 'left 0.2s, background 0.2s',
                }} />
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E' }}>
                ⚠ {error}
              </div>
            )}
            {saved && (
              <div style={{ marginTop: 16, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)', letterSpacing: 1 }}>
                ✓ сохранено
              </div>
            )}

            <div style={{ marginTop: 32, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', opacity: 0.6, lineHeight: 1.6 }}>
              // другие настройки появятся здесь позже
            </div>
          </>
        )}
      </main>
    </div>
  )
}
