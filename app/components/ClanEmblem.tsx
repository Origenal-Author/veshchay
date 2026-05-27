'use client'

import { useEffect, useRef } from 'react'
import { parseClanSymbol } from '@/lib/clans'

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}

// Все символы — ровно в центр квадрата, без поворота слоёв.
// Пользовательский поворот (кнопка «повернуть») применяется отдельно к каждому символу.
const LAYERS = [
  { scale: 1.20, rotate: 0, opacity: 0.30 },
  { scale: 0.85, rotate: 0, opacity: 0.55 },
  { scale: 0.55, rotate: 0, opacity: 1.00 },
]

// Слой с одним символом, нарисованным на canvas с правильной геометрической
// центровкой через measureText.actualBoundingBoxAscent/Descent.
// CSS transform применяет поворот и масштаб слоя.
function SymbolLayer({ raw, layer, size, fontSize, color }: {
  raw: string
  layer: { scale: number; rotate: number; opacity: number }
  size: number
  fontSize: number
  color: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { symbol, rotation } = parseClanSymbol(raw)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function draw() {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'

      const m = ctx.measureText(symbol)
      const ascent = m.actualBoundingBoxAscent ?? fontSize * 0.7
      const descent = m.actualBoundingBoxDescent ?? fontSize * 0.2
      const bbLeft = m.actualBoundingBoxLeft ?? 0
      const bbRight = m.actualBoundingBoxRight ?? 0
      // ВЕРТИКАЛЬНО: центр глифа = baselineY + (descent - ascent)/2 → размещаем в size/2
      const baselineY = size / 2 + (ascent - descent) / 2
      // ГОРИЗОНТАЛЬНО (textAlign='center'): центр глифа = x + (bbRight - bbLeft)/2 → размещаем в size/2
      const drawX = size / 2 + (bbLeft - bbRight) / 2
      ctx.fillText(symbol, drawX, baselineY)
    }

    // Ждём готовности шрифтов перед рисованием
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(draw))
    } else {
      draw()
    }
  }, [symbol, fontSize, size, color])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: size, height: size,
        opacity: layer.opacity,
        transform: `rotate(${layer.rotate + rotation}deg) scale(${layer.scale})`,
        transformOrigin: '50% 50%',
        pointerEvents: 'none',
      }}
    />
  )
}

export default function ClanEmblem({ symbols, color, size = 80 }: {
  symbols: string[]; color: string; size?: number
}) {
  const rgb = hexToRgb(color)
  const radius = Math.round(size * 0.22)
  const fontSize = Math.round(size * 0.55)

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      border: `2px solid ${color}`,
      background: `rgba(${rgb},0.08)`,
      boxShadow: `0 0 ${Math.round(size*0.4)}px rgba(${rgb},0.25)`,
      position: 'relative', flexShrink: 0, overflow: 'hidden',
    }}>
      {symbols.map((raw, i) => (
        <SymbolLayer
          key={`${i}-${raw}`}
          raw={raw}
          layer={LAYERS[i] ?? LAYERS[2]}
          size={size}
          fontSize={fontSize}
          color={color}
        />
      ))}
      {symbols.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, opacity: 0.3, fontSize, lineHeight: 1,
        }}>?</div>
      )}
    </div>
  )
}
