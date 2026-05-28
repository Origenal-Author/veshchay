interface Props {
  size?: number
  glow?: boolean
}

// Гексагональный чип-байт — иконка игровой валюты.
// 8b = 8 бит = 1 байт.
export default function ByteIcon({ size = 16, glow = true }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <g filter={glow ? 'drop-shadow(0 0 6px #FFB300)' : undefined}>
        <polygon points="50,8 88,30 88,70 50,92 12,70 12,30"
          fill="rgba(255,179,0,0.10)"
          stroke="#FFB300" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="50,22 75,36 75,64 50,78 25,64 25,36"
          fill="none"
          stroke="rgba(255,179,0,0.5)" strokeWidth="1" />
        <text x="50" y="60" textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="26" fontWeight="bold" fill="#FFB300">
          8b
        </text>
      </g>
    </svg>
  )
}
