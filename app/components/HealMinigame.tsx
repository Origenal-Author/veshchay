'use client'

import { useEffect, useRef, useState } from 'react'

// Слова для печатания — короткие, латиница + кириллица + цифры
const ENEMY_WORDS = [
  'TROJAN', 'MALWARE', 'WORM', 'KEYLOG', 'SPYWARE', 'ROOTKIT', 'EXPLOIT',
  'ERR404', 'ERR500', 'SYN', 'ACK', 'BUFFER', 'STACK', 'HEAP', 'NULL',
  'BACKDOOR', 'PHISHING', 'DDOS', 'ZERODAY', 'KERNEL', 'PAYLOAD', 'INJECT',
]
const BOSS_WORDS = [
  'INFECTION', 'PANDEMIC', 'OUTBREAK', 'MUTATION', 'CONTAGION',
]

type Enemy = {
  id: number
  word: string
  typed: number  // сколько букв правильно набрано
  x: number      // % по горизонтали
  y: number      // % по вертикали
  born: number   // timestamp
  isBoss: boolean
}

interface Props {
  petName: string
  onDone: () => void  // вызывается после убийства босса
  onClose: () => void  // если игрок закрыл крестиком (бросает лечение)
}

const ENEMIES_BEFORE_BOSS = 5
const ENEMY_LIFE_MS = 12000  // если не убить за это время — улетает
const SPAWN_INTERVAL_MS = 2200

export default function HealMinigame({ petName, onDone, onClose }: Props) {
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [killed, setKilled] = useState(0)
  const [bossActive, setBossActive] = useState(false)
  const [done, setDone] = useState(false)
  const [shots, setShots] = useState<{ id: number; x: number; y: number }[]>([])
  const idRef = useRef(0)
  const shotIdRef = useRef(0)

  // Спавн врагов
  useEffect(() => {
    if (done) return
    const iv = setInterval(() => {
      setEnemies(prev => {
        // Не больше 3 одновременно если не босс
        if (!bossActive && prev.length >= 3) return prev
        // Босса не дублируем
        if (bossActive) return prev
        const word = ENEMY_WORDS[Math.floor(Math.random() * ENEMY_WORDS.length)]
        return [...prev, {
          id: idRef.current++,
          word,
          typed: 0,
          x: 15 + Math.random() * 70,
          y: 25 + Math.random() * 45,
          born: Date.now(),
          isBoss: false,
        }]
      })
    }, SPAWN_INTERVAL_MS)
    return () => clearInterval(iv)
  }, [bossActive, done])

  // Автоулёт врагов
  useEffect(() => {
    if (done) return
    const iv = setInterval(() => {
      setEnemies(prev => prev.filter(e => e.isBoss || Date.now() - e.born < ENEMY_LIFE_MS))
    }, 500)
    return () => clearInterval(iv)
  }, [done])

  // Появление босса
  useEffect(() => {
    if (killed >= ENEMIES_BEFORE_BOSS && !bossActive && !done) {
      setBossActive(true)
      setEnemies(prev => [...prev, {
        id: idRef.current++,
        word: BOSS_WORDS[Math.floor(Math.random() * BOSS_WORDS.length)],
        typed: 0,
        x: 50, y: 50,
        born: Date.now(),
        isBoss: true,
      }])
    }
  }, [killed, bossActive, done])

  // Обработка клавиатуры
  useEffect(() => {
    if (done) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      const key = e.key.toUpperCase()
      if (!/^[A-ZА-Я0-9]$/.test(key)) return

      setEnemies(prev => {
        // Ищем подходящего врага — у которого next буква совпадает
        // Приоритет: уже начатые > новые
        const sorted = [...prev].sort((a, b) => {
          if (a.typed > 0 && b.typed === 0) return -1
          if (b.typed > 0 && a.typed === 0) return 1
          return a.born - b.born
        })
        for (const e of sorted) {
          if (e.word[e.typed] === key) {
            // Совпало — увеличиваем typed
            const next = prev.map(x => x.id === e.id ? { ...x, typed: x.typed + 1 } : x)
            // Если слово полностью напечатано — убийство
            if (e.typed + 1 === e.word.length) {
              // выстрел-эффект
              setShots(s => [...s, { id: shotIdRef.current++, x: e.x, y: e.y }])
              setTimeout(() => setShots(s => s.filter(sh => sh.id !== shotIdRef.current - 1)), 400)
              // Удаляем врага
              setTimeout(() => {
                setEnemies(cur => cur.filter(x => x.id !== e.id))
                if (e.isBoss) {
                  setDone(true)
                  setTimeout(onDone, 1500)
                } else {
                  setKilled(k => k + 1)
                }
              }, 50)
            }
            return next
          }
        }
        return prev
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, onClose, onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'JetBrains Mono,monospace', color: '#E0E8F0',
      backgroundImage:
        'linear-gradient(rgba(0,255,240,0.03) 1px,transparent 1px),' +
        'linear-gradient(90deg,rgba(0,255,240,0.03) 1px,transparent 1px)',
      backgroundSize: '40px 40px',
    }}>
      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', borderBottom: '1px solid rgba(0,255,240,0.2)',
        background: 'rgba(6,6,18,0.6)',
      }}>
        <div>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 13, letterSpacing: 4, color: '#00FFF0' }}>
            // КОД ПИТОМЦА · {petName.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 2, marginTop: 4 }}>
            печатай слово рядом с вирусом → выстрел в него
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#506080', letterSpacing: 2 }}>
            УНИЧТОЖЕНО: {killed}/{ENEMIES_BEFORE_BOSS} {bossActive ? '+ БОСС' : ''}
          </div>
          <button onClick={onClose} style={{
            marginTop: 6, background: 'rgba(255,0,110,0.1)', border: '1px solid #FF006E',
            color: '#FF006E', padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2,
          }}>✕ БРОСИТЬ</button>
        </div>
      </div>

      {/* Поле боя */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {enemies.map(e => (
          <div key={e.id} style={{
            position: 'absolute', left: `${e.x}%`, top: `${e.y}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            pointerEvents: 'none', animation: 'fadeIn 0.4s ease',
          }}>
            {/* Сам мини-вирус */}
            <div style={{
              fontSize: e.isBoss ? 60 : 36,
              filter: `drop-shadow(0 0 ${e.isBoss ? 18 : 10}px #FF006E)`,
              animation: e.isBoss ? 'infectedPulse 1.2s ease-in-out infinite' : 'infectedPulse 1.6s ease-in-out infinite',
              transform: e.isBoss ? 'scale(1.5)' : 'none',
            }}>{e.isBoss ? '👹' : '🦠'}</div>
            {/* Слово */}
            <div style={{
              padding: '4px 10px', borderRadius: 4,
              background: 'rgba(6,6,18,0.95)',
              border: `1px solid ${e.isBoss ? '#FF006E' : 'rgba(255,0,110,0.5)'}`,
              fontFamily: 'JetBrains Mono,monospace', fontSize: e.isBoss ? 16 : 13,
              letterSpacing: 2, whiteSpace: 'nowrap',
              boxShadow: `0 0 ${e.isBoss ? 14 : 8}px rgba(255,0,110,0.3)`,
            }}>
              <span style={{ color: '#00FF88' }}>{e.word.slice(0, e.typed)}</span>
              <span style={{ color: '#FF006E' }}>{e.word.slice(e.typed)}</span>
            </div>
          </div>
        ))}

        {/* Выстрелы */}
        {shots.map(s => (
          <div key={s.id} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: 64, animation: 'fadeIn 0.1s ease',
            filter: 'drop-shadow(0 0 16px #00FFF0)',
            pointerEvents: 'none',
          }}>💥</div>
        ))}

        {/* Победа */}
        {done && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          }}>
            <div style={{ fontSize: 80, filter: 'drop-shadow(0 0 20px #00FF88)', animation: 'fadeIn 0.5s ease' }}>✓</div>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, letterSpacing: 4, color: '#00FF88', marginTop: 16, textShadow: '0 0 12px rgba(0,255,136,0.5)' }}>
              ВИРУС УНИЧТОЖЕН
            </div>
            <div style={{ fontSize: 11, color: '#8892B0', letterSpacing: 2, marginTop: 8 }}>
              {petName.toUpperCase()} ВЫЛЕЧЕН · +15 XP
            </div>
          </div>
        )}
      </div>

      {/* Инструкция снизу */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid rgba(0,255,240,0.15)',
        background: 'rgba(6,6,18,0.6)',
        fontSize: 9, color: '#506080', letterSpacing: 2, textAlign: 'center',
      }}>
        // ПЕЧАТАЙ БУКВЫ СЛОВА ЧТОБЫ СТРЕЛЯТЬ · ESC — БРОСИТЬ //
      </div>
    </div>
  )
}
