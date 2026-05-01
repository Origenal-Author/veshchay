'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = [
  { label: 'ВСЁ', value: '' },
  { label: '#СЕКРЕТНЫЙ_ФАЙЛ', value: 'secret' },
  { label: '#ОСТРЫЙ_МАТЕРИАЛ', value: 'sharp' },
  { label: '#ВЕЩАНИЕ_ИНОАГЕНТА', value: 'agent' },
  { label: '#ПЕРЕХВАЧЕННЫЙ_СИГНАЛ', value: 'intercepted' },
  { label: '#ПОМЕХИ_В_ЭФИРЕ', value: 'noise' },
  { label: 'МУЗЫКА', value: 'music' },
  { label: 'ИГРЫ', value: 'games' },
]

export default function NavTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('cat') || ''

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('cat', value)
    else params.delete('cat')
    params.delete('q')
    router.push(`/?${params.toString()}`)
  }

  return (
    <nav style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', background: 'rgba(13,13,26,0.5)', position: 'relative', zIndex: 2 }}>
      {CATEGORIES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => select(value)}
          style={{
            padding: '14px 16px', fontSize: 11, whiteSpace: 'nowrap',
            fontFamily: "'Orbitron', monospace", letterSpacing: 1,
            textTransform: 'uppercase', background: 'none', border: 'none',
            borderBottom: active === value ? '2px solid var(--accent)' : '2px solid transparent',
            color: active === value ? 'var(--accent)' : 'var(--subtext)',
            cursor: 'pointer', transition: 'color 0.2s',
            boxShadow: active === value ? '0 2px 8px var(--accent-glow)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
