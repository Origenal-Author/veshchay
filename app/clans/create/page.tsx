'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CLAN_SYMBOLS, CLAN_COLORS } from '@/lib/clans'

export default function CreateClanPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])
  const [color, setColor] = useState('#00FFF0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleSymbol(s: string) {
    setSelectedSymbols(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 3 ? [...prev, s] : prev
    )
  }

  async function submit() {
    if (!name.trim() || !tag.trim() || selectedSymbols.length === 0) {
      setError('Заполни имя, тег и выбери хотя бы 1 символ')
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/clans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tag, description, emblemSymbols: selectedSymbols, emblemColor: color }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push(`/clans/${data.clan.id}`)
  }

  const emblemPreview = selectedSymbols.join('')

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
          <div style={{
            width: 100, height: 100, borderRadius: 20,
            border: `2px solid ${color}`,
            background: `rgba(${hexToRgb(color)},0.08)`,
            boxShadow: `0 0 30px rgba(${hexToRgb(color)},0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', fontSize: selectedSymbols.length > 1 ? 28 : 40,
            color, transition: 'all 0.3s',
          }}>
            {emblemPreview || '?'}
          </div>
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
                  border: `1px solid ${selectedSymbols.includes(s) ? color : 'rgba(255,255,255,0.1)'}`,
                  background: selectedSymbols.includes(s) ? `rgba(${hexToRgb(color)},0.15)` : 'var(--surface)',
                  color: selectedSymbols.includes(s) ? color : 'var(--subtext)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: selectedSymbols.includes(s) ? `0 0 10px rgba(${hexToRgb(color)},0.3)` : 'none',
                }}>{s}</button>
              ))}
            </div>
          </div>

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
