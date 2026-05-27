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
      const PAD = Math.ceil(size * 0.3)  // запас по краям, чтобы глиф точно влез
      const W = size + PAD * 2

      // ─── 1. Pixel-scan через временный canvas ────────────────────────────
      // Рисуем символ непрозрачным белым и сканируем альфу — находим точный bbox.
      const tmp = document.createElement('canvas')
      tmp.width = W * dpr
      tmp.height = W * dpr
      const tctx = tmp.getContext('2d')
      if (!tctx) return
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      tctx.font = `${fontSize}px 'JetBrains Mono', monospace`
      tctx.fillStyle = '#ffffff'
      tctx.textAlign = 'left'
      tctx.textBaseline = 'top'
      // Рисуем в центре временного canvas с запасом
      tctx.fillText(symbol, PAD, PAD)

      const imageData = tctx.getImageData(0, 0, W * dpr, W * dpr).data
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      const stride = W * dpr * 4
      for (let y = 0; y < W * dpr; y++) {
        const rowStart = y * stride
        for (let x = 0; x < W * dpr; x++) {
          if (imageData[rowStart + x * 4 + 3] > 0) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      // ─── 2. Рисуем настоящий canvas со смещением ─────────────────────────
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`
      ctx.fillStyle = color
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      if (minX === Infinity) {
        // глиф не нарисовался (например, отсутствует во шрифте) — просто в центр
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(symbol, size / 2, size / 2)
        return
      }

      // Реальный пиксельный центр глифа в координатах временного canvas (css px)
      const cxGlyph = ((minX + maxX) / 2) / dpr
      const cyGlyph = ((minY + maxY) / 2) / dpr
      // На временном canvas мы рисовали в (PAD, PAD).
      // Чтобы получить координату рисования в основном canvas, в которой центр глифа = (size/2, size/2):
      //   drawX = size/2 - (cxGlyph - PAD)
      //   drawY = size/2 - (cyGlyph - PAD)
      const drawX = size / 2 - (cxGlyph - PAD)
      const drawY = size / 2 - (cyGlyph - PAD)
      ctx.fillText(symbol, drawX, drawY)
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
      boxSizing: 'content-box',  // переопределяем глобальный border-box,
      // иначе border 2px съедает 4px content-площади и canvas обрезается асимметрично
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
