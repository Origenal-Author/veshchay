function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}

const LAYERS = [
  { scale: 1.4,  rotate: 0,   opacity: 0.35 },
  { scale: 0.95, rotate: 42,  opacity: 0.65 },
  { scale: 0.55, rotate: -18, opacity: 1.0  },
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
      {symbols.map((s, i) => {
        const layer = LAYERS[i] ?? LAYERS[2]
        return (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: `translate(-50%, -50%) rotate(${layer.rotate}deg) scale(${layer.scale})`,
            fontSize,
            color,
            opacity: layer.opacity,
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            {s}
          </div>
        )
      })}
      {symbols.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color, opacity: 0.3, fontSize, lineHeight: 1 }}>?</div>
      )}
    </div>
  )
}
