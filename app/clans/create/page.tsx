'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CLAN_SYMBOLS, CLAN_COLORS, encodeClanSymbol } from '@/lib/clans'
import ClanEmblem from '@/app/components/ClanEmblem'

type SymbolPick = { symbol: string; rotation: number }
const ROTATIONS = [0, 90, 180, 270] as const

export default function CreateClanPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [description, setDescription] = useState('')
  const [picks, setPicks] = useState<SymbolPick[]>([])
  const [color, setColor] = useState('#00FFF0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleSymbol(s: string) {
    setPicks(prev => {
      const exists = prev.findIndex(p => p.symbol === s)
      if (exists >= 0) return prev.filter((_, i) => i !== exists)
      if (prev.length >= 3) return prev
      return [...prev, { symbol: s, rotation: 0 }]
    })
  }

  function rotateSymbol(idx: number) {
    setPicks(prev => prev.map((p, i) => i === idx
      ? { ...p, rotation: ROTATIONS[(ROTATIONS.indexOf(p.rotation as typeof ROTATIONS[number]) + 1) % ROTATIONS.length] }
      : p
    ))
  }

  async function submit() {
    if (!name.trim() || !tag.trim() || picks.length === 0) {
      setError('Заполни имя, тег и выбери хотя бы 1 символ')
      return
    }
    setLoading(true)
    setError(null)
    const emblemSymbols = picks.map(p => encodeClanSymbol(p.symbol, p.rotation))
    const res = await fetch('/api/clans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tag, description, emblemSymbols, emblemColor: color }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push(`/clans/${data.clan.id}`)
  }

  const previewSymbols = picks.map(p => encodeClanSymbol(p.symbol, p.rotation))
  const selectedSet = new Set(picks.map(p => p.symbol))

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/" className="btn-ghost-ui">← НАЗАД</Link>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 32, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          // СОЗДАТЬ ОРГАНИЗАЦИЮ
        </div>

        {/* Превью эмблемы */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <ClanEmblem symbols={previewSymbols} color={color} size={100} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Имя */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3, color: 'var(--accent)', display: 'block', marginBottom: 8 }}>// НАЗВАНИЕ ОРГАНИЗАЦИИ</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={30}
              placeholder="Введи название..."
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 14, padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Тег */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3, color: 'var(--accent)', display: 'block', marginBottom: 8 }}>// ТЕГ [3 СИМВОЛА]</label>
            <input value={tag} onChange={e => setTag(e.target.value.toUpperCase().slice(0, 3))} maxLength={3}
              placeholder="XYZ"
              style={{ width: 100, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--accent)', fontFamily: "'Orbitron',monospace", fontSize: 16, padding: '10px 14px', outline: 'none', letterSpacing: 4, textAlign: 'center' }}
            />
          </div>

          {/* Описание */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3, color: 'var(--accent)', display: 'block', marginBottom: 8 }}>// ОПИСАНИЕ (необязательно)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={200} rows={2}
              placeholder="О чём ваша организация..."
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 13, padding: '10px 14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Символы эмблемы */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3, color: 'var(--accent)', display: 'block', marginBottom: 8 }}>// СИМВОЛЫ ЭМБЛЕМЫ (макс. 3)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CLAN_SYMBOLS.map(s => (
                <button key={s} onClick={() => toggleSymbol(s)} style={{
                  width: 40, height: 40, borderRadius: 8, fontSize: 18,
                  border: `1px solid ${selectedSet.has(s) ? color : 'rgba(255,255,255,0.1)'}`,
                  background: selectedSet.has(s) ? `rgba(${hexToRgb(color)},0.15)` : 'var(--surface)',
                  color: selectedSet.has(s) ? color : 'var(--subtext)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: selectedSet.has(s) ? `0 0 10px rgba(${hexToRgb(color)},0.3)` : 'none',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Поворот выбранных символов */}
          {picks.length > 0 && (
            <div>
              <label style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3, color: 'var(--accent)', display: 'block', marginBottom: 8 }}>// ПОВЕРНУТЬ СИМВОЛЫ (клик)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {picks.map((p, i) => (
                  <button key={i} onClick={() => rotateSymbol(i)} title={`Поворот: ${p.rotation}°`} style={{
                    width: 52, height: 52, borderRadius: 8, fontSize: 22,
                    border: `1px solid ${color}`,
                    background: `rgba(${hexToRgb(color)},0.12)`,
                    color, cursor: 'pointer', transition: 'transform 0.25s',
                    boxShadow: `0 0 10px rgba(${hexToRgb(color)},0.3)`,
                    transform: `rotate(${p.rotation}deg)`,
                  }}>{p.symbol}</button>
                ))}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'var(--subtext)', marginTop: 6, opacity: 0.7 }}>
                Клик по символу — поворот на 90°
              </div>
            </div>
          )}

          {/* Цвет */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3, color: 'var(--accent)', display: 'block', marginBottom: 8 }}>// ЦВЕТ ОРГАНИЗАЦИИ</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CLAN_COLORS.map(c => (
                <button key={c.value} onClick={() => setColor(c.value)} title={c.label} style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: c.value,
                  border: `2px solid ${color === c.value ? '#fff' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: color === c.value ? `0 0 12px ${c.value}` : 'none',
                }} />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#FF006E', letterSpacing: 1, padding: '8px 12px', border: '1px solid rgba(255,0,110,0.3)', borderRadius: 6, background: 'rgba(255,0,110,0.06)' }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{
            padding: '14px 0', borderRadius: 8, border: 'none',
            background: '#00FFF0', color: '#000',
            fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 3, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '...' : '⬡ ОСНОВАТЬ ОРГАНИЗАЦИЮ'}
          </button>
        </div>
      </main>
    </div>
  )
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
