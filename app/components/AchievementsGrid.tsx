'use client'

import { ACHIEVEMENTS, CATEGORY_LABELS, type AchievementCategory } from '@/lib/achievements'

interface Props {
  unlockedKeys: string[]
  isOwner: boolean
}

export default function AchievementsGrid({ unlockedKeys, isOwner }: Props) {
  const unlockedSet = new Set(unlockedKeys)
  const categories: AchievementCategory[] = ['start', 'activity', 'content', 'pets', 'secret']

  const totalUnlocked = unlockedKeys.length
  const total = ACHIEVEMENTS.length

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{
        fontFamily: 'Orbitron,monospace', fontSize: 12, fontWeight: 700,
        letterSpacing: 3, color: 'var(--accent)',
        marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>// АЧИВКИ</span>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--subtext)' }}>
          {totalUnlocked}/{total} разблокировано
        </span>
      </div>

      {categories.map(cat => {
        const catAchs = ACHIEVEMENTS.filter(a => a.category === cat)
        const catUnlocked = catAchs.filter(a => unlockedSet.has(a.key)).length

        return (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
              color: 'var(--subtext)', letterSpacing: 3,
              marginBottom: 10, opacity: 0.6,
            }}>
              // {CATEGORY_LABELS[cat]} — {catUnlocked}/{catAchs.length}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {catAchs.map(ach => {
                const unlocked = unlockedSet.has(ach.key)
                const isSecret = ach.secret && !unlocked

                return (
                  <div
                    key={ach.key}
                    title={unlocked ? ach.description : isSecret ? '???' : ach.description}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1px solid ${unlocked ? 'rgba(0,255,240,0.25)' : 'rgba(255,255,255,0.05)'}`,
                      background: unlocked ? 'rgba(0,255,240,0.04)' : 'rgba(13,13,26,0.5)',
                      opacity: unlocked ? 1 : 0.45,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                      {isSecret ? '?' : ach.icon}
                    </div>
                    <div style={{
                      fontFamily: 'Orbitron,monospace', fontSize: 8,
                      letterSpacing: 1, color: unlocked ? '#E0E8F0' : '#3A4A5A',
                      marginBottom: 4, lineHeight: 1.4,
                    }}>
                      {isSecret ? '???' : ach.name}
                    </div>
                    {unlocked && (
                      <div style={{
                        fontFamily: 'JetBrains Mono,monospace', fontSize: 8,
                        color: '#506080', lineHeight: 1.4,
                      }}>
                        {ach.description}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
