'use client'

import { useState } from 'react'
import PetCanvas from '@/app/components/PetCanvas'
import {
  getPetDef, RARITY_COLOR, RARITY_GLOW,
  getStageProgress, getNextStage, STAGE_XP,
  type Pet, type PetType, type PetVariant,
} from '@/lib/pets'

type Phase = 'locked' | 'choose' | 'opening' | 'revealed' | 'has-pet'

interface Props {
  userId: string
  xp: number
  existingPet: Pet | null
}

const BOX_ICONS = ['📦', '🗃️', '📁']
const BOX_LABELS = ['КОНТЕЙНЕР А', 'КОНТЕЙНЕР Б', 'КОНТЕЙНЕР В']

export default function GameClient({ userId, xp, existingPet }: Props) {
  const [phase, setPhase] = useState<Phase>(
    xp < 500 ? 'locked' : existingPet ? 'has-pet' : 'choose'
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [pet, setPet] = useState<Pet | null>(existingPet)
  const [loading, setLoading] = useState(false)

  async function handleBox(i: number) {
    if (phase !== 'choose' || loading) return
    setSelected(i)
    setPhase('opening')
    setLoading(true)
    await new Promise(r => setTimeout(r, 1600))
    const res = await fetch('/api/pets/claim', { method: 'POST' })
    const data = await res.json()
    if (data.pet) {
      setPet(data.pet)
      setPhase('revealed')
    }
    setLoading(false)
  }

  const def = pet ? getPetDef(pet.type) : null
  const C = def ? (pet!.variant === 'virus' ? def.colorVirus : def.color) : '#00FFF0'
  const rColor = def ? RARITY_COLOR[def.rarity] : '#00FFF0'
  const rGlow = def ? RARITY_GLOW[def.rarity] : 'transparent'

  // ── ЗАБЛОКИРОВАНО ──────────────────────────────────────────────────────────
  if (phase === 'locked') {
    return (
      <div style={pageStyle}>
        <div style={titleStyle}>ИГРЫ</div>
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🔒</div>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, color: '#8892B0', letterSpacing: 4 }}>
            ДОСТУП ЗАКРЫТ
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', marginTop: 12, letterSpacing: 2 }}>
            Достигни ранга <span style={{ color: '#00FF88' }}>ВЗЛОМЩИК</span> (500 XP) чтобы открыть
          </div>
          <div style={{ marginTop: 24, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080' }}>
            Твой XP: <span style={{ color: '#8892B0' }}>{xp}</span> / 500
          </div>
          <div style={{ width: 240, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '12px auto 0' }}>
            <div style={{ width: `${Math.min(100, (xp / 500) * 100)}%`, height: '100%', background: '#00FF88', borderRadius: 2, boxShadow: '0 0 8px #00FF88' }} />
          </div>
        </div>
      </div>
    )
  }

  // ── ВЫБОР КОРОБКИ ──────────────────────────────────────────────────────────
  if (phase === 'choose') {
    return (
      <div style={pageStyle}>
        <div style={titleStyle}>ИГРЫ</div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', letterSpacing: 2 }}>
            // выбери один контейнер — внутри твой паразит //
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 60, flexWrap: 'wrap' }}>
          {BOX_ICONS.map((icon, i) => (
            <button key={i} onClick={() => handleBox(i)} style={boxStyle} className="game-box">
              <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3, color: '#8892B0' }}>
                {BOX_LABELS[i]}
              </div>
              <div style={boxGlowBar} />
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 2 }}>
          Кристалл 1% · Особый 7% · Редкий 42% · Частый 50%
        </div>
      </div>
    )
  }

  // ── ОТКРЫТИЕ ───────────────────────────────────────────────────────────────
  if (phase === 'opening') {
    return (
      <div style={pageStyle}>
        <div style={titleStyle}>ИГРЫ</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 60, flexWrap: 'wrap' }}>
          {BOX_ICONS.map((icon, i) => (
            <div key={i} style={{
              ...boxStyle,
              opacity: i === selected ? 1 : 0.15,
              transform: i === selected ? 'scale(1.1)' : 'scale(0.88)',
              animation: i === selected ? 'boxShake 0.4s ease-in-out infinite' : 'none',
              transition: 'all 0.5s ease',
            }}>
              <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3, color: '#8892B0' }}>
                {BOX_LABELS[i]}
              </div>
              <div style={boxGlowBar} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', letterSpacing: 3, animation: 'pulse 1s ease-in-out infinite' }}>
          СКАНИРОВАНИЕ...
        </div>
      </div>
    )
  }

  // ── РАСКРЫТИЕ ───────────────────────────────────────────────────────────────
  if (phase === 'revealed' && pet && def) {
    return (
      <div style={pageStyle}>
        <div style={titleStyle}>ИГРЫ</div>
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', letterSpacing: 3, marginBottom: 24 }}>
            // новый паразит получен //
          </div>

          {/* Рамка существа */}
          <div style={{
            display: 'inline-block',
            padding: 40,
            borderRadius: 20,
            border: `1px solid ${rColor}`,
            background: `radial-gradient(ellipse at center, ${rGlow}, transparent 70%)`,
            boxShadow: `0 0 40px ${rGlow}, 0 0 80px ${rGlow}`,
            animation: 'revealPop 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <PetCanvas type={pet.type} variant={pet.variant} stage="egg" size={160} />
          </div>

          {/* Бейдж редкости */}
          <div style={{ marginTop: 20 }}>
            <span style={{
              fontFamily: 'Orbitron,monospace', fontSize: 11, letterSpacing: 4,
              color: rColor, border: `1px solid ${rColor}`,
              background: `rgba(${hexToRgbStr(rColor)},0.1)`,
              padding: '4px 16px', borderRadius: 4,
              boxShadow: `0 0 10px ${rGlow}`,
            }}>
              ★ {def.rarityLabel}
            </span>
          </div>

          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 28, letterSpacing: 6, color: C, marginTop: 20, textShadow: `0 0 20px ${C}` }}>
            {def.nameRu}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', letterSpacing: 2, marginTop: 6 }}>
            {pet.variant === 'kod' ? '// КОД //' : '// ВИРУС //'}
          </div>

          {/* Способность */}
          <div style={{
            marginTop: 24, padding: '16px 24px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(13,13,26,0.6)',
            maxWidth: 380, margin: '24px auto 0',
          }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 3, marginBottom: 8 }}>
              УНИКАЛЬНАЯ СПОСОБНОСТЬ
            </div>
            <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 14, color: '#C0C8D0', lineHeight: 1.6 }}>
              {pet.variant === 'kod' ? def.abilityKod : def.abilityVirus}
            </div>
          </div>

          <button
            onClick={() => setPhase('has-pet')}
            style={{ ...btnStyle, marginTop: 32, borderColor: C, color: C, boxShadow: `0 0 12px ${rGlow}` }}
          >
            ПРИНЯТЬ ПАРАЗИТА
          </button>
        </div>
      </div>
    )
  }

  // ── ПИТОМЕЦ ЕСТЬ ───────────────────────────────────────────────────────────
  if (phase === 'has-pet' && pet && def) {
    const progress = getStageProgress(pet.stage, pet.stage_xp)
    const nextStage = getNextStage(pet.stage)
    const stageLabel: Record<string, string> = { egg: 'ЯЙЦО', baby: 'ДЕТЁНЫШ', adult: 'ВЗРОСЛЫЙ' }

    return (
      <div style={pageStyle}>
        <div style={titleStyle}>ИГРЫ</div>

        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* Карточка питомца */}
          <div style={{
            background: 'rgba(13,13,26,0.8)',
            border: `1px solid ${rColor}`,
            borderRadius: 20,
            padding: '40px 48px',
            boxShadow: `0 0 30px ${rGlow}`,
            textAlign: 'center',
          }}>
            {/* Существо */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={180} />
            </div>

            {/* Бейдж редкости */}
            <div style={{ marginBottom: 12 }}>
              <span style={{
                fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3,
                color: rColor, border: `1px solid ${rColor}`,
                background: `rgba(${hexToRgbStr(rColor)},0.1)`,
                padding: '3px 12px', borderRadius: 4,
              }}>
                ★ {def.rarityLabel}
              </span>
            </div>

            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 22, letterSpacing: 5, color: C, textShadow: `0 0 16px ${C}`, marginBottom: 4 }}>
              {def.nameRu}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', letterSpacing: 2, marginBottom: 28 }}>
              {pet.variant === 'kod' ? '// КОД — безобидный //' : '// ВИРУС — проказник //'}
            </div>

            {/* Стадия и прогресс */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 2 }}>
                СТАДИЯ: <span style={{ color: C }}>{stageLabel[pet.stage]}</span>
              </span>
              {nextStage && (
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 2 }}>
                  → {stageLabel[nextStage]} ({STAGE_XP[nextStage]} XP)
                </span>
              )}
            </div>
            <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 28 }}>
              <div style={{
                width: `${progress}%`, height: '100%', borderRadius: 3,
                background: C, boxShadow: `0 0 8px ${C}`,
                transition: 'width 0.5s ease',
              }} />
            </div>

            {/* Способность */}
            <div style={{
              padding: '14px 20px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(6,6,18,0.5)',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 3, marginBottom: 6 }}>
                УНИКАЛЬНАЯ СПОСОБНОСТЬ
              </div>
              <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 13, color: '#C0C8D0', lineHeight: 1.6 }}>
                {pet.variant === 'kod' ? def.abilityKod : def.abilityVirus}
              </div>
            </div>
          </div>

          {/* Таблица редкостей */}
          <div style={{ marginTop: 40, padding: '20px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,13,26,0.5)' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 3, marginBottom: 16 }}>
              // ШАНСЫ ВЫПАДЕНИЯ //
            </div>
            {[
              { label: 'ЧАСТЫЙ', pct: '50%', color: '#8892B0' },
              { label: 'РЕДКИЙ', pct: '42%', color: '#00FFF0' },
              { label: 'ОСОБЫЙ', pct: '7%', color: '#B44FFF' },
              { label: 'ЛЕГЕНДАРНЫЙ', pct: '1%', color: '#FF88FF' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 80, fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 2, color: r.color }}>{r.label}</div>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <div style={{ width: r.pct, height: '100%', background: r.color, borderRadius: 2, boxShadow: `0 0 6px ${r.color}` }} />
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: r.color, width: 32, textAlign: 'right' }}>{r.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ── СТИЛИ ──────────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  maxWidth: 860,
  margin: '0 auto',
  padding: '40px 32px',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'Orbitron,monospace',
  fontSize: 28,
  letterSpacing: 8,
  color: 'var(--accent)',
  marginBottom: 8,
  textShadow: '0 0 20px var(--accent-glow)',
}

const boxStyle: React.CSSProperties = {
  position: 'relative',
  width: 200,
  padding: '32px 24px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(13,13,26,0.8)',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.25s ease',
  backdropFilter: 'blur(8px)',
}

const boxGlowBar: React.CSSProperties = {
  position: 'absolute',
  bottom: 0, left: '15%', right: '15%',
  height: 1,
  background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
  opacity: 0.4,
}

const btnStyle: React.CSSProperties = {
  fontFamily: 'Orbitron,monospace',
  fontSize: 11,
  letterSpacing: 4,
  padding: '12px 36px',
  borderRadius: 8,
  border: '1px solid',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

function hexToRgbStr(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
