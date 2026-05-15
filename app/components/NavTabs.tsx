'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const TABS = [
  { label: 'ВСЁ',      genre: '' },
  { label: 'МУЗЫКА',   genre: 'music' },
  { label: 'КИНО',     genre: 'film' },
  { label: 'ИГРЫ',     genre: 'games' },
  { label: 'СТРИМЫ',   genre: 'streams' },
  { label: 'ПОДКАСТЫ', genre: 'podcasts' },
  { label: 'АНИМЕ',    genre: 'anime' },
]

export default function NavTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('genre') ?? ''

  function navigate(genre: string) {
    const q = searchParams.get('q')
    const params = new URLSearchParams()
    if (genre) params.set('genre', genre)
    if (q) params.set('q', q)
    router.push(params.toString() ? `/?${params}` : '/')
  }

  return (
    <nav style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', background: 'rgba(13,13,26,0.5)', position: 'relative', zIndex: 2 }}>
      {TABS.map(tab => (
        <button
          key={tab.genre}
          onClick={() => navigate(tab.genre)}
          style={{
            padding: '14px 16px', fontSize: 11, whiteSpace: 'nowrap',
            fontFamily: "'Orbitron',monospace", letterSpacing: 1,
            textTransform: 'uppercase', background: 'none', border: 'none',
            borderBottom: active === tab.genre ? '2px solid var(--accent)' : '2px solid transparent',
            color: active === tab.genre ? 'var(--accent)' : 'var(--subtext)',
            cursor: 'pointer', transition: 'color 0.2s',
            boxShadow: active === tab.genre ? '0 2px 8px var(--accent-glow)' : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
