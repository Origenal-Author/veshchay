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

type Offset = { x: number; y: number }

export default function ClanEmblem({ symbols, color, size = 80 }: {
  symbols: string[]; color: string; size?: number
}) {
  const rgb = hexToRgb(color)
  const radius = Math.round(size * 0.22)
  const fontSize = Math.round(size * 0.55)

  const textRefs = useRef<(SVGTextElement | null)[]>([])
  const [offsets, setOffsets] = useState<Offset[]>([])

  // Измеряем реальный bbox каждого глифа после рендера и шрифта.
  // Сдвигаем text так, чтобы геометрический центр bbox оказался в центре SVG.
  useLayoutEffect(() => {
    let cancelled = false

    function measure() {
      if (cancelled) return
      const news: Offset[] = textRefs.current.map(el => {
        if (!el) return { x: 0, y: 0 }
        try {
          const bbox = el.getBBox()
          if (!bbox.width || !bbox.height) return { x: 0, y: 0 }
          const cx = bbox.x + bbox.width / 2
          const cy = bbox.y + bbox.height / 2
          return { x: size / 2 - cx, y: size / 2 - cy }
        } catch {
          return { x: 0, y: 0 }
        }
      })
      setOffsets(news)
    }

    // Ждём загрузки шрифтов перед измерением, иначе bbox даст значения fallback-шрифта.
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // RAF чтобы дождаться следующего кадра когда шрифт точно применился
        requestAnimationFrame(measure)
      })
    } else {
      measure()
    }

    return () => { cancelled = true }
  }, [symbols.join('|'), fontSize, size])

  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      border: `2px solid ${color}`,
      background: `rgba(${rgb},0.08)`,
      boxShadow: `0 0 ${Math.round(size*0.4)}px rgba(${rgb},0.25)`,
      position: 'relative', flexShrink: 0, overflow: 'hidden',
    }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        {symbols.map((raw, i) => {
          const layer = LAYERS[i] ?? LAYERS[2]
          const { symbol, rotation } = parseClanSymbol(raw)
          const off = offsets[i] ?? { x: 0, y: 0 }
          // SVG transform: scale и rotate вокруг центра (cx, cy) эмблемы
          const transform = `rotate(${layer.rotate + rotation} ${cx} ${cy}) translate(${cx} ${cy}) scale(${layer.scale}) translate(${-cx} ${-cy})`
          return (
            <g key={`${i}-${symbol}-${rotation}`} transform={transform} opacity={layer.opacity}>
              <text
                ref={el => { textRefs.current[i] = el }}
                x={cx + off.x}
                y={cy + off.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fill={color}
                style={{ userSelect: 'none' }}
              >
                {symbol}
              </text>
            </g>
          )
        })}
        {symbols.length === 0 && (
          <text
            x={cx} y={cy}
            textAnchor="middle" dominantBaseline="central"
            fontSize={fontSize} fill={color} opacity={0.3}
          >?</text>
        )}
      </svg>
    </div>
  )
}
