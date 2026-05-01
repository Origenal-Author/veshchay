'use client'

import { useState } from 'react'

const PUZZLES = [
  { q: 'ДОСТУП ЗАПРОШЕН. Реши уравнение: 23 + 19 = ?', a: '42', hint: 'Введи число' },
  { q: 'АНАЛИЗ ПАТТЕРНА. Следующее число: 2 → 4 → 8 → 16 → ?', a: '32', hint: 'Умножай на 2' },
  { q: 'ПРОВЕРКА СИСТЕМЫ. Сколько букв в слове ВЕЩАЙ?', a: '6', hint: 'Посчитай' },
  { q: 'ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ. Сколько бит в одном байте?', a: '8', hint: 'Стандарт цифровых данных' },
]

export default function PuzzleGate({ onSolve }: { onSolve: () => void }) {
  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const puzzle = PUZZLES[step]

  function check() {
    if (input.trim() === puzzle.a) {
      if (step + 1 >= PUZZLES.length) {
        onSolve()
      } else {
        setStep(s => s + 1)
        setInput('')
        setError('')
      }
    } else {
      setError('// НЕВЕРНЫЙ КОД — ПОПРОБУЙ ЕЩЁ')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 480, padding: 40, background: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: '0 0 60px var(--accent-glow)', animation: shake ? 'shake 0.4s' : 'none' }}>

        {/* Прогресс */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {PUZZLES.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: i <= step ? 'var(--accent)' : 'var(--border)', boxShadow: i < step ? '0 0 8px var(--accent)' : 'none', transition: 'all 0.3s' }} />
          ))}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>
          // ПРОВЕРКА ДОСТУПА — {step + 1}/{PUZZLES.length}
        </div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: 1, lineHeight: 1.5 }}>
          {puzzle.q}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', marginBottom: 24 }}>
          ПОДСКАЗКА: {puzzle.hint}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="Введи ответ..."
            autoFocus
            style={{ flex: 1, padding: '12px 16px', background: 'rgba(0,255,240,0.05)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, outline: 'none' }}
          />
          <button onClick={check} className="btn-primary-ui" style={{ padding: '12px 20px', fontSize: 11 }}>ВВОД</button>
        </div>

        {error && (
          <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#FF006E' }}>{error}</div>
        )}

        <div style={{ marginTop: 20, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', opacity: 0.6 }}>
          Ответь на все вопросы чтобы получить доступ к профилю
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  )
}
