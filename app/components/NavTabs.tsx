'use client'

import { useState } from 'react'

const tabs = ['ВСЁ', 'МУЗЫКА', 'КИНО', 'ИГРЫ', 'СТРИМЫ', 'ПОДКАСТЫ', 'АНИМЕ']

export default function NavTabs() {
  const [active, setActive] = useState('ВСЁ')

  return (
    <nav style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', background: 'rgba(13,13,26,0.5)', position: 'relative', zIndex: 2 }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          style={{
            padding: '14px 16px', fontSize: 11, whiteSpace: 'nowrap',
            fontFamily: "'Orbitron', monospace", letterSpacing: 1,
            textTransform: 'uppercase', background: 'none', border: 'none',
            borderBottom: active === tab ? '2px solid var(--accent)' : '2px solid transparent',
            color: active === tab ? 'var(--accent)' : 'var(--subtext)',
            cursor: 'pointer', transition: 'color 0.2s',
            boxShadow: active === tab ? '0 2px 8px var(--accent-glow)' : 'none',
          }}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
