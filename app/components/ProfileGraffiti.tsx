'use client'

import { useState } from 'react'
import { getPreset } from '@/lib/presetAvatars'

interface GraffitiEffect {
  id: string
  effect_data: { imageData?: string; attackerName?: string }
  expires_at: string
}

interface AvatarEffect {
  id: string
  effect_data: { preset?: string; attackerName?: string }
}

interface Props {
  graffitiEffects: GraffitiEffect[]
  avatarOverride: AvatarEffect | null
  isOwner: boolean
}

async function cleanEffect(id: string) {
  await fetch('/api/hack/effects', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ effectId: id }),
  })
}

export default function ProfileGraffiti({ graffitiEffects, avatarOverride, isOwner }: Props) {
  const [graffiti, setGraffiti] = useState(graffitiEffects)
  const [avatar, setAvatar] = useState(avatarOverride)
  const [cleaning, setCleaning] = useState<string | null>(null)

  async function handleClean(id: string, type: 'graffiti' | 'avatar') {
    setCleaning(id)
    await cleanEffect(id)
    if (type === 'graffiti') setGraffiti(g => g.filter(x => x.id !== id))
    else setAvatar(null)
    setCleaning(null)
  }

  if (graffiti.length === 0 && !avatar) return null

  return (
    <div style={{ marginBottom: 32 }}>

      {/* Уведомление о взломанном аватаре */}
      {avatar && isOwner && (
        <div style={{
          marginBottom: 20, padding: '14px 18px',
          background: 'rgba(255,0,110,0.06)',
          border: '1px solid rgba(255,0,110,0.3)',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {(() => {
            const p = getPreset(avatar.effect_data.preset ?? '')
            return (
              <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron,monospace', fontSize: 14, fontWeight: 700, color: p.fg, border: `1px solid ${p.fg}40` }}>
                {p.text}
              </div>
            )
          })()}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, color: '#FF006E', letterSpacing: 2, marginBottom: 3 }}>⚡ АВАТАР ВЗЛОМАН</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080' }}>
              @{avatar.effect_data.attackerName ?? 'аноним'} заменил твой аватар
            </div>
          </div>
          <button
            onClick={() => handleClean(avatar.id, 'avatar')}
            disabled={cleaning === avatar.id}
            style={{ fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 2, padding: '7px 14px', borderRadius: 6, border: '1px solid rgba(0,255,240,0.4)', color: '#00FFF0', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ВОССТАНОВИТЬ
          </button>
        </div>
      )}

      {/* Секция граффити */}
      {graffiti.length > 0 && (
        <div>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#FF006E', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,0,110,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            🎨 СТЕНА ГРАФФИТИ
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', fontWeight: 400, letterSpacing: 1 }}>
              ({graffiti.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {graffiti.map(g => (
              <div
                key={g.id}
                style={{
                  background: 'rgba(6,6,18,0.8)',
                  border: '1px solid rgba(255,0,110,0.25)',
                  borderRadius: 10, overflow: 'hidden',
                }}
              >
                {g.effect_data.imageData && (
                  <img
                    src={g.effect_data.imageData}
                    alt="граффити"
                    style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }}
                  />
                )}
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 1 }}>
                    // от @{g.effect_data.attackerName ?? 'аноним'}
                    {' · '}
                    истекает {new Date(g.expires_at).toLocaleDateString('ru-RU')}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleClean(g.id, 'graffiti')}
                      disabled={cleaning === g.id}
                      style={{ fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 2, padding: '5px 12px', borderRadius: 4, border: '1px solid rgba(0,255,240,0.4)', color: '#00FFF0', background: 'transparent', cursor: 'pointer' }}
                    >
                      {cleaning === g.id ? '...' : 'СТЕРЕТЬ'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
