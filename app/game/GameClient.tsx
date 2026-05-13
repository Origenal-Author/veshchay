'use client'

import { useState, useEffect, useRef } from 'react'
import PetCanvas from '@/app/components/PetCanvas'
import {
  getPetDef, RARITY_COLOR, RARITY_GLOW,
  getStageProgress, getNextStage, STAGE_XP,
  type Pet,
} from '@/lib/pets'

type Phase = 'locked' | 'choose' | 'opening' | 'revealed' | 'has-pet'

interface Props {
  userId: string
  xp: number
  existingPet: Pet | null
}

const BOX_LABELS = ['КОНТЕЙНЕР А', 'КОНТЕЙНЕР Б', 'КОНТЕЙНЕР В']

// Одинаковая SVG-коробка для всех трёх
function CrateIcon({ glowing }: { glowing?: boolean }) {
  const C = glowing ? '#00FFF0' : '#3A5060'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Тело */}
      <rect x="8" y="28" width="64" height="44" rx="4" fill={`rgba(${glowing ? '0,255,240' : '20,40,60'},0.12)`} stroke={C} strokeWidth="1.5"/>
      {/* Крышка */}
      <path d="M4 24 L40 14 L76 24 L76 30 L40 20 L4 30 Z" fill={`rgba(${glowing ? '0,255,240' : '20,40,60'},0.18)`} stroke={C} strokeWidth="1.5"/>
      {/* Полоса по центру */}
      <line x1="8" y1="50" x2="72" y2="50" stroke={C} strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
      {/* Замок */}
      <rect x="33" y="44" width="14" height="12" rx="2" fill={`rgba(${glowing ? '0,255,240' : '20,40,60'},0.3)`} stroke={C} strokeWidth="1.2"/>
      <path d="M36 44 C36 40 44 40 44 44" stroke={C} strokeWidth="1.2" fill="none"/>
      {/* ? внутри замка */}
      <text x="40" y="53.5" textAnchor="middle" fill={C} fontSize="7" fontFamily="Orbitron,monospace" fontWeight="700">?</text>
      {/* Уголки */}
      <circle cx="8" cy="28" r="2" fill={C} opacity="0.6"/>
      <circle cx="72" cy="28" r="2" fill={C} opacity="0.6"/>
      <circle cx="8" cy="72" r="2" fill={C} opacity="0.6"/>
      <circle cx="72" cy="72" r="2" fill={C} opacity="0.6"/>
    </svg>
  )
}

// Среда обитания
function PetHabitat({ pet }: { pet: Pet }) {
  const def = getPetDef(pet.type)
  const isVirus = pet.variant === 'virus'
  const C = isVirus ? def.colorVirus : def.color
  const [mood, setMood] = useState<'idle' | 'happy' | 'annoyed'>('idle')
  const [clicks, setClicks] = useState(0)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([])
  const particleId = useRef(0)

  const moodMessages = isVirus
    ? ['...', 'ОТСТАНЬ', '!!!', 'ГРР', 'ХА-ХА']
    : ['♥', 'хи-хи', ':)', '~', '!']

  function handlePetClick() {
    const newClicks = clicks + 1
    setClicks(newClicks)
    setMood('happy')
    setTimeout(() => setMood('idle'), 1000)

    const msg = moodMessages[Math.floor(Math.random() * moodMessages.length)]
    const id = particleId.current++
    setParticles(p => [...p, { id, x: 40 + (Math.random() - 0.5) * 60, y: 20, text: msg }])
    setTimeout(() => setParticles(p => p.filter(x => x.id !== id)), 1200)
  }

  // Среда КОД: сетка + плавающий код
  // Среда ВИРУС: глитч + красные помехи
  const envBg = isVirus
    ? 'radial-gradient(ellipse at 50% 40%, rgba(255,0,110,0.08) 0%, rgba(60,0,20,0.3) 60%, rgba(6,6,18,0.95) 100%)'
    : 'radial-gradient(ellipse at 50% 40%, rgba(0,212,255,0.08) 0%, rgba(0,20,40,0.3) 60%, rgba(6,6,18,0.95) 100%)'

  const borderColor = isVirus ? 'rgba(255,0,110,0.3)' : 'rgba(0,212,255,0.3)'

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Окошко-среда обитания */}
      <div style={{
        position: 'relative',
        borderRadius: 20,
        border: `1px solid ${borderColor}`,
        background: envBg,
        overflow: 'hidden',
        boxShadow: `0 0 40px rgba(${isVirus ? '255,0,110' : '0,212,255'},0.12)`,
      }}>
        {/* Заголовок окна */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          borderBottom: `1px solid ${borderColor}`,
          background: 'rgba(6,6,18,0.6)',
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#FF5F56', '#FFBD2E', '#27C93F'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C, letterSpacing: 2, marginLeft: 8 }}>
            {isVirus ? '// ЗОНА ЗАРАЖЕНИЯ //' : '// ЦИФРОВОЕ ГНЕЗДО //'}
          </div>
        </div>

        {/* Фоновая сетка / глитч */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: isVirus
            ? `repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,0,110,0.04) 18px, rgba(255,0,110,0.04) 19px),
               repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(255,0,110,0.04) 18px, rgba(255,0,110,0.04) 19px)`
            : `repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,212,255,0.04) 20px, rgba(0,212,255,0.04) 21px),
               repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,212,255,0.04) 20px, rgba(0,212,255,0.04) 21px)`,
        }} />

        {/* Плавающие символы на фоне */}
        <FloatingSymbols isVirus={isVirus} C={C} />

        {/* Питомец */}
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 0 16px', display: 'flex', justifyContent: 'center' }}>
          <div
            onClick={handlePetClick}
            style={{
              cursor: 'pointer',
              transform: mood === 'happy' ? 'scale(1.12) translateY(-6px)' : 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              filter: mood === 'happy' ? `drop-shadow(0 0 16px ${C})` : 'none',
            }}
          >
            <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={180} />
          </div>

          {/* Всплывающие эмоции */}
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute',
              left: `calc(50% + ${p.x}px)`,
              top: p.y,
              fontFamily: 'JetBrains Mono,monospace',
              fontSize: 14,
              color: C,
              fontWeight: 700,
              animation: 'floatUp 1.2s ease forwards',
              pointerEvents: 'none',
              textShadow: `0 0 8px ${C}`,
              zIndex: 10,
            }}>
              {p.text}
            </div>
          ))}
        </div>

        {/* Подсказка */}
        <div style={{ textAlign: 'center', padding: '0 0 16px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 2 }}>
            нажми на паразита
          </div>
        </div>

        {/* Счётчик взаимодействий */}
        {clicks > 0 && (
          <div style={{
            position: 'absolute', top: 48, right: 16, zIndex: 3,
            fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
            color: C, opacity: 0.5, letterSpacing: 1,
          }}>
            касаний: {clicks}
          </div>
        )}
      </div>

      {/* Инфо под окном */}
      <PetInfo pet={pet} def={def} C={C} />
    </div>
  )
}

// Плавающие символы на фоне среды
function FloatingSymbols({ isVirus, C }: { isVirus: boolean; C: string }) {
  const symbols = isVirus
    ? ['ERR', '!!', 'X0X', '///','404','BUG','$$$','???']
    : ['010', '{}', '</>','||','fn()','=>','42','::']

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {symbols.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 137) % 90 + 2}%`,
          top: `${(i * 97 + 20) % 80}%`,
          fontFamily: 'JetBrains Mono,monospace',
          fontSize: 10,
          color: C,
          opacity: 0.08 + (i % 3) * 0.04,
          letterSpacing: 1,
          animation: `floatSym ${4 + i * 0.7}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }}>
          {s}
        </div>
      ))}
    </div>
  )
}

// Инфо-панель питомца
function PetInfo({ pet, def, C }: { pet: Pet; def: ReturnType<typeof getPetDef>; C: string }) {
  const rColor = RARITY_COLOR[def.rarity]
  const rGlow = RARITY_GLOW[def.rarity]
  const progress = getStageProgress(pet.stage, pet.stage_xp)
  const nextStage = getNextStage(pet.stage)
  const stageLabel: Record<string, string> = { egg: 'ЯЙЦО', baby: 'ДЕТЁНЫШ', adult: 'ВЗРОСЛЫЙ' }

  return (
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Имя и ранг */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, letterSpacing: 4, color: C, textShadow: `0 0 12px ${C}` }}>
          {def.nameRu}
        </div>
        <span style={{
          fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 3,
          color: rColor, border: `1px solid ${rColor}`,
          background: `rgba(${hexToRgbStr(rColor)},0.1)`,
          padding: '3px 10px', borderRadius: 4,
          boxShadow: `0 0 8px ${rGlow}`,
        }}>
          ★ {def.rarityLabel}
        </span>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 2 }}>
        {pet.variant === 'kod' ? '// КОД — безобидный //' : '// ВИРУС — проказник //'}
      </div>

      {/* Прогресс стадии */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 1 }}>
            СТАДИЯ: <span style={{ color: C }}>{stageLabel[pet.stage]}</span>
          </span>
          {nextStage && (
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 1 }}>
              → {stageLabel[nextStage]} при {STAGE_XP[nextStage]} XP
            </span>
          )}
        </div>
        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <div style={{ width: `${progress}%`, height: '100%', borderRadius: 2, background: C, boxShadow: `0 0 6px ${C}`, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Способность */}
      <div style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,6,18,0.5)' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 3, marginBottom: 6 }}>СПОСОБНОСТЬ</div>
        <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 13, color: '#C0C8D0', lineHeight: 1.6 }}>
          {pet.variant === 'kod' ? def.abilityKod : def.abilityVirus}
        </div>
      </div>

      {/* Шансы */}
      <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(13,13,26,0.4)' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 3, marginBottom: 10 }}>// ШАНСЫ //</div>
        {[
          { label: 'ЧАСТЫЙ', pct: '50%', color: '#8892B0' },
          { label: 'РЕДКИЙ', pct: '42%', color: '#00FFF0' },
          { label: 'ОСОБЫЙ', pct: '7%', color: '#B44FFF' },
          { label: 'ЛЕГЕНДАРНЫЙ', pct: '1%', color: '#FF88FF' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
            <div style={{ width: 90, fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 2, color: r.color }}>{r.label}</div>
            <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <div style={{ width: r.pct, height: '100%', background: r.color, borderRadius: 2 }} />
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: r.color, width: 28, textAlign: 'right' }}>{r.pct}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────────────────────
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
    if (data.pet) { setPet(data.pet); setPhase('revealed') }
    setLoading(false)
  }

  const def = pet ? getPetDef(pet.type) : null
  const C = def ? (pet!.variant === 'virus' ? def.colorVirus : def.color) : '#00FFF0'
  const rColor = def ? RARITY_COLOR[def.rarity] : '#00FFF0'
  const rGlow = def ? RARITY_GLOW[def.rarity] : 'transparent'

  if (phase === 'locked') return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🔒</div>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, color: '#8892B0', letterSpacing: 4 }}>ДОСТУП ЗАКРЫТ</div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', marginTop: 12, letterSpacing: 2 }}>
          Достигни ранга <span style={{ color: '#00FF88' }}>ВЗЛОМЩИК</span> (500 XP)
        </div>
        <div style={{ width: 240, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '16px auto 0' }}>
          <div style={{ width: `${Math.min(100, (xp / 500) * 100)}%`, height: '100%', background: '#00FF88', borderRadius: 2, boxShadow: '0 0 8px #00FF88' }} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', marginTop: 8 }}>
          {xp} / 500 XP
        </div>
      </div>
    </div>
  )

  if (phase === 'choose') return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', letterSpacing: 2 }}>
          // выбери один контейнер — внутри твой паразит //
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 60, flexWrap: 'wrap' }}>
        {BOX_LABELS.map((label, i) => (
          <button key={i} onClick={() => handleBox(i)} style={boxStyle} className="game-box">
            <CrateIcon />
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3, color: '#8892B0', marginTop: 16 }}>
              {label}
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

  if (phase === 'opening') return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 60, flexWrap: 'wrap' }}>
        {BOX_LABELS.map((label, i) => (
          <div key={i} style={{
            ...boxStyle,
            opacity: i === selected ? 1 : 0.15,
            transform: i === selected ? 'scale(1.1)' : 'scale(0.88)',
            animation: i === selected ? 'boxShake 0.4s ease-in-out infinite' : 'none',
            transition: 'all 0.5s ease',
          }}>
            <CrateIcon glowing={i === selected} />
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3, color: i === selected ? 'var(--accent)' : '#8892B0', marginTop: 16 }}>
              {label}
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

  if (phase === 'revealed' && pet && def) return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', letterSpacing: 3, marginBottom: 24 }}>
          // новый паразит получен //
        </div>
        <div style={{
          display: 'inline-block', padding: 40, borderRadius: 20,
          border: `1px solid ${rColor}`,
          background: `radial-gradient(ellipse at center, ${rGlow}, transparent 70%)`,
          boxShadow: `0 0 40px ${rGlow}, 0 0 80px ${rGlow}`,
          animation: 'revealPop 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <PetCanvas type={pet.type} variant={pet.variant} stage="egg" size={160} />
        </div>
        <div style={{ marginTop: 20 }}>
          <span style={{ fontFamily: 'Orbitron,monospace', fontSize: 11, letterSpacing: 4, color: rColor, border: `1px solid ${rColor}`, background: `rgba(${hexToRgbStr(rColor)},0.1)`, padding: '4px 16px', borderRadius: 4, boxShadow: `0 0 10px ${rGlow}` }}>
            ★ {def.rarityLabel}
          </span>
        </div>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 28, letterSpacing: 6, color: C, marginTop: 20, textShadow: `0 0 20px ${C}` }}>
          {def.nameRu}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', letterSpacing: 2, marginTop: 6 }}>
          {pet.variant === 'kod' ? '// КОД //' : '// ВИРУС //'}
        </div>
        <div style={{ marginTop: 24, padding: '16px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.6)', maxWidth: 380, margin: '24px auto 0' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 3, marginBottom: 8 }}>УНИКАЛЬНАЯ СПОСОБНОСТЬ</div>
          <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 14, color: '#C0C8D0', lineHeight: 1.6 }}>
            {pet.variant === 'kod' ? def.abilityKod : def.abilityVirus}
          </div>
        </div>
        <button onClick={() => setPhase('has-pet')} style={{ ...btnStyle, marginTop: 32, borderColor: C, color: C, boxShadow: `0 0 12px ${rGlow}` }}>
          ПРИНЯТЬ ПАРАЗИТА
        </button>
      </div>
    </div>
  )

  if (phase === 'has-pet' && pet && def) return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <PetHabitat pet={pet} />
    </div>
  )

  return null
}

// ── СТИЛИ ─────────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = { maxWidth: 620, margin: '0 auto', padding: '40px 32px' }

const titleStyle: React.CSSProperties = {
  fontFamily: 'Orbitron,monospace', fontSize: 28, letterSpacing: 8,
  color: 'var(--accent)', marginBottom: 16, textShadow: '0 0 20px var(--accent-glow)',
}

const boxStyle: React.CSSProperties = {
  position: 'relative', width: 180, padding: '28px 20px',
  borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(13,13,26,0.8)', cursor: 'pointer',
  textAlign: 'center', transition: 'all 0.25s ease', backdropFilter: 'blur(8px)',
}

const boxGlowBar: React.CSSProperties = {
  position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 1,
  background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.4,
}

const btnStyle: React.CSSProperties = {
  fontFamily: 'Orbitron,monospace', fontSize: 11, letterSpacing: 4,
  padding: '12px 36px', borderRadius: 8, border: '1px solid',
  background: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
}

function hexToRgbStr(hex: string): string {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}
