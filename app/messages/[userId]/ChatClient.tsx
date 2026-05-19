'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Message = { id: string; sender_id: string; receiver_id: string; content: string; read: boolean; created_at: string }
type Profile = { id: string; username: string | null; avatar_url: string | null; rank: string | null }

function timeLabel(date: string) {
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatClient({ currentUserId, otherId, otherProfile, initialMessages }: {
  currentUserId: string
  otherId: string
  otherProfile: Profile
  initialMessages: Message[]
}) {
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      {/* Шапка */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px',
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', padding: '40px 0', letterSpacing: 2 }}>
            // КАНАЛ ОТКРЫТ · НАЧНИ ПЕРЕДАЧУ //
          </div>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === currentUserId
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isMine ? 'rgba(0,255,240,0.1)' : 'var(--surface)',
                border: `1px solid ${isMine ? 'rgba(0,255,240,0.25)' : 'var(--border)'}`,
              }}>
                <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 13, color: 'var(--text)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {m.content}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'var(--subtext)', marginTop: 4, textAlign: 'right', letterSpacing: 1 }}>
                  {timeLabel(m.created_at)}{isMine && (m.read ? ' ·· прочитано' : ' · отправлено')}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid var(--border)',
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
            color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 13,
            padding: '10px 14px', outline: 'none', lineHeight: 1.5,
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
    </div>
  )
}
