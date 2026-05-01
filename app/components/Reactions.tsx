'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type ReactionType = 'boost' | 'jam' | null

export default function Reactions({ videoId, userId }: { videoId: string, userId: string | null }) {
  const [boosts, setBoosts] = useState(0)
  const [jams, setJams] = useState(0)
  const [mine, setMine] = useState<ReactionType>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('signals').select('type, user_id').eq('video_id', videoId).then(({ data }) => {
      if (!data) return
      setBoosts(data.filter(r => r.type === 'boost').length)
      setJams(data.filter(r => r.type === 'jam').length)
      if (userId) {
        const my = data.find(r => r.user_id === userId)
        setMine(my ? my.type as ReactionType : null)
      }
    })
  }, [videoId, userId])

  async function react(type: ReactionType) {
    if (!userId || loading) return
    setLoading(true)
    const supabase = createClient()

    if (mine === type) {
      await supabase.from('signals').delete().eq('video_id', videoId).eq('user_id', userId)
      if (type === 'boost') setBoosts(b => b - 1)
      else setJams(j => j - 1)
      setMine(null)
    } else {
      if (mine) {
        await supabase.from('signals').delete().eq('video_id', videoId).eq('user_id', userId)
        if (mine === 'boost') setBoosts(b => b - 1)
        else setJams(j => j - 1)
      }
      await supabase.from('signals').insert({ video_id: videoId, user_id: userId, type })
      if (type === 'boost') setBoosts(b => b + 1)
      else setJams(j => j + 1)
      setMine(type)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      <button
        onClick={() => react('boost')}
        disabled={!userId}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: mine === 'boost' ? 'var(--accent)' : 'var(--surface)',
          border: `1px solid ${mine === 'boost' ? 'var(--accent)' : 'var(--border)'}`,
          color: mine === 'boost' ? 'var(--bg)' : 'var(--text)',
          fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 2,
          cursor: userId ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
          boxShadow: mine === 'boost' ? '0 0 20px var(--accent-glow)' : 'none',
        }}
      >
        <span style={{ fontSize: 16 }}>▲</span>
        УСИЛИТЬ {boosts > 0 && <span style={{ opacity: 0.8 }}>{boosts}</span>}
      </button>
      <button
        onClick={() => react('jam')}
        disabled={!userId}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: mine === 'jam' ? 'rgba(255,0,110,0.2)' : 'var(--surface)',
          border: `1px solid ${mine === 'jam' ? '#FF006E' : 'var(--border)'}`,
          color: mine === 'jam' ? '#FF006E' : 'var(--subtext)',
          fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 2,
          cursor: userId ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 16 }}>▼</span>
        ЗАГЛУШИТЬ {jams > 0 && <span style={{ opacity: 0.8 }}>{jams}</span>}
      </button>
      {!userId && (
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', alignSelf: 'center' }}>
          // войди чтобы реагировать
        </span>
      )}
    </div>
  )
}
