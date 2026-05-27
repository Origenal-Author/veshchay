'use client'

export default function VerifiedBadge({ size = 16, title = 'Подтверждённый канал' }: { size?: number; title?: string }) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, flexShrink: 0,
        background: 'linear-gradient(135deg, #00FFF0, #00B8D4)',
        borderRadius: '50%',
        boxShadow: '0 0 8px rgba(0,255,240,0.5)',
        verticalAlign: 'middle',
      }}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5 L6.5 12 L13 4.5" stroke="#06060f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
