import { parseClanSymbol } from '@/lib/clans'

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}

// scale — относительно размера эмблемы; rotate — поворот слоя; opacity — прозрачность.
const LAYERS = [
  { scale: 1.20, rotate: 0,   opacity: 0.30 },
  { scale: 0.85, rotate: 30,  opacity: 0.55 },
  { scale: 0.55, rotate: -15, opacity: 1.00 },
]

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
        // Каждый слой — это квадрат на всю эмблему с символом, центрированным через flex.
        // Это гарантирует, что разные unicode-глифы с разными baseline и метриками
        // выравниваются по геометрическому центру, а не по своим внутренним координатам.
        return (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `rotate(${layer.rotate + rotation}deg) scale(${layer.scale})`,
            transformOrigin: 'center center',
            color,
            opacity: layer.opacity,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            <span style={{ fontSize, lineHeight: 1, display: 'block' }}>{symbol}</span>
          </div>
        )
      })}
      {symbols.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color, opacity: 0.3, fontSize, lineHeight: 1 }}>?</div>
      )}
    </div>
  )
}
