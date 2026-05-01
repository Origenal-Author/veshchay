'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Echo = { id: string; content: string; created_at: string; user_id: string; profiles: { username: string | null } | null }

export default function Echoes({ videoId, userId }: { videoId: string, userId: string | null }) {
  const [echoes, setEchoes] = useState<Echo[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('echoes')
      .select('*, profiles(username)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setEchoes(data as Echo[])
  }

  useEffect(() => { load() }, [videoId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId || loading) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('echoes').insert({ video_id: videoId, user_id: userId, content: text.trim() })
    setText('')
    await load()
    setLoading(false)
  }

  async function deleteEcho(id: string) {
    const supabase = createClient()
    await supabase.from('echoes').delete().eq('id', id)
    setEchoes(prev => prev.filter(e => e.id !== id))
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d > 0) return `${d}д.`
    if (h > 0) return `${h}ч.`
    if (m > 0) return `${m}м.`
    return 'только что'
  }

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 20 }}>
        // ОТКЛИКИ <span style={{ opacity: 0.5, fontSize: 11 }}>({echoes.length})</span>
      </div>

      {userId && (
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Твой отклик на сигнал..."
            maxLength={500}
            style={{ flex: 1, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 13, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="btn-primary-ui"
            style={{ padding: '10px 18px', fontSize: 11, opacity: loading ? 0.6 : 1 }}
          >
            ОТПРАВИТЬ
          </button>
        </form>
      )}

      {!userId && (
        <div style={{ padding: '12px 16px', background: 'rgba(0,255,240,0.04)', border: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', marginBottom: 20 }}>
          // <a href="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Войди</a> чтобы оставить отклик
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {echoes.length === 0 && (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', padding: '20px 0' }}>
            // откликов пока нет — будь первым
          </div>
        )}
        {echoes.map(echo => (
          <div key={echo.id} style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg,var(--accent),var(--subtext))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--bg)', fontFamily: "'Orbitron',monospace", flexShrink: 0 }}>
                {(echo.profiles?.username || '??').slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)' }}>
                @{echo.profiles?.username || 'аноним'}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', marginLeft: 'auto' }}>
                {timeAgo(echo.created_at)}
              </span>
              {userId === echo.user_id && (
                <button onClick={() => deleteEcho(echo.id)} style={{ background: 'none', border: 'none', color: 'var(--subtext)', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>✕</button>
              )}
            </div>
            <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{echo.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
