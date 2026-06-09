'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AuthBranding from '@/app/auth/AuthBranding'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px', background: 'var(--surface)', border: '1px solid var(--border)',
  borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6,
}

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', zIndex: 2 }} className="auth-layout">
      <AuthBranding />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// ВОССТАНОВЛЕНИЕ ДОСТУПА</div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>СБРОС ПАРОЛЯ</h1>
          </div>

          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '16px 18px', background: 'rgba(0,255,240,0.06)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
                <div style={{ color: 'var(--accent)', marginBottom: 6 }}>✓ СИГНАЛ ОТПРАВЛЕН</div>
                Если на <span style={{ color: 'var(--accent2)' }}>{email}</span> есть аккаунт — придёт письмо со ссылкой для сброса пароля. Проверь почту (и папку «Спам»).
              </div>
              <Link href="/auth/login" className="btn-primary-ui" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13 }}>
                ← ВЕРНУТЬСЯ КО ВХОДУ
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6, margin: 0 }}>
                Введи email от аккаунта — пришлём ссылку, по которой можно задать новый пароль.
              </p>
              <div>
                <label style={labelStyle}>// EMAIL</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" required style={inputStyle} />
              </div>

              {error && (
                <div style={{ padding: '10px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E' }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary-ui" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, marginTop: 8, opacity: loading ? 0.6 : 1 }}>
                {loading ? '// ОТПРАВКА...' : '▶ ОТПРАВИТЬ ССЫЛКУ'}
              </button>
            </form>
          )}

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)' }}>
            Вспомнил пароль?{' '}
            <Link href="/auth/login" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>Войти →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
