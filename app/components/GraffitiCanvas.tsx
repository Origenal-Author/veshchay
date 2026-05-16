'use client'

import { useRef, useState } from 'react'

const COLORS = ['#FF006E', '#00FFF0', '#FFD700', '#00FF88', '#FFFFFF', '#C084FC']
const SIZES = [3, 7, 14]

interface Props {
  onSubmit: (dataUrl: string) => void
  loading: boolean
  onBack: () => void
}

export default function GraffitiCanvas({ onSubmit, loading, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState('#FF006E')
  const [brushSize, setBrushSize] = useState(7)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy }
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const pos = getPos(e, canvas)
    lastPos.current = pos
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    e.preventDefault()
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    if (lastPos.current) {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    lastPos.current = pos
    e.preventDefault()
  }

  function stopDraw() {
    setIsDrawing(false)
    lastPos.current = null
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
  }

  function submit() {
    const canvas = canvasRef.current
    if (!canvas) return
    onSubmit(canvas.toDataURL('image/webp', 0.7))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 3 }}>
        // НАРИСУЙ ГРАФФИТИ НА СТЕНЕ ПРОФИЛЯ
      </div>

      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        style={{
          width: '100%', height: 'auto', display: 'block',
          background: 'rgba(6,6,18,0.95)',
          border: '1px solid rgba(255,0,110,0.3)',
          borderRadius: 6, cursor: 'crosshair', touchAction: 'none',
        }}
      />

      {/* Палитра + размеры */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 22, height: 22, borderRadius: '50%', background: c,
              border: `2px solid ${c === color ? '#fff' : 'transparent'}`,
              cursor: 'pointer', padding: 0, flexShrink: 0,
              boxShadow: c === color ? `0 0 6px ${c}` : 'none',
            }}
          />
        ))}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
        {SIZES.map(s => (
          <button
            key={s}
            onClick={() => setBrushSize(s)}
            style={{
              width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
              background: brushSize === s ? 'rgba(255,0,110,0.2)' : 'transparent',
              border: `1px solid rgba(255,0,110,${brushSize === s ? '0.8' : '0.2'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: Math.max(s - 2, 3), height: Math.max(s - 2, 3), borderRadius: '50%', background: '#FF006E' }} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={clear}
          style={{ background: 'none', border: '1px solid rgba(80,96,128,0.3)', color: '#506080', fontFamily: 'JetBrains Mono,monospace', fontSize: 8, letterSpacing: 2, padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}
        >
          ОЧИСТИТЬ
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={submit}
          disabled={loading}
          style={{ ...hackBtn('#FF006E'), flex: 1, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'ОТПРАВКА...' : 'ОСТАВИТЬ СЛЕД'}
        </button>
        <button onClick={onBack} style={hackBtn('#3A4A5A')}>←</button>
      </div>
    </div>
  )
}

function hackBtn(c: string): React.CSSProperties {
  return {
    fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 3,
    padding: '10px 16px', borderRadius: 8,
    border: `1px solid ${c}`, color: c, background: 'transparent', cursor: 'pointer',
  }
}
