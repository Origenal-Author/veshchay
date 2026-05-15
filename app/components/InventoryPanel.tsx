'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import PetCanvas from './PetCanvas'
import { getPetDef, RARITY_COLOR, RARITY_GLOW, getStageProgress, getNextStage, STAGE_XP, type Pet } from '@/lib/pets'
import { ACHIEVEMENTS } from '@/lib/achievements'

type Tab = 'pets' | 'achievements'

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`
}

// ── ДЕТАЛЬНЫЙ ВИД ПИТОМЦА ─────────────────────────────────────────────────────
function PetDetail({ pet, onBack }: { pet: Pet; onBack: () => void }) {
  const def = getPetDef(pet.type)
  const isVirus = pet.variant === 'virus'
  const C = isVirus ? def.colorVirus : def.color
  const rColor = RARITY_COLOR[def.rarity]
  const rGlow = RARITY_GLOW[def.rarity]
  const progress = getStageProgress(pet.stage, pet.stage_xp)
  const nextStage = getNextStage(pet.stage)
  const stageLabel: Record<string, string> = { egg: 'ЯЙЦО', baby: 'ДЕТЁНЫШ', adult: 'ВЗРОСЛЫЙ' }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#506080', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 2, marginBottom: 12, padding: 0 }}>
        ← НАЗАД
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          padding: 20, borderRadius: 16,
          border: `1px solid rgba(${hexToRgb(C)},0.3)`,
          background: `radial-gradient(ellipse at center, rgba(${hexToRgb(C)},0.06), transparent 70%)`,
        }}>
          <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={100} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 14, letterSpacing: 3, color: C, textShadow: `0 0 10px ${C}` }}>
            {def.nameRu}
          </div>
          <span style={{
            display: 'inline-block', marginTop: 6,
            fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 2,
            color: rColor, border: `1px solid ${rColor}`,
            background: `rgba(${hexToRgb(rColor)},0.1)`,
            padding: '2px 10px', borderRadius: 4,
            boxShadow: `0 0 6px ${rGlow}`,
          }}>★ {def.rarityLabel}</span>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Тип */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 2 }}>ТИП</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: C }}>{isVirus ? '// ВИРУС //' : '// КОД //'}</span>
          </div>

          {/* Стадия */}
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 2 }}>СТАДИЯ</span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: C }}>{stageLabel[pet.stage]}</span>
            </div>
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 2, background: C, boxShadow: `0 0 4px ${C}`, transition: 'width 0.5s' }} />
            </div>
            {nextStage && (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#3A4A5A', marginTop: 4 }}>
                {pet.stage_xp} / {STAGE_XP[nextStage]} XP питомца
              </div>
            )}
          </div>

          {/* Кормлений */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 2 }}>КОРМЛЕНИЙ</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#E0E8F0' }}>{pet.feed_count ?? 0}</span>
          </div>

          {/* Способность */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#3A4A5A', letterSpacing: 3, marginBottom: 6 }}>СПОСОБНОСТЬ</div>
            <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 11, color: '#C0C8D0', lineHeight: 1.6 }}>
              {isVirus ? def.abilityVirus : def.abilityKod}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ТАБ ПАРАЗИТОВ ─────────────────────────────────────────────────────────────
function PetsTab({ pets }: { pets: Pet[] }) {
  const [selected, setSelected] = useState<Pet | null>(null)
  if (selected) return <PetDetail pet={selected} onBack={() => setSelected(null)} />

  if (pets.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 2, lineHeight: 2 }}>
      // НЕТ ПИТОМЦЕВ //<br />Разблокируй ИНКУБАТОР<br />достигнув 500 XP
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {pets.map(pet => {
        const def = getPetDef(pet.type)
        const isVirus = pet.variant === 'virus'
        const C = isVirus ? def.colorVirus : def.color
        const stageLabel: Record<string, string> = { egg: 'ЯЙЦО', baby: 'ДЕТЁНЫШ', adult: 'ВЗРОСЛЫЙ' }
        const progress = getStageProgress(pet.stage, pet.stage_xp)
        return (
          <button key={pet.id} onClick={() => setSelected(pet)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
            border: `1px solid rgba(${hexToRgb(C)},0.2)`,
            background: `rgba(${hexToRgb(C)},0.04)`,
            transition: 'all 0.2s',
          }}>
            <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 2, color: C }}>{def.nameRu}</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#506080', marginTop: 2, letterSpacing: 1 }}>
                {stageLabel[pet.stage]} · {isVirus ? 'ВИРУС' : 'КОД'} · {def.rarityLabel}
              </div>
              <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, marginTop: 5 }}>
                <div style={{ width: `${progress}%`, height: '100%', borderRadius: 1, background: C }} />
              </div>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A' }}>›</span>
          </button>
        )
      })}
      {Array.from({ length: 3 - pets.length }).map((_, i) => (
        <div key={i} style={{
          padding: '12px', borderRadius: 8, textAlign: 'center',
          border: '1px dashed rgba(255,255,255,0.05)',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#2A3240', letterSpacing: 2,
        }}>// СЛОТ СВОБОДЕН</div>
      ))}
    </div>
  )
}

// ── ТАБ АЧИВОК ────────────────────────────────────────────────────────────────
function AchievementsTab({ unlockedKeys }: { unlockedKeys: string[] }) {
  const has = new Set(unlockedKeys)
  const unlocked = ACHIEVEMENTS.filter(a => has.has(a.key))
  const locked = ACHIEVEMENTS.filter(a => !has.has(a.key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#506080', letterSpacing: 2, marginBottom: 4 }}>
        {unlocked.length}/{ACHIEVEMENTS.length} разблокировано
      </div>
      {unlocked.map(ach => (
        <div key={ach.key} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6,
          border: '1px solid rgba(0,255,240,0.15)', background: 'rgba(0,255,240,0.03)',
        }}>
          <span style={{ fontSize: 18 }}>{ach.icon}</span>
          <div>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 1, color: '#E0E8F0' }}>{ach.name}</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: '#506080', marginTop: 2 }}>{ach.description}</div>
          </div>
        </div>
      ))}
      {locked.length > 0 && (
        <>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: '#2A3240', letterSpacing: 2, margin: '8px 0 4px' }}>// ЗАБЛОКИРОВАННЫЕ</div>
          {locked.map(ach => (
            <div key={ach.key} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.04)', opacity: 0.4,
            }}>
              <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{ach.secret ? '?' : ach.icon}</span>
              <div>
                <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 1, color: '#506080' }}>
                  {ach.secret ? '???' : ach.name}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────────────────────
export default function InventoryPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('pets')
  const [pets, setPets] = useState<Pet[]>([])
  const [unlockedKeys, setUnlockedKeys] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!open || !userId) return
    const sb = createClient()
    Promise.all([
      sb.from('pets').select('*').eq('user_id', userId).order('created_at'),
      sb.from('achievements').select('key').eq('user_id', userId),
    ]).then(([pRes, aRes]) => {
      setPets((pRes.data ?? []) as Pet[])
      setUnlockedKeys(aRes.data?.map(a => a.key) ?? [])
    })
  }, [open, userId])

  if (!userId) return null

  return (
    <>
      {/* Кнопка-триггер */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Инвентарь"
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 9990,
          width: 44, height: 44, borderRadius: 10,
          border: `1px solid ${open ? 'rgba(0,255,240,0.5)' : 'rgba(0,255,240,0.2)'}`,
          background: open ? 'rgba(0,255,240,0.08)' : 'rgba(6,6,18,0.9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 0 20px rgba(0,255,240,0.2)' : 'none',
          transition: 'all 0.2s', backdropFilter: 'blur(8px)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="6" width="16" height="12" rx="2" stroke="#00FFF0" strokeWidth="1.2" fill="rgba(0,255,240,0.05)"/>
          <path d="M7 6V5a3 3 0 0 1 6 0v1" stroke="#00FFF0" strokeWidth="1.2" fill="none"/>
          <line x1="6" y1="11" x2="14" y2="11" stroke="#00FFF0" strokeWidth="1" opacity="0.5"/>
          <line x1="6" y1="14" x2="11" y2="14" stroke="#00FFF0" strokeWidth="1" opacity="0.5"/>
        </svg>
      </button>

      {/* Панель */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 78, left: 24, zIndex: 9989,
          width: 300, maxHeight: '72vh',
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(0,255,240,0.15)',
          background: 'rgba(6,6,18,0.97)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 40px rgba(0,255,240,0.08)',
          animation: 'slideInUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Шапка */}
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(0,255,240,0.03)',
          }}>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 4, color: '#00FFF0' }}>
              // ИНВЕНТАРЬ
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#506080', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
          </div>

          {/* Табы */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['pets', 'achievements'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px 4px',
                fontFamily: 'Orbitron,monospace', fontSize: 7, letterSpacing: 2,
                color: tab === t ? '#00FFF0' : '#3A4A5A',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${tab === t ? '#00FFF0' : 'transparent'}`,
                transition: 'all 0.2s',
              }}>
                {t === 'pets' ? `ПАРАЗИТЫ ${pets.length}/3` : `АЧИВКИ ${unlockedKeys.length}/19`}
              </button>
            ))}
          </div>

          {/* Контент */}
          <div style={{ overflowY: 'auto', flex: 1, padding: 12 }}>
            {tab === 'pets' && <PetsTab pets={pets} />}
            {tab === 'achievements' && <AchievementsTab unlockedKeys={unlockedKeys} />}
          </div>
        </div>
      )}
    </>
  )
}
