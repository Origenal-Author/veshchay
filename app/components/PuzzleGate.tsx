'use client'

import { useState } from 'react'

type Puzzle = { q: string; a: string | string[]; hint: string }

// Пул из 20+ головоломок. Каждая загрузка PuzzleGate показывает 4 случайных.
const PUZZLE_POOL: Puzzle[] = [
  // Математика
  { q: 'ДОСТУП ЗАПРОШЕН. Реши уравнение: 23 + 19 = ?', a: '42', hint: 'Введи число' },
  { q: 'РАСЧЁТ ТРАЕКТОРИИ. 144 ÷ 12 = ?', a: '12', hint: 'Целое число' },
  { q: 'СЕТЕВОЙ ПИНГ. 7 × 8 = ?', a: '56', hint: 'Таблица умножения' },
  { q: 'ПРОВЕРКА КОНТРОЛЬНОЙ СУММЫ. 100 − 37 = ?', a: '63', hint: 'Простое вычитание' },
  // Паттерны
  { q: 'АНАЛИЗ ПАТТЕРНА. Следующее число: 2 → 4 → 8 → 16 → ?', a: '32', hint: 'Умножай на 2' },
  { q: 'ПОСЛЕДОВАТЕЛЬНОСТЬ. 1 → 1 → 2 → 3 → 5 → 8 → ?', a: '13', hint: 'Сумма двух предыдущих' },
  { q: 'РАСШИФРОВКА. 3 → 9 → 27 → 81 → ?', a: '243', hint: 'Умножай на 3' },
  { q: 'ЦЕПОЧКА. 1 → 4 → 9 → 16 → 25 → ?', a: '36', hint: 'Квадраты' },
  // Слова и факты
  { q: 'ПРОВЕРКА СИСТЕМЫ. Сколько букв в слове ВЕЩАЙ?', a: '6', hint: 'Посчитай' },
  { q: 'СКАНИРОВАНИЕ. Сколько букв в слове ЭФИР?', a: '4', hint: 'Аккуратно' },
  { q: 'ВНУТРЕННЯЯ ПРОВЕРКА. Сколько букв в слове ВЗЛОМ?', a: '5', hint: 'Просто посчитай' },
  // Технические
  { q: 'ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ. Сколько бит в одном байте?', a: '8', hint: 'Стандарт цифровых данных' },
  { q: 'ШИФРОВАНИЕ. Сколько байт в одном килобайте? (двоичных)', a: '1024', hint: '2 в 10-й степени' },
  { q: 'ВЕРИФИКАЦИЯ. Базовое число системы счисления двоичной = ?', a: '2', hint: '0 и 1' },
  { q: 'ДЕШИФРОВКА. HEX-значение для десятичного 16 = ?', a: ['10', '0x10'], hint: 'Шестнадцатеричная' },
  // Логика
  { q: 'ЛОГИКА. У отца 5 сыновей. У каждого по 1 сестре. Сколько детей всего?', a: '6', hint: 'Сестра одна на всех' },
  { q: 'РАЗВЕДКА. Сколько секунд в одной минуте?', a: '60', hint: 'Базовая единица' },
  { q: 'ТАЙМЕР. Сколько часов в сутках?', a: '24', hint: 'Сутки' },
  { q: 'ИТЕРАЦИЯ. Сколько дней в неделе?', a: '7', hint: 'Стандарт' },
  // Сайт
  { q: 'ИДЕНТИФИКАЦИЯ. Как называется этот видеохостинг?', a: ['ВЕЩАЙ', 'вещай', 'Вещай'], hint: 'Прямо на лого' },
  { q: 'СИНТАКСИС. Какое слово вызывает глитч на сайте?', a: ['ВЕЩАЙ', 'вещай', 'Вещай'], hint: 'Подскажет easter egg' },
  { q: 'ВОДИТЕЛЬ. Какое слово показывает "система взломана"?', a: ['ВЗЛОМ', 'взлом', 'Взлом'], hint: 'Кодовое слово' },
]

function pickPuzzles(): Puzzle[] {
  const shuffled = [...PUZZLE_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4)
}

function checkAnswer(input: string, answer: string | string[]) {
  const norm = input.trim().toLowerCase()
  if (Array.isArray(answer)) return answer.some(a => a.toLowerCase() === norm)
  return answer.toLowerCase() === norm
}

export default function PuzzleGate({ onSolve }: { onSolve: () => void }) {
  const [puzzles] = useState<Puzzle[]>(() => pickPuzzles())
  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const puzzle = puzzles[step]

  function check() {
    if (checkAnswer(input, puzzle.a)) {
      if (step + 1 >= puzzles.length) {
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
          {puzzles.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: i <= step ? 'var(--accent)' : 'var(--border)', boxShadow: i < step ? '0 0 8px var(--accent)' : 'none', transition: 'all 0.3s' }} />
          ))}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>
          // ПРОВЕРКА ДОСТУПА — {step + 1}/{puzzles.length}
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

        <button
          onClick={() => window.history.back()}
          style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 2, opacity: 0.5 }}
        >
          ← вернуться назад
        </button>
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
