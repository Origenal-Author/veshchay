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
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md px-8 py-10" style={{
        background: 'rgba(10,10,20,0.9)',
        border: '1px solid #00FFF0',
        boxShadow: '0 0 40px rgba(0,255,240,0.15)',
      }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-widest mb-1" style={{ color: '#00FFF0', textShadow: '0 0 20px #00FFF0' }}>
            ВЕЩАЙ
          </h1>
          <p className="text-sm tracking-widest" style={{ color: '#666' }}>ВОЙТИ В СИСТЕМУ</p>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div>
            <input
              name="email"
              type="email"
              placeholder="EMAIL"
              required
              className="w-full px-4 py-3 text-sm tracking-widest outline-none"
              style={{
                background: 'rgba(0,255,240,0.05)',
                border: '1px solid rgba(0,255,240,0.3)',
                color: '#fff',
              }}
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="ПАРОЛЬ"
              required
              className="w-full px-4 py-3 text-sm tracking-widest outline-none"
              style={{
                background: 'rgba(0,255,240,0.05)',
                border: '1px solid rgba(0,255,240,0.3)',
                color: '#fff',
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: '#FF006E' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold tracking-widest transition-all"
            style={{
              background: loading ? 'rgba(0,255,240,0.1)' : '#00FFF0',
              color: '#0a0a0f',
            }}
          >
            {loading ? 'ВХОД...' : 'ВОЙТИ'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: '#666' }}>
          Нет аккаунта?{' '}
          <Link href="/auth/register" style={{ color: '#FF006E' }}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
