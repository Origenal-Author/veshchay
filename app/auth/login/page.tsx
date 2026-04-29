'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/auth/actions'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await login(formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', zIndex: 2 }}>

      {/* ЛЕВАЯ ЧАСТЬ — БРЕНДИНГ */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, borderRight: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        {/* Сетка на фоне */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,240,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,240,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Угловые акценты */}
        <div style={{ position: 'absolute', top: 24, left: 24, width: 20, height: 20, borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
        <div style={{ position: 'absolute', top: 24, right: 24, width: 20, height: 20, borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, width: 20, height: 20, borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
        <div style={{ position: 'absolute', bottom: 24, right: 24, width: 20, height: 20, borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 52, fontWeight: 900, letterSpacing: 8, color: 'var(--accent)', textShadow: 'var(--logo-shadow)', marginBottom: 16 }}>
            ВЕЩАЙ
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', letterSpacing: 4, marginBottom: 48 }}>
            // ВИДЕОХОСТИНГ_НОВОГО_ПОКОЛЕНИЯ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            {['БЕЗ ЦЕНЗУРЫ', 'БЕЗ АЛГОРИТМОВ', 'ТОЛЬКО СИГНАЛ'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--subtext)' }}>
                <div style={{ width: 6, height: 6, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ — ФОРМА */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// АВТОРИЗАЦИЯ</div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>ВОЙТИ В СИСТЕМУ</h1>
          </div>

          <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// EMAIL</label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                style={{ width: '100%', padding: '13px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>// ПАРОЛЬ</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '13px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, outline: 'none' }}
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
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, marginTop: 8, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '// ВХОД...' : '▶ ВОЙТИ'}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)' }}>
            Нет аккаунта?{' '}
            <Link href="/auth/register" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
              Зарегистрироваться →
            </Link>
          </div>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', textDecoration: 'none' }}>
              ← вернуться на главную
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
