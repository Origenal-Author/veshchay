'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Message = { id: string; sender_id: string; receiver_id: string; content: string; read: boolean; created_at: string }
type Profile = { id: string; username: string | null; avatar_url: string | null; rank: string | null }

const RANK_COLORS: { xp: number; color: string }[] = [
  { xp: 30000, color: '#FFFFFF' },
  { xp: 15000, color: '#FF006E' },
  { xp: 7500,  color: '#FF7B00' },
  { xp: 4000,  color: '#FFB300' },
  { xp: 2000,  color: '#9B10FF' },
  { xp: 1000,  color: '#7AAED4' },
  { xp: 500,   color: '#00FF88' },
  { xp: 200,   color: '#00FFF0' },
  { xp: 75,    color: '#64B5F6' },
  { xp: 0,     color: '#8892B0' },
]

function rankColorByXp(xp: number) {
  return RANK_COLORS.find(r => xp >= r.xp)?.color ?? '#8892B0'
}

function timeLabel(date: string) {
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const PIXEL_FONT = "'VT323', 'Courier New', monospace"

export default function ChatClient({ currentUserId, otherId, otherProfile, otherXp, myXp, initialMessages }: {
  currentUserId: string
  otherId: string
  otherProfile: Profile
  otherXp: number
  myXp: number
  initialMessages: Message[]
}) {
  const myColor = rankColorByXp(myXp)
  const otherColor = rankColorByXp(otherXp)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Полинг каждые 5 сек
  useEffect(() => {
    const iv = setInterval(async () => {
      const res = await fetch(`/api/messages/${otherId}`)
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    }, 5000)
    return () => clearInterval(iv)
  }, [otherId])

  async function send() {
    if (!input.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/messages/${otherId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    })
    const data = await res.json()
    if (data.message) setMessages(prev => [...prev, data.message])
    setInput('')
    setSending(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', position: 'relative', zIndex: 2 }}>

      {/* Левая декоративная панель */}
      <div style={{ flex: 1, borderRight: '1px solid rgba(0,255,240,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20, gap: 16, overflow: 'hidden' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: 'rgba(0,255,240,0.15)', letterSpacing: 3, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>// ЗАШИФРОВАННЫЙ КАНАЛ //</div>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ width: 1 + (i % 3), height: 24 + i * 8, background: `rgba(0,255,240,${0.03 + i * 0.01})`, borderRadius: 1 }} />
        ))}
      </div>

      {/* Основной чат */}
      <div style={{ width: 720, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Шапка */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px',
        height: 60, borderBottom: '1px solid var(--border)',
        background: 'rgba(6,6,18,0.95)', backdropFilter: 'blur(8px)',
        flexShrink: 0,
      }}>
        <Link href="/messages" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)', letterSpacing: 2 }}>←</Link>
        <div style={{
          width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--surface2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 900, color: 'var(--bg)',
        }}>
          {otherProfile.avatar_url
            ? <img src={otherProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (otherProfile.username || '??').slice(0, 2).toUpperCase()
          }
        </div>
        <div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>
            @{otherProfile.username || 'аноним'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'var(--accent)', letterSpacing: 2 }}>
            {otherProfile.rank || 'СТАТИЧЕСКИЙ ШУМ'}
          </div>
        </div>
        <Link href={`/profile/${otherId}`} style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--subtext)', letterSpacing: 1 }}>
          ПРОФИЛЬ →
        </Link>
      </header>

      {/* Сообщения */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', padding: '40px 0', letterSpacing: 2 }}>
            // КАНАЛ ОТКРЫТ · НАЧНИ ПЕРЕДАЧУ //
          </div>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === currentUserId
          const c = isMine ? myColor : otherColor
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '60%', padding: '8px 12px', borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: isMine ? `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},0.10)` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isMine ? c + '40' : 'rgba(255,255,255,0.07)'}`,
              }}>
                <div style={{
                  fontFamily: PIXEL_FONT, fontSize: 20,
                  color: c, lineHeight: 1.15, wordBreak: 'break-word',
                  textShadow: `0 0 6px ${c}55`,
                }}>
                  {m.content}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: 'var(--subtext)', marginTop: 2, textAlign: 'right', letterSpacing: 1, opacity: 0.6 }}>
                  {timeLabel(m.created_at)}{isMine && (m.read ? ' ·· прочитано' : '')}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--border)',
        background: 'rgba(6,6,18,0.95)', backdropFilter: 'blur(8px)',
        display: 'flex', gap: 10, flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="// введи сообщение..."
          rows={1}
          style={{
            flex: 1, resize: 'none', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 8,
            color: myColor, fontFamily: PIXEL_FONT, fontSize: 20,
            padding: '8px 14px', outline: 'none', lineHeight: 1.2,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            padding: '0 18px', borderRadius: 8, border: 'none',
            background: input.trim() ? '#00FFF0' : 'var(--surface)',
            color: input.trim() ? '#000' : 'var(--subtext)',
            fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          {sending ? '...' : '▶'}
        </button>
      </div>
      </div>{/* конец основного чата */}

      {/* Правая декоративная панель */}
      <div style={{ flex: 1, borderLeft: '1px solid rgba(0,255,240,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 20, gap: 16, overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ width: 1 + (i % 3), height: 24 + i * 8, background: `rgba(0,255,240,${0.03 + i * 0.01})`, borderRadius: 1 }} />
        ))}
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: 'rgba(0,255,240,0.15)', letterSpacing: 3, writingMode: 'vertical-rl' }}>// ПЕРЕДАЧА АКТИВНА //</div>
      </div>

    </div>
  )
}
