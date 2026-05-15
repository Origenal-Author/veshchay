'use client'

import { useEffect, useState } from 'react'

interface HackEffect {
  id: string
  effect_type: string
  effect_data: Record<string, string>
  expires_at: string
}

async function cleanEffect(id: string) {
  await fetch('/api/hack/effects', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ effectId: id }),
  })
}

// Фейковая реклама
function FakeAdEffect({ effect, onClean }: { effect: HackEffect; onClean: () => void }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', zIndex: 99985,
      left: `${10 + Math.random() * 30}%`,
      top: `${10 + Math.random() * 30}%`,
      width: 280, background: 'rgba(6,6,18,0.98)',
      border: '1px solid #FF006E', borderRadius: 8,
      boxShadow: '0 0 30px rgba(255,0,110,0.35)',
      animation: 'popIn 0.4s ease',
      overflow: 'hidden',
    }}>
      <div style={{ background: 'rgba(255,0,110,0.18)', padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,0,110,0.3)' }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#FF006E', letterSpacing: 1 }}>📢 ВАЖНОЕ СООБЩЕНИЕ</span>
        <button onClick={async () => { setOpen(false); await cleanEffect(effect.id); onClean() }} style={{ background: 'rgba(255,0,110,0.2)', border: '1px solid #FF006E', color: '#FF006E', width: 18, height: 18, borderRadius: 3, cursor: 'pointer', fontSize: 10 }}>✕</button>
      </div>
      <div style={{ padding: '14px', fontFamily: 'Exo 2,sans-serif', fontSize: 13, color: '#E0E8F0', lineHeight: 1.7 }}>
        {effect.effect_data.text}
      </div>
      <div style={{ padding: '0 14px 12px' }}>
        <button onClick={async () => { setOpen(false); await cleanEffect(effect.id); onClean() }} style={{ width: '100%', padding: '6px', background: 'rgba(255,0,110,0.15)', border: '1px solid #FF006E', color: '#FF006E', fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 2, cursor: 'pointer', borderRadius: 4 }}>ЗАКРЫТЬ</button>
      </div>
    </div>
  )
}

// Взломанный ник — уведомление
function HackedNickEffect({ effect, onClean }: { effect: HackEffect; onClean: () => void }) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', bottom: 130, left: 24, zIndex: 99984,
      background: 'rgba(6,6,18,0.97)', border: '1px solid #FF006E',
      borderRadius: 10, padding: '12px 16px', width: 260,
      boxShadow: '0 0 20px rgba(255,0,110,0.3)', animation: 'slideInUp 0.3s ease',
    }}>
      <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 9, color: '#FF006E', letterSpacing: 3, marginBottom: 6 }}>⚡ ТЕБЯ ВЗЛОМАЛИ</div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#E0E8F0', marginBottom: 8 }}>
        Твой ник изменён на: <span style={{ color: '#FF006E' }}>{effect.effect_data.nick}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={async () => { await cleanEffect(effect.id); onClean(); setVisible(false) }} style={{ flex: 1, padding: '5px', background: 'rgba(255,0,110,0.1)', border: '1px solid #FF006E', color: '#FF006E', fontFamily: 'Orbitron,monospace', fontSize: 7, letterSpacing: 2, cursor: 'pointer', borderRadius: 4 }}>
          ВОССТАНОВИТЬ НИК
        </button>
      </div>
    </div>
  )
}

// Питомец-хаос — запускает PetWalker с тараканами
function PetChaosEffect({ effect, onClean }: { effect: HackEffect; onClean: () => void }) {
  useEffect(() => {
    // Запускаем хаос-питомца
    const chaosVirus = {
      id: `chaos_${effect.id}`,
      user_id: effect.effect_data.attacker_id || '',
      type: 'jellyfish' as const,
      variant: 'virus' as const,
      stage: 'adult' as const,
      stage_xp: 200, feed_count: 0, name: null,
      created_at: new Date().toISOString(),
    }
    window.dispatchEvent(new CustomEvent('pet-walk-start', { detail: { pet: chaosVirus } }))

    // Через 30 секунд убираем питомца
    const t = setTimeout(async () => {
      window.dispatchEvent(new CustomEvent('pet-walk-stop'))
      await cleanEffect(effect.id)
      onClean()
    }, 30000)
    return () => clearTimeout(t)
  }, [effect.id, effect.effect_data.attacker_id, onClean])
  return null
}

// ── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────────────────────
export default function HackEffectsDisplay() {
  const [effects, setEffects] = useState<HackEffect[]>([])

  useEffect(() => {
    fetch('/api/hack/effects')
      .then(r => r.json())
      .then(d => setEffects(d.effects ?? []))
      .catch(() => {})
  }, [])

  function removeEffect(id: string) {
    setEffects(e => e.filter(x => x.id !== id))
  }

  return (
    <>
      {effects.map(effect => {
        if (effect.effect_type === 'ad')
          return <FakeAdEffect key={effect.id} effect={effect} onClean={() => removeEffect(effect.id)} />
        if (effect.effect_type === 'nick')
          return <HackedNickEffect key={effect.id} effect={effect} onClean={() => removeEffect(effect.id)} />
        if (effect.effect_type === 'pet')
          return <PetChaosEffect key={effect.id} effect={effect} onClean={() => removeEffect(effect.id)} />
        return null
      })}
    </>
  )
}
