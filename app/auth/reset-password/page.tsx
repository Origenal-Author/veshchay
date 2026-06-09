'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)   // сессия восстановления установлена
  const [expired, setExpired] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // Supabase сам обменивает код/токен из ссылки на временную сессию.
  useEffect(() => {
    const supabase = createClient()
    let resolved = false

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { resolved = true; setReady(true) }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { resolved = true; setReady(true) }
    })
    const t = setTimeout(() => { if (!resolved) setExpired(true) }, 4500)

    return () => { sub.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }
    if (password !== confirm) { setError('Пароли не совпадают'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }

    setDone(true)
    setTimeout(() => router.push('/'), 1800)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', zIndex: 2 }} className="auth-layout">
      <AuthBranding />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// НОВЫЙ КЛЮЧ ДОСТУПА</div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>НОВЫЙ ПАРОЛЬ</h1>
          </div>

          {done ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '16px 18px', background: 'rgba(0,255,240,0.06)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
                <div style={{ color: 'var(--accent)', marginBottom: 6 }}>✓ ПАРОЛЬ ОБНОВЛЁН</div>
                Готово! Перенаправляю в систему...
              </div>
            </div>
          ) : expired && !ready ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E', lineHeight: 1.6 }}>
                ⚠ Ссылка недействительна или устарела. Открой страницу по свежей ссылке из письма или запроси сброс заново.
              </div>
              <Link href="/auth/forgot" className="btn-primary-ui" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13 }}>
                ЗАПРОСИТЬ НОВУЮ ССЫЛКУ
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: ready ? 'var(--accent)' : 'var(--subtext)', letterSpacing: 1 }}>
                {ready ? '✓ ссылка подтверждена' : '// подтверждаю ссылку...'}
              </div>
              <div>
                <label style={labelStyle}>// НОВЫЙ ПАРОЛЬ</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>// ПОВТОРИ ПАРОЛЬ</label>
                <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="••••••••" required style={inputStyle} />
              </div>

              {error && (
                <div style={{ padding: '10px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E' }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading || !ready} className="btn-primary-ui" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, marginTop: 8, opacity: (loading || !ready) ? 0.6 : 1 }}>
                {loading ? '// СОХРАНЕНИЕ...' : '▶ СОХРАНИТЬ ПАРОЛЬ'}
              </button>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/auth/login" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', textDecoration: 'none' }}>
              ← вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
