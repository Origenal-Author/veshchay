'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { parseClanSymbol } from '@/lib/clans'

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}

const LAYERS = [
  { scale: 1.20, rotate: 0,   opacity: 0.30 },
  { scale: 0.85, rotate: 30,  opacity: 0.55 },
  { scale: 0.55, rotate: -15, opacity: 1.00 },
]

// Слой с одним символом: измеряем реальный bbox глифа после рендера
// и корректируем позицию так, чтобы геометрический центр bbox совпал с центром SVG.
function SymbolLayer({
  symbol, rotation, size, fontSize, color, layer,
}: {
  symbol: string
  rotation: number
  size: number
  fontSize: number
  color: string
  layer: { scale: number; rotate: number; opacity: number }
}) {
  const textRef = useRef<SVGTextElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    try {
      const bbox = el.getBBox()
      // Реальный центр глифа
      const cx = bbox.x + bbox.width / 2
      const cy = bbox.y + bbox.height / 2
      // Хотим, чтобы он попал в (size/2, size/2)
      setOffset({ x: size / 2 - cx, y: size / 2 - cy })
    } catch { /* getBBox может бросить если не в DOM */ }
  }, [symbol, fontSize, size])

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: 'absolute', inset: 0,
        opacity: layer.opacity,
        pointerEvents: 'none',
        transform: `rotate(${layer.rotate + rotation}deg) scale(${layer.scale})`,
        transformOrigin: 'center center',
        overflow: 'visible',
      }}
    >
      <text
        ref={textRef}
        x={size / 2 + offset.x}
        y={size / 2 + offset.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fill={color}
        style={{ userSelect: 'none' }}
      >
        {symbol}
      </text>
    </svg>
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
      {symbols.map((raw, i) => {
        const layer = LAYERS[i] ?? LAYERS[2]
        const { symbol, rotation } = parseClanSymbol(raw)
        return (
          <SymbolLayer
            key={`${i}-${symbol}-${rotation}`}
            symbol={symbol}
            rotation={rotation}
            size={size}
            fontSize={fontSize}
            color={color}
            layer={layer}
          />
        )
      })}
      {symbols.length === 0 && (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fill={color}>?</text>
        </svg>
      )}
    </div>
  )
}
