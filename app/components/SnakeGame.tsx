'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const FILES = [
  'СУПЕР СЕКРЕТНО', 'ВЗЛОМ ПЕНТАГОНА', 'ДАННЫЕ РОСКОМНАДЗОРА',
  'ЯДЕРНЫЕ КОДЫ', 'ПРОЕКТ ПРИЗРАК', 'ОПЕРАЦИЯ ТЕНЬ',
  'BASE ЦРУ', 'ШИФР МАТРИЦЫ', 'ПРОТОКОЛ ОМЕГА',
  'ЛИЧНОЕ ДЕЛО ФСБ', 'ДОСЬЕ №7734', 'АРХИВ НЕКСУС',
]

type Point = { x: number; y: number }
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

function rand(max: number) { return Math.floor(Math.random() * max) }

export default function SnakeGame({ onClose }: { onClose: () => void }) {
  // Адаптивный размер под экран
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const CELL = isMobile ? 14 : 20
  const COLS = isMobile ? 17 : 25
  const ROWS = isMobile ? 14 : 20
  const W = COLS * CELL
  const H = ROWS * CELL

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    snake: [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }],
    dir: 'RIGHT' as Dir,
    nextDir: 'RIGHT' as Dir,
    food: { x: 15, y: 7 },
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

    // Еда
    const fx = s.food.x * CELL, fy = s.food.y * CELL
    ctx.fillStyle = '#FF006E'
    ctx.shadowColor = '#FF006E'; ctx.shadowBlur = 8
    ctx.fillRect(fx + 2, fy + 4, CELL - 4, CELL - 6)
    ctx.fillRect(fx + 2, fy + 2, Math.min(8, CELL - 4), 3)
    ctx.shadowBlur = 0

    // Лейбл еды
    ctx.fillStyle = 'rgba(255,0,110,0.9)'
    ctx.font = `${isMobile ? 7 : 8}px JetBrains Mono, monospace`
    ctx.textAlign = 'center'
    const label = s.foodLabel.length > 10 ? s.foodLabel.slice(0, 9) + '…' : s.foodLabel
    ctx.fillText(label, fx + CELL / 2, fy - 2)
    ctx.textAlign = 'left'

    // Змея
    s.snake.forEach((seg, i) => {
      const x = seg.x * CELL, y = seg.y * CELL
      const ratio = i / s.snake.length
      const g = Math.round(255 - ratio * 100)
      const b = Math.round(240 - ratio * 100)
      ctx.fillStyle = i === 0 ? '#00FFF0' : `rgb(0,${g},${b})`
      if (i === 0) { ctx.shadowColor = '#00FFF0'; ctx.shadowBlur = 12 }
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
      ctx.shadowBlur = 0
    })
  }, [W, H, CELL, COLS, ROWS, isMobile])

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
    head.x = (head.x + COLS) % COLS
    head.y = (head.y + ROWS) % ROWS

    if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      s.dead = true; setDead(true); draw(); return
    }

    const ate = head.x === s.food.x && head.y === s.food.y
    s.snake = [head, ...s.snake]
    if (!ate) s.snake.pop()
    else { s.score += 10; setScore(s.score); spawnFood() }

    draw()
    rafRef.current = requestAnimationFrame(tick)
  }, [draw, COLS, ROWS])

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
      snake: [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }],
      dir: 'RIGHT', nextDir: 'RIGHT',
      food: { x: 15, y: 7 }, foodLabel: FILES[0],
      score: 0, dead: false,
    }
    setScore(0); setDead(false)
    lastRef.current = 0
    spawnFood()
    rafRef.current = requestAnimationFrame(tick)
  }

  function move(dir: Dir) {
    const s = stateRef.current
    if (dir==='UP'&&s.dir!=='DOWN') s.nextDir='UP'
    if (dir==='DOWN'&&s.dir!=='UP') s.nextDir='DOWN'
    if (dir==='LEFT'&&s.dir!=='RIGHT') s.nextDir='LEFT'
    if (dir==='RIGHT'&&s.dir!=='LEFT') s.nextDir='RIGHT'
  }

  const btnStyle: React.CSSProperties = {
    padding: isMobile ? '14px 18px' : '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--accent)', fontFamily: "'Orbitron',monospace",
    fontSize: isMobile ? 18 : 14, cursor: 'pointer',
    borderRadius: 6, touchAction: 'manipulation',
    minWidth: isMobile ? 52 : 40, minHeight: isMobile ? 52 : 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(6,6,18,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '12px 8px' : '20px',
      overflowY: 'auto',
    }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 10 : 16 }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: isMobile ? 8 : 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 4 }}>
          // ЗАГРУЗКА_СИГНАЛА
        </div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: isMobile ? 16 : 22, fontWeight: 900, letterSpacing: isMobile ? 4 : 6, color: '#00FFF0', textShadow: '0 0 20px #00FFF0' }}>
          ЦИФРОВОЙ ЧЕРВЬ
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: isMobile ? 9 : 11, color: 'rgba(0,255,240,0.5)', marginTop: 4 }}>
          {isMobile ? 'Нажимай кнопки' : 'Управляй стрелками'} · Собирай файлы
        </div>
      </div>

      {/* Счёт */}
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: isMobile ? 11 : 14, color: '#00FFF0', letterSpacing: 3, marginBottom: isMobile ? 8 : 12 }}>
        ФАЙЛОВ: <span style={{ textShadow: '0 0 10px #00FFF0' }}>{score}</span>
      </div>

      {/* Канвас */}
      <div style={{ border: '1px solid rgba(0,255,240,0.3)', boxShadow: '0 0 30px rgba(0,255,240,0.1)', position: 'relative', maxWidth: '100%' }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', maxWidth: '100%' }} />
        {dead && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,18,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: isMobile ? 14 : 18, fontWeight: 900, color: '#FF006E', letterSpacing: 4, textShadow: '0 0 20px #FF006E' }}>СИГНАЛ ПРЕРВАН</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Счёт: {score}</div>
            <button onClick={restart} className="btn-primary-ui">↺ ПЕРЕЗАПУСК</button>
          </div>
        )}
      </div>

      {/* Мобильные кнопки — крупнее */}
      <div style={{ marginTop: isMobile ? 12 : 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <button style={btnStyle} onClick={() => move('UP')}>↑</button>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={btnStyle} onClick={() => move('LEFT')}>←</button>
          <button style={btnStyle} onClick={() => move('DOWN')}>↓</button>
          <button style={btnStyle} onClick={() => move('RIGHT')}>→</button>
        </div>
      </div>

      <button onClick={onClose} style={{
        marginTop: isMobile ? 14 : 20,
        fontFamily: "'JetBrains Mono',monospace", fontSize: isMobile ? 12 : 11,
        color: 'var(--subtext)', background: 'none', border: 'none',
        cursor: 'pointer', letterSpacing: 2, padding: '8px 16px',
      }}>
        ПРОПУСТИТЬ →
      </button>
    </div>
  )
}
