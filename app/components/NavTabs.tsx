'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const onPirate = pathname === '/pirate'
  const active = searchParams.get('genre') ?? ''

  function navigate(genre: string) {
    const q = searchParams.get('q')
    const params = new URLSearchParams()
    if (genre) params.set('genre', genre)
    if (q) params.set('q', q)
    router.push(params.toString() ? `/?${params}` : '/')
  }

  const tabBase: React.CSSProperties = {
    padding: '14px 16px', fontSize: 11, whiteSpace: 'nowrap',
    fontFamily: "'Orbitron',monospace", letterSpacing: 1,
    textTransform: 'uppercase', background: 'none', border: 'none',
    cursor: 'pointer', transition: 'color 0.2s',
  }

  return (
    <nav style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', background: 'rgba(13,13,26,0.5)', position: 'relative', zIndex: 2 }}>
      {TABS.map(tab => {
        const isActive = !onPirate && active === tab.genre
        return (
          <button
            key={tab.genre}
            onClick={() => navigate(tab.genre)}
            style={{
              ...tabBase,
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              color: isActive ? 'var(--accent)' : 'var(--subtext)',
              boxShadow: isActive ? '0 2px 8px var(--accent-glow)' : 'none',
            }}
          >
            {tab.label}
          </button>
        )
      })}

      {/* ПИРАТСКИЙ СИГНАЛ — отдельная страница */}
      <button
        onClick={() => router.push('/pirate')}
        style={{
          ...tabBase, marginLeft: 'auto',
          borderBottom: onPirate ? '2px solid var(--pirate)' : '2px solid transparent',
          color: onPirate ? 'var(--pirate)' : '#c25a72',
          textShadow: onPirate ? '0 0 10px rgba(255,45,85,0.5)' : 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pirate)', boxShadow: '0 0 6px var(--pirate)', display: 'inline-block' }} className="pir-blink" />
        ПИРАТСКИЙ СИГНАЛ
      </button>
    </nav>
  )
}
