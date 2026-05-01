'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const FILES = [
  'СУПЕР СЕКРЕТНО', 'ВЗЛОМ ПЕНТАГОНА', 'ДАННЫЕ РОСКОМНАДЗОРА',
  'ЯДЕРНЫЕ КОДЫ', 'ПРОЕКТ ПРИЗРАК', 'ОПЕРАЦИЯ ТЕНЬ',
  'БАЗА ЦРУ', 'ШИФР МАТРИЦЫ', 'ПРОТОКОЛ ОМЕГА',
  'ЛИЧНОЕ ДЕЛО ФСБ', 'ДОСЬЕ №7734', 'СЕРВЕРА ПЕНТАГОНА',
  'АРХИВ НЕКСУС', 'КОД СУДНОГО ДНЯ', 'ФАЙЛЫ X-77',
]

const CELL = 20
const COLS = 25
const ROWS = 20
const W = COLS * CELL
const H = ROWS * CELL

type Point = { x: number; y: number }
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

function rand(max: number) { return Math.floor(Math.random() * max) }

export default function SnakeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    snake: [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }],
    dir: 'RIGHT' as Dir,
    nextDir: 'RIGHT' as Dir,
    food: { x: 18, y: 10 },
    foodLabel: FILES[0],
    score: 0,
    dead: false,
  })
  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)
  const rafRef = useRef<number>(0)
  const lastRef = useRef(0)

  function spawnFood() {
    stateRef.current.food = { x: rand(COLS), y: rand(ROWS) }
    stateRef.current.foodLabel = FILES[rand(FILES.length)]
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const s = stateRef.current

    ctx.fillStyle = '#060612'
    ctx.fillRect(0, 0, W, H)

    // Сетка
    ctx.strokeStyle = 'rgba(0,255,240,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x <= W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y <= H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Еда (папка)
    const fx = s.food.x * CELL, fy = s.food.y * CELL
    ctx.fillStyle = '#FF006E'
    ctx.fillRect(fx + 2, fy + 4, CELL - 4, CELL - 6)
    ctx.fillRect(fx + 2, fy + 2, 8, 3) // ярлычок папки
    ctx.shadowColor = '#FF006E'
    ctx.shadowBlur = 8

    // Название файла
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,0,110,0.9)'
    ctx.font = '8px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    const label = s.foodLabel.length > 12 ? s.foodLabel.slice(0, 11) + '…' : s.foodLabel
    ctx.fillText(label, fx + CELL / 2, fy - 3)
    ctx.textAlign = 'left'

    // Змея
    s.snake.forEach((seg, i) => {
      const x = seg.x * CELL, y = seg.y * CELL
      const ratio = i / s.snake.length
      const r = Math.round(0 + ratio * 0)
      const g = Math.round(255 - ratio * 100)
      const b = Math.round(240 - ratio * 100)
      ctx.fillStyle = i === 0 ? '#00FFF0' : `rgb(${r},${g},${b})`
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
      if (i === 0) {
        ctx.shadowColor = '#00FFF0'
        ctx.shadowBlur = 12
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
        ctx.shadowBlur = 0
      }
    })
  }, [])

  const tick = useCallback((ts: number) => {
    if (stateRef.current.dead) return
    if (ts - lastRef.current < 130) { rafRef.current = requestAnimationFrame(tick); return }
    lastRef.current = ts
    const s = stateRef.current
    s.dir = s.nextDir

    const head = { ...s.snake[0] }
    if (s.dir === 'UP') head.y--
    if (s.dir === 'DOWN') head.y++
    if (s.dir === 'LEFT') head.x--
    if (s.dir === 'RIGHT') head.x++

    // Стены — проходим сквозь
    head.x = (head.x + COLS) % COLS
    head.y = (head.y + ROWS) % ROWS

    // Столкновение с собой
    if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      s.dead = true
      setDead(true)
      draw()
      return
    }

    const ate = head.x === s.food.x && head.y === s.food.y
    s.snake = [head, ...s.snake]
    if (!ate) s.snake.pop()
    else { s.score += 10; setScore(s.score); spawnFood() }

    draw()
    rafRef.current = requestAnimationFrame(tick)
  }, [draw])

  useEffect(() => {
    spawnFood()
    draw()
    rafRef.current = requestAnimationFrame(tick)

    function onKey(e: KeyboardEvent) {
      const s = stateRef.current
      if (e.key === 'ArrowUp' && s.dir !== 'DOWN') s.nextDir = 'UP'
      if (e.key === 'ArrowDown' && s.dir !== 'UP') s.nextDir = 'DOWN'
      if (e.key === 'ArrowLeft' && s.dir !== 'RIGHT') s.nextDir = 'LEFT'
      if (e.key === 'ArrowRight' && s.dir !== 'LEFT') s.nextDir = 'RIGHT'
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('keydown', onKey) }
  }, [tick, draw])

  function restart() {
    stateRef.current = {
      snake: [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }],
      dir: 'RIGHT', nextDir: 'RIGHT',
      food: { x: 18, y: 10 }, foodLabel: FILES[0],
      score: 0, dead: false,
    }
    setScore(0); setDead(false)
    lastRef.current = 0
    spawnFood()
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(6,6,18,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 4, marginBottom: 6 }}>// ЗАГРУЗКА_СИГНАЛА</div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, letterSpacing: 6, color: '#00FFF0', textShadow: '0 0 20px #00FFF0' }}>ЦИФРОВОЙ ЧЕРВЬ</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(0,255,240,0.5)', marginTop: 6 }}>
          Управляй стрелками · Собирай секретные файлы
        </div>
      </div>

      {/* Счёт */}
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, color: '#00FFF0', letterSpacing: 4, marginBottom: 12 }}>
        ФАЙЛОВ ПОХИЩЕНО: <span style={{ textShadow: '0 0 10px #00FFF0' }}>{score}</span>
      </div>

      {/* Канвас */}
      <div style={{ border: '1px solid rgba(0,255,240,0.3)', boxShadow: '0 0 40px rgba(0,255,240,0.1)', position: 'relative' }}>
        <canvas ref={canvasRef} width={W} height={H} />
        {dead && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,18,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, fontWeight: 900, color: '#FF006E', letterSpacing: 4, textShadow: '0 0 20px #FF006E' }}>СИГНАЛ ПРЕРВАН</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Счёт: {score} очков</div>
            <button onClick={restart} className="btn-primary-ui" style={{ marginTop: 8 }}>↺ ПЕРЕЗАПУСК</button>
          </div>
        )}
      </div>

      {/* Мобильные кнопки */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, marginTop: 16, width: 120 }}>
        {[['↑','UP',1,0],['←','LEFT',0,1],['↓','DOWN',1,1],['→','RIGHT',2,1]].map(([label, dir, col, row]) => (
          <button key={dir as string} onClick={() => {
            const s = stateRef.current
            if (dir==='UP'&&s.dir!=='DOWN') s.nextDir='UP'
            if (dir==='DOWN'&&s.dir!=='UP') s.nextDir='DOWN'
            if (dir==='LEFT'&&s.dir!=='RIGHT') s.nextDir='LEFT'
            if (dir==='RIGHT'&&s.dir!=='LEFT') s.nextDir='RIGHT'
          }} style={{ gridColumn: Number(col)+1, gridRow: Number(row)+1, padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: "'Orbitron',monospace", fontSize: 14, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <button onClick={onClose} style={{ marginTop: 24, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 2 }}>
        ПРОПУСТИТЬ →
      </button>
    </div>
  )
}
