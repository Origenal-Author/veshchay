'use client'

import { useEffect, useState } from 'react'
import { CLOTHING, type ClothingItem, type ClothingSlot } from '@/lib/clothing'
import { PAW_POSITIONS } from '@/app/components/PetCanvas'
import ByteIcon from '@/app/components/ByteIcon'
import type { Pet } from '@/lib/pets'

const SLOT_LABELS: Record<ClothingSlot, string> = {
  head: 'ГОЛОВА', face: 'ЛИЦО', neck: 'ШЕЯ', paw: 'ЛАПКА',
}

const STYLE_COLORS: Record<string, string> = {
  cute: '#FF66CC', cool: '#00FFF0', evil: '#FF006E', royal: '#FFD700', casual: '#00FF88',
}

interface Props {
  pet: Pet
  onClose: () => void
  onEquipChange: (newEquipped: string[]) => void
  onMessage: (text: string, mood: string) => void
}

export default function ClothingShop({ pet, onClose, onEquipChange, onMessage }: Props) {
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [equipped, setEquipped] = useState<string[]>(pet.equipped ?? [])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [activeSlot, setActiveSlot] = useState<ClothingSlot>('head')
  const [error, setError] = useState<string | null>(null)
  const isVirus = pet.variant === 'virus'

  useEffect(() => {
    fetch('/api/clothing').then(r => r.json()).then(data => {
      setOwned(new Set(data.owned ?? []))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function buy(item: ClothingItem) {
    setBusy(item.key); setError(null)
    try {
      const res = await fetch('/api/clothing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey: item.key }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка'); return }
      setOwned(prev => new Set([...prev, item.key]))
    } finally { setBusy(null) }
  }

  async function toggleEquip(item: ClothingItem) {
    setBusy(item.key); setError(null)
    try {
      const currentlyEquipped = equipped.includes(item.key)
      let newEquipped: string[]
      if (currentlyEquipped) {
        newEquipped = equipped.filter(k => k !== item.key)
      } else {
        // Снимаем все другие предметы того же слота
        const itemsBySlot = new Map(CLOTHING.map(c => [c.key, c.slot]))
        newEquipped = equipped.filter(k => itemsBySlot.get(k) !== item.slot)
        newEquipped.push(item.key)
      }
      const res = await fetch(`/api/pets/${pet.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipped: newEquipped }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка'); return }
      setEquipped(newEquipped)
      onEquipChange(newEquipped)

      // Реакция при надевании (не при снятии)
      if (!currentlyEquipped) {
        const { pickReactionMessage } = await import('@/lib/clothing')
        const r = pickReactionMessage(item, isVirus)
        onMessage(r.text, r.mood)
      }
    } finally { setBusy(null) }
  }

  const itemsInSlot = CLOTHING.filter(c => c.slot === activeSlot)
  // Для слота paw — проверяем что у питомца есть конечность
  const pawAvailable = activeSlot !== 'paw' || PAW_POSITIONS[pet.type] !== null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 760, maxHeight: '90vh',
        background: 'rgba(6,6,18,0.98)', borderRadius: 12,
        border: '1px solid rgba(0,255,240,0.3)',
        boxShadow: '0 0 40px rgba(0,255,240,0.15)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Шапка */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
          borderBottom: '1px solid rgba(0,255,240,0.15)', background: 'rgba(6,6,18,0.6)',
        }}>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 13, letterSpacing: 4, color: '#00FFF0', flex: 1 }}>
            👕 ШМОТКИ ПИТОМЦА
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,0,110,0.1)', border: '1px solid #FF006E', color: '#FF006E',
            padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 2,
          }}>✕ ЗАКРЫТЬ</button>
        </div>

        {/* Табы слотов */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {(Object.keys(SLOT_LABELS) as ClothingSlot[]).map(slot => (
            <button key={slot} onClick={() => setActiveSlot(slot)} style={{
              flex: 1, padding: '8px', borderRadius: 6,
              border: `1px solid ${activeSlot === slot ? '#00FFF0' : 'rgba(255,255,255,0.08)'}`,
              background: activeSlot === slot ? 'rgba(0,255,240,0.08)' : 'transparent',
              color: activeSlot === slot ? '#00FFF0' : '#506080',
              fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 2,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{SLOT_LABELS[slot]}</button>
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 16px', color: '#FF006E', fontSize: 11, background: 'rgba(255,0,110,0.06)' }}>
            ⚠ {error}
          </div>
        )}

        {!pawAvailable && (
          <div style={{
            margin: '10px 16px 0', padding: '10px 14px', borderRadius: 6,
            border: '1px dashed rgba(255,189,46,0.4)',
            background: 'rgba(255,189,46,0.06)',
            color: '#FFBD2E', fontSize: 10, letterSpacing: 1, lineHeight: 1.5,
          }}>
            ⚠ у этого питомца нет подходящей конечности — браслет невозможно надеть
          </div>
        )}

        {/* Сетка предметов */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#506080', padding: 40 }}>загрузка...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {itemsInSlot.map(item => {
                const isOwned = owned.has(item.key)
                const isEquipped = equipped.includes(item.key)
                const styleColor = STYLE_COLORS[item.style] || '#00FFF0'
                return (
                  <div key={item.key} style={{
                    padding: 14, borderRadius: 10,
                    border: `1px solid ${isEquipped ? '#00FF88' : 'rgba(255,255,255,0.08)'}`,
                    background: isEquipped ? 'rgba(0,255,136,0.05)' : 'rgba(13,13,26,0.7)',
                    transition: 'border 0.15s',
                  }}>
                    <div style={{
                      width: '100%', height: 80, marginBottom: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'radial-gradient(circle, rgba(0,255,240,0.04), transparent 70%)',
                      borderRadius: 6,
                    }}>
                      <svg viewBox="0 0 100 100" width="80" height="80" dangerouslySetInnerHTML={{ __html: item.svg }} />
                    </div>
                    <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 1.5, color: '#00FFF0', marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: styleColor, letterSpacing: 1, marginBottom: 8 }}>
                      // {item.style.toUpperCase()}
                    </div>
                    {isOwned ? (
                      <button
                        onClick={() => toggleEquip(item)}
                        disabled={busy === item.key || (item.slot === 'paw' && !pawAvailable)}
                        title={item.slot === 'paw' && !pawAvailable ? 'Нет подходящей конечности' : undefined}
                        style={{
                          width: '100%', padding: '6px', borderRadius: 4,
                          border: `1px solid ${isEquipped ? '#FF006E' : '#00FF88'}`,
                          background: isEquipped ? 'rgba(255,0,110,0.1)' : 'rgba(0,255,136,0.1)',
                          color: isEquipped ? '#FF006E' : '#00FF88',
                          fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 2,
                          cursor: (busy === item.key || (item.slot === 'paw' && !pawAvailable)) ? 'default' : 'pointer',
                          opacity: (busy === item.key || (item.slot === 'paw' && !pawAvailable)) ? 0.4 : 1,
                        }}
                      >
                        {busy === item.key ? '...' : isEquipped ? '✕ СНЯТЬ' : '✓ НАДЕТЬ'}
                      </button>
                    ) : (
                      <button
                        onClick={() => buy(item)}
                        disabled={busy === item.key}
                        style={{
                          width: '100%', padding: '6px', borderRadius: 4,
                          border: '1px solid #FFD700',
                          background: 'rgba(255,215,0,0.08)', color: '#FFD700',
                          fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 2,
                          cursor: busy === item.key ? 'default' : 'pointer',
                          opacity: busy === item.key ? 0.5 : 1,
                        }}
                      >
                        {busy === item.key
                          ? '...'
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                              <ByteIcon size={12} glow={false} />
                              {item.price}
                            </span>}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
