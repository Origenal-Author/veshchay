'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  userId: string | null
  onLogout?: () => void
}

export default function MobileMenu({ userId, onLogout }: Props) {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/', label: '// ГЛАВНАЯ', icon: '⌂' },
    { href: '/leaderboard', label: 'ТОП АГЕНТОВ', icon: '🏆' },
    { href: '/game', label: 'ПАРАЗИТЫ', icon: '🪱' },
    ...(userId ? [
      { href: `/profile/${userId}`, label: 'ПРОФИЛЬ', icon: '◉' },
      { href: '/videos/upload', label: '+ ВИДЕО', icon: '▶' },
    ] : [
      { href: '/auth/login', label: 'ВОЙТИ', icon: '→' },
      { href: '/auth/register', label: 'РЕГИСТРАЦИЯ', icon: '✦' },
    ]),
  ]

  return (
    <>
      {/* Кнопка гамбургер — только на мобильном */}
      <button
        className="show-mobile"
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(0,255,240,0.08)' : 'none',
          border: `1px solid ${open ? 'rgba(0,255,240,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: 'var(--accent)', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 18, lineHeight: 1,
          padding: '5px 10px', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Меню"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Дропдаун меню */}
      {open && (
        <>
          {/* Фон-оверлей */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
          />
          {/* Панель */}
          <div style={{
            position: 'fixed', top: 52, right: 12, zIndex: 9991,
            width: 220,
            background: 'rgba(6,6,18,0.98)',
            border: '1px solid rgba(0,255,240,0.2)',
            borderRadius: 12,
            boxShadow: '0 0 30px rgba(0,255,240,0.1)',
            animation: 'slideInUp 0.25s ease',
            overflow: 'hidden',
          }}>
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                  fontFamily: 'Orbitron,monospace', fontSize: 11,
                  letterSpacing: 2, color: 'var(--text)',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            {userId && onLogout && (
              <button
                onClick={() => { onLogout(); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px', width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Orbitron,monospace', fontSize: 11,
                  letterSpacing: 2, color: '#FF006E',
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>⏻</span>
                <span>ВЫЙТИ</span>
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
