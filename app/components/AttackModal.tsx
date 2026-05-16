'use client'

import { useEffect, useRef, useState } from 'react'
import PetCanvas from './PetCanvas'
import { getPetDef, type Pet, type PetType } from '@/lib/pets'
import HackPanel from './HackPanel'

// ── БОНУСЫ ВИРУСА ─────────────────────────────────────────────────────────────
const PET_BONUSES: Record<PetType, { label: string; effect: string }> = {
  jellyfish: { label: 'Замедляет таймер ×2',       effect: 'slow_timer' },
  hologram:  { label: 'Открывает 2 символа кода',  effect: 'reveal_code' },
  ghost:     { label: '+2 попытки / жизни',         effect: 'extra_attempt' },
  signal:    { label: 'Расширяет зону пика',        effect: 'wide_zone' },
  radar:     { label: 'Подсвечивает ловушки 3 сек', effect: 'reveal_traps' },
  neuron:    { label: 'Раскрывает одну цифру',      effect: 'reveal_digit' },
  plasma:    { label: 'Убирает 3 ловушки',          effect: 'remove_traps' },
  crystal:   { label: '⚡ Мгновенный успех!',       effect: 'instant_win' },
}

function generateCode(): string {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 2 }, () => c[Math.floor(Math.random() * c.length)]).join('')
  ).join('-')
}

// ── 1. ИНЪЕКЦИЯ КОДА ──────────────────────────────────────────────────────────
function CodeGame({ bonus, onSuccess, onFail }: { bonus: string; onSuccess: () => void; onFail: () => void }) {
  const [code] = useState(generateCode)
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(bonus === 'slow_timer' ? 20 : 10)
  const [error, setError] = useState(false)
  const revealed = bonus === 'reveal_code' ? code.split('-').slice(0, 2).join('-') : null

  useEffect(() => {
    if (timeLeft <= 0) { onFail(); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, onFail])

  function check() {
    if (input.toUpperCase().replace(/\s/g, '') === code.replace(/-/g, '')) {
      onSuccess()
    } else {
      setError(true)
      setTimeout(() => { setError(false); setInput('') }, 600)
    }
  }

  const pct = timeLeft / (bonus === 'slow_timer' ? 20 : 10) * 100
  const timerColor = pct > 50 ? '#00FF88' : pct > 25 ? '#FFB300' : '#FF006E'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 3 }}>
        // ИНЪЕКЦИЯ КОДА — введи точно
      </div>

      {revealed && (
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#FFB300', letterSpacing: 2 }}>
          ВИРУС РАСКРЫЛ: <span style={{ color: '#00FFF0' }}>{revealed}</span>-??-??-??
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 10 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, letterSpacing: 6, color: '#00FF88', textShadow: '0 0 10px #00FF88' }}>
          {code}
        </div>
      </div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear, background 0.3s' }} />
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: timerColor, textAlign: 'right' }}>{timeLeft}с</div>

      <input
        autoFocus
        value={input}
        onChange={e => setInput(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && check()}
        placeholder="Введи код..."
        style={{
          background: error ? 'rgba(255,0,110,0.1)' : 'rgba(0,255,136,0.04)',
          border: `1px solid ${error ? '#FF006E' : 'rgba(0,255,136,0.3)'}`,
          color: '#E0E8F0', fontFamily: 'JetBrains Mono,monospace', fontSize: 16,
          padding: '12px 16px', borderRadius: 8, outline: 'none', width: '100%',
          letterSpacing: 4, textAlign: 'center',
          animation: error ? 'shake 0.4s ease' : 'none',
        }}
      />
      <button onClick={check} style={actionStyle('#00FF88')}>ВВЕСТИ КОД</button>
    </div>
  )
}

// ── 2. ПЕРЕХВАТ СИГНАЛА ───────────────────────────────────────────────────────
function SignalGame({ bonus, onSuccess, onFail }: { bonus: string; onSuccess: () => void; onFail: () => void }) {
  const [attempt, setAttempt] = useState(0)
  const [value, setValue] = useState(0)
  const [flash, setFlash] = useState<'none' | 'hit' | 'miss'>('none')
  const tRef = useRef(0)
  const rafRef = useRef(0)
  const MAX_ATTEMPTS = bonus === 'extra_attempt' ? 5 : 3
  const ZONE = bonus === 'wide_zone' ? 0.72 : 0.85
  const SPEED = bonus === 'slow_timer' ? 0.012 : 0.022 + attempt * 0.008

  useEffect(() => {
    function tick() {
      tRef.current += SPEED
      setValue(Math.abs(Math.sin(tRef.current)))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [SPEED])

  function intercept() {
    if (value >= ZONE) {
      setFlash('hit')
      setTimeout(onSuccess, 500)
    } else {
      setFlash('miss')
      setTimeout(() => {
        setFlash('none')
        if (attempt + 1 >= MAX_ATTEMPTS) onFail()
        else setAttempt(a => a + 1)
      }, 600)
    }
  }

  const barH = value * 200
  const inZone = value >= ZONE
  const barColor = inZone ? '#00FF88' : value > 0.6 ? '#FFB300' : '#506080'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 3 }}>
        // ПЕРЕХВАТ СИГНАЛА — нажми в зелёной зоне
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'flex-end' }}>
        {/* Шкала */}
        <div style={{ width: 60, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
          {/* Зона попадания */}
          <div style={{ position: 'absolute', bottom: ZONE * 200, left: 0, right: 0, height: (1 - ZONE) * 200, background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)' }} />
          {/* Текущий уровень */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: barH, background: barColor, boxShadow: `0 0 12px ${barColor}`, transition: 'none', borderRadius: '0 0 6px 6px' }} />
        </div>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 28, color: barColor, textShadow: `0 0 10px ${barColor}`, width: 80 }}>
          {Math.round(value * 100)}%
        </div>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', textAlign: 'center', letterSpacing: 2 }}>
        Попытка {attempt + 1}/{MAX_ATTEMPTS} · {inZone ? '⚡ В ЗОНЕ!' : 'жди пика...'}
      </div>
      <button
        onClick={intercept}
        style={{
          ...actionStyle(inZone ? '#00FF88' : '#506080'),
          animation: flash === 'hit' ? 'none' : flash === 'miss' ? 'shake 0.4s ease' : 'none',
          background: flash === 'hit' ? 'rgba(0,255,136,0.2)' : 'transparent',
        }}
      >
        ⚡ ПЕРЕХВАТИТЬ
      </button>
    </div>
  )
}

// ── 3. ВЗЛОМ ПАРОЛЯ ───────────────────────────────────────────────────────────
function PasswordGame({ bonus, onSuccess, onFail }: { bonus: string; onSuccess: () => void; onFail: () => void }) {
  const [secret] = useState(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)))
  const [guesses, setGuesses] = useState<{ digits: number[]; result: string[] }[]>([])
  const [current, setCurrent] = useState(['', '', '', ''])
  const MAX = bonus === 'extra_attempt' ? 8 : 6
  const revealedIdx = bonus === 'reveal_digit' ? 0 : -1

  function check() {
    const effective = current.map((d, i) => i === revealedIdx ? String(secret[i]) : d)
    if (effective.some(d => d === '')) return
    const digits = effective.map(Number)
    const result = digits.map((d, i) => {
      if (d === secret[i]) return '[OK]'
      if (secret.includes(d)) return '[~]'
      return '[X]'
    })
    const next = [...guesses, { digits, result }]
    setGuesses(next)
    setCurrent(['', '', '', ''])
    if (result.every(r => r === '[OK]')) { setTimeout(onSuccess, 500); return }
    if (next.length >= MAX) setTimeout(onFail, 500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 3 }}>
        // ВЗЛОМ ПАРОЛЯ — 4 цифры, {MAX} попыток
      </div>

      {bonus === 'reveal_digit' && (
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#FFB300', letterSpacing: 2 }}>
          НЕЙРОН РАСКРЫЛ: позиция 1 = <span style={{ color: '#00FFF0' }}>{secret[0]}</span>
        </div>
      )}

      {/* История */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
        {guesses.map((g, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {g.digits.map((d, j) => (
                <div key={j} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron,monospace', fontSize: 14, color: '#E0E8F0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, fontSize: 14 }}>{g.result.map((r, j) => <span key={j}>{r}</span>)}</div>
          </div>
        ))}
      </div>

      {/* Ввод */}
      {guesses.length < MAX && (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            {current.map((d, i) => (
              <input
                key={i}
                value={i === 0 && revealedIdx === 0 ? String(secret[0]) : d}
                readOnly={i === revealedIdx}
                onChange={e => {
                  const val = e.target.value.slice(-1)
                  if (val === '' || /\d/.test(val)) {
                    const next = [...current]; next[i] = val; setCurrent(next)
                    if (val && i < 3) (document.querySelectorAll('.pwd-input')[i + 1] as HTMLInputElement)?.focus()
                  }
                }}
                className="pwd-input"
                maxLength={1}
                style={{ width: 48, height: 48, textAlign: 'center', background: 'rgba(0,255,240,0.05)', border: '1px solid rgba(0,255,240,0.2)', borderRadius: 8, color: i === revealedIdx ? '#FFB300' : '#E0E8F0', fontFamily: 'Orbitron,monospace', fontSize: 18, outline: 'none' }}
              />
            ))}
          </div>
          <button onClick={check} style={actionStyle('#00FFF0')}>ВВЕСТИ {guesses.length + 1}/{MAX}</button>
        </>
      )}
    </div>
  )
}

// ── 4. МАРШРУТ В МАТРИЦЕ ──────────────────────────────────────────────────────
function MatrixGame({ bonus, onSuccess, onFail }: { bonus: string; onSuccess: () => void; onFail: () => void }) {
  const SIZE = 5
  const [traps] = useState(() => {
    const t = new Set<string>()
    while (t.size < 7) {
      const r = Math.floor(Math.random() * SIZE)
      const c = Math.floor(Math.random() * SIZE)
      if (!(r === 0 && c === 0) && !(r === SIZE - 1 && c === SIZE - 1)) t.add(`${r},${c}`)
    }
    return bonus === 'remove_traps' ? (() => {
      const arr = [...t]
      arr.splice(0, 3)
      return new Set(arr)
    })() : t
  })
  const [pos, setPos] = useState({ r: 0, c: 0 })
  const [lives, setLives] = useState(bonus === 'extra_attempt' ? 5 : 3)
  const [revealed, setRevealed] = useState(false)
  const [revealTimer, setRevealTimer] = useState(0)

  function activateRadar() {
    setRevealed(true)
    setRevealTimer(3)
    const iv = setInterval(() => setRevealTimer(t => {
      if (t <= 1) { setRevealed(false); clearInterval(iv) }
      return t - 1
    }), 1000)
  }

  function move(r: number, c: number) {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return
    if (Math.abs(r - pos.r) + Math.abs(c - pos.c) !== 1) return

    if (traps.has(`${r},${c}`)) {
      const newLives = lives - 1
      setLives(newLives)
      setPos({ r: 0, c: 0 })
      if (newLives <= 0) setTimeout(onFail, 400)
    } else {
      setPos({ r, c })
      if (r === SIZE - 1 && c === SIZE - 1) setTimeout(onSuccess, 400)
    }
  }

  const isAdjacent = (r: number, c: number) =>
    Math.abs(r - pos.r) + Math.abs(c - pos.c) === 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 3 }}>
          // МАРШРУТ — доберись до [4,4]
        </div>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 11, color: '#FF006E', letterSpacing: 2 }}>
          {'❤'.repeat(lives)}{'🖤'.repeat(Math.max(0, (bonus === 'extra_attempt' ? 5 : 3) - lives))}
        </div>
      </div>

      {bonus === 'reveal_traps' && !revealed && (
        <button onClick={activateRadar} style={{ ...actionStyle('#39FF14'), padding: '6px 12px', fontSize: 9 }}>
          📡 РАДАР — подсветить ловушки 3 сек
        </button>
      )}
      {revealTimer > 0 && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#39FF14' }}>Ловушки видны: {revealTimer}с</div>}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: 4 }}>
        {Array.from({ length: SIZE }, (_, r) =>
          Array.from({ length: SIZE }, (_, c) => {
            const isCurrent = pos.r === r && pos.c === c
            const isTarget = r === SIZE - 1 && c === SIZE - 1
            const isTrap = traps.has(`${r},${c}`)
            const isAdj = isAdjacent(r, c)
            const showTrap = isTrap && revealed

            return (
              <div
                key={`${r},${c}`}
                onClick={() => move(r, c)}
                style={{
                  width: '100%', aspectRatio: '1',
                  borderRadius: 6, cursor: isAdj ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                  background: isCurrent ? 'rgba(0,255,136,0.2)' :
                    isTarget ? 'rgba(0,212,255,0.15)' :
                    showTrap ? 'rgba(255,0,110,0.2)' :
                    isAdj ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCurrent ? '#00FF88' : isTarget ? '#00D4FF' : showTrap ? '#FF006E' : isAdj ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.15s',
                  boxShadow: isCurrent ? '0 0 10px rgba(0,255,136,0.4)' : 'none',
                }}
              >
                {isCurrent ? '◉' : isTarget ? '🎯' : showTrap ? '☠' : isAdj ? '·' : ''}
              </div>
            )
          })
        )}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 1 }}>
        Позиция: [{pos.r},{pos.c}] → Цель: [4,4] · Кликай соседние ячейки
      </div>
    </div>
  )
}

// ── ГЛАВНЫЙ МОДАЛ ─────────────────────────────────────────────────────────────
type Step = 'select' | 'pet' | 'game' | 'success' | 'fail' | 'hacking'
type Method = 'code' | 'signal' | 'password' | 'matrix'

const METHODS: { key: Method; name: string; desc: string; icon: string }[] = [
  { key: 'code',     name: 'ИНЪЕКЦИЯ КОДА',     desc: 'Введи код точно за 10 сек',          icon: '💉' },
  { key: 'signal',   name: 'ПЕРЕХВАТ СИГНАЛА',   desc: 'Поймай пик волны в нужный момент',  icon: '📡' },
  { key: 'password', name: 'ВЗЛОМ ПАРОЛЯ',       desc: 'Угадай 4-значный шифр за 6 попыток', icon: '🔐' },
  { key: 'matrix',   name: 'МАРШРУТ В МАТРИЦЕ',  desc: 'Найди путь через минное поле',       icon: '🗺' },
]

interface Props {
  targetId: string
  targetUsername: string
  virusPets: Pet[]
  onClose: () => void
}

export default function AttackModal({ targetId, targetUsername, virusPets, onClose }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [method, setMethod] = useState<Method>('code')
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [petUsed, setPetUsed] = useState(false)
  const [sending, setSending] = useState(false)

  const bonus = selectedPet && !petUsed ? PET_BONUSES[selectedPet.type].effect : 'none'

  async function finalize(success: boolean) {
    if (sending) return
    setSending(true)
    await fetch('/api/attack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, method, success }),
    })
    setStep(success ? 'success' : 'fail')
    setSending(false)
  }

  function handleInstantWin() {
    setPetUsed(true)
    finalize(true)
  }

  const hasVirus = virusPets.length > 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99990, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        background: 'rgba(6,6,18,0.99)', border: '1px solid #FF006E',
        borderRadius: 16, padding: 28,
        boxShadow: '0 0 60px rgba(255,0,110,0.25)',
        animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 14, letterSpacing: 4, color: '#FF006E', textShadow: '0 0 12px #FF006E' }}>
              ⚡ АТАКА
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 2, marginTop: 3 }}>
              цель: @{targetUsername}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#506080', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {/* Шаг: выбор метода */}
        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 3, marginBottom: 4 }}>// ВЫБЕРИ МЕТОД ВЗЛОМА</div>
            {METHODS.map(m => (
              <button key={m.key} onClick={() => { setMethod(m.key); setStep(hasVirus ? 'pet' : 'game') }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'rgba(255,0,110,0.04)', border: '1px solid rgba(255,0,110,0.2)',
                borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 2, color: '#FF006E' }}>{m.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', marginTop: 3 }}>{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Шаг: питомец */}
        {step === 'pet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 3 }}>// АКТИВИРОВАТЬ ВИРУСА?</div>
            {virusPets.map(p => {
              const def = getPetDef(p.type)
              const bonus = PET_BONUSES[p.type]
              const isSelected = selectedPet?.id === p.id
              return (
                <button key={p.id} onClick={() => setSelectedPet(isSelected ? null : p)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: isSelected ? 'rgba(255,0,110,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? '#FF006E' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, cursor: 'pointer',
                }}>
                  <PetCanvas type={p.type} variant="virus" stage={p.stage} size={48} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, color: def.colorVirus, letterSpacing: 2 }}>{def.nameRu}</div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', marginTop: 3 }}>{bonus.label}</div>
                  </div>
                  {isSelected && <span style={{ marginLeft: 'auto', color: '#FF006E', fontSize: 16 }}>✓</span>}
                </button>
              )
            })}

            {selectedPet && PET_BONUSES[selectedPet.type].effect === 'instant_win' && (
              <button onClick={handleInstantWin} style={actionStyle('#FF006E')}>
                ⚡ КРИСТАЛЛ — МГНОВЕННЫЙ ВЗЛОМ
              </button>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('game')} style={{ ...actionStyle('#FF006E'), flex: 1 }}>
                {selectedPet ? 'ВЗЛОМАТЬ С ВИРУСОМ' : 'ВЗЛОМАТЬ БЕЗ ВИРУСА'}
              </button>
              <button onClick={() => setStep('select')} style={{ ...actionStyle('#3A4A5A'), padding: '10px 16px' }}>←</button>
            </div>
          </div>
        )}

        {/* Шаг: игра */}
        {step === 'game' && (
          <>
            {/* Мини-виджет питомца */}
            {selectedPet && !petUsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: 'rgba(255,0,110,0.06)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: 8 }}>
                <PetCanvas type={selectedPet.type} variant="virus" stage={selectedPet.stage} size={32} />
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#FF006E', letterSpacing: 1 }}>
                  {PET_BONUSES[selectedPet.type].label}
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#506080' }}>активен</div>
              </div>
            )}
            {method === 'code'     && <CodeGame     bonus={bonus} onSuccess={() => finalize(true)} onFail={() => finalize(false)} />}
            {method === 'signal'   && <SignalGame   bonus={bonus} onSuccess={() => finalize(true)} onFail={() => finalize(false)} />}
            {method === 'password' && <PasswordGame bonus={bonus} onSuccess={() => finalize(true)} onFail={() => finalize(false)} />}
            {method === 'matrix'   && <MatrixGame   bonus={bonus} onSuccess={() => finalize(true)} onFail={() => finalize(false)} />}
          </>
        )}

        {/* Успех — выбор: хакнуть или закрыть */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💀</div>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, letterSpacing: 4, color: '#00FF88', textShadow: '0 0 20px #00FF88', marginBottom: 8 }}>ВЗЛОМ УСПЕШЕН</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', marginBottom: 4 }}>Канал @{targetUsername} под контролем на 2.5 минуты</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00FF88', marginBottom: 20 }}>+20 XP</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setStep('hacking')} style={actionStyle('#FF006E')}>
                ⚡ ВОЙТИ В СИСТЕМУ
              </button>
              <button onClick={onClose} style={actionStyle('#506080')}>ЗАКРЫТЬ</button>
            </div>
          </div>
        )}

        {/* Хакер-панель */}
        {step === 'hacking' && (
          <HackPanel victimId={targetId} victimName={targetUsername} onClose={onClose} />
        )}

        {/* Провал */}
        {step === 'fail' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, letterSpacing: 4, color: '#FF006E', textShadow: '0 0 20px #FF006E', marginBottom: 8 }}>ВЗЛОМ ПРОВАЛЕН</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', marginBottom: 24 }}>Кулдаун 1 час. Укрепи навыки и попробуй снова.</div>
            <button onClick={onClose} style={actionStyle('#FF006E')}>ЗАКРЫТЬ</button>
          </div>
        )}
      </div>
    </div>
  )
}

function actionStyle(color: string): React.CSSProperties {
  return {
    fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3,
    padding: '11px 24px', borderRadius: 8, border: `1px solid ${color}`,
    color, background: 'transparent', cursor: 'pointer', width: '100%',
    transition: 'all 0.2s',
  }
}
