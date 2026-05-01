'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Playlist = { id: string; title: string }

export default function AddToPlaylist({ videoId, userId }: { videoId: string, userId: string }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('playlists').select('id, title').eq('user_id', userId).then(({ data }) => {
      if (data) setPlaylists(data)
    })
    supabase.from('playlist_videos').select('playlist_id').eq('video_id', videoId).then(({ data }) => {
      if (data) setAdded(data.map(d => d.playlist_id))
    })
  }, [videoId, userId])

  async function toggle(playlistId: string) {
    const supabase = createClient()
    if (added.includes(playlistId)) {
      await supabase.from('playlist_videos').delete().eq('playlist_id', playlistId).eq('video_id', videoId)
      setAdded(prev => prev.filter(id => id !== playlistId))
    } else {
      await supabase.from('playlist_videos').insert({ playlist_id: playlistId, video_id: videoId })
      setAdded(prev => [...prev, playlistId])
    }
  }

  if (playlists.length === 0) return null

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost-ui"
        style={{ fontSize: 11, padding: '8px 16px' }}
      >
        ◈ В ПЛЕЙЛИСТ
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, minWidth: 220, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 50 }}>
          {playlists.map(pl => (
            <button
              key={pl.id}
              onClick={() => toggle(pl.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: added.includes(pl.id) ? 'var(--accent)' : 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 14 }}>{added.includes(pl.id) ? '✓' : '+'}</span>
              {pl.title}
            </button>
          ))}
          <a href="/playlists" style={{ display: 'block', padding: '8px 16px', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', textDecoration: 'none', letterSpacing: 1 }}>
            + новый плейлист
          </a>
        </div>
      )}
    </div>
  )
}
